import {useEffect,useMemo,useRef,useState} from "react";
import type {ChangeEvent,CSSProperties} from "react";
import type {StoredTrack,Tab,Track} from "./types";
import {deleteTrack,getBlob,listTracks,saveTrack} from "./lib/db";
import {searchOpenMusic} from "./lib/openverse";

const NAV:Array<{id:Tab;label:string;icon:string}>=[
  {id:"library",label:"Library",icon:"⌂"},
  {id:"discover",label:"Discover",icon:"◌"},
  {id:"downloads",label:"Downloads",icon:"↓"},
  {id:"settings",label:"Settings",icon:"⋯"}
];

const DEMO:Track[]=[
  {id:"demo-1",title:"A room for records",artist:"Music For All",album:"Demo shelf",source:"local"},
  {id:"demo-2",title:"Nothing to stream",artist:"Music For All",album:"Demo shelf",source:"local"},
  {id:"demo-3",title:"Keep what you love",artist:"Music For All",album:"Demo shelf",source:"local"}
];

function Artwork({track,size="normal"}:{track:Track;size?:"normal"|"large"}){
  const seed=[...track.title].reduce((s,c)=>s+c.charCodeAt(0),0);
  return track.artworkUrl
    ? <img className={size==="large"?"artwork artwork-large":"artwork"} src={track.artworkUrl} alt=""/>
    : <div className={size==="large"?"artwork artwork-large artwork-generated":"artwork artwork-generated"} style={{"--hue":seed%36} as CSSProperties}>{track.title.slice(0,1).toUpperCase()}</div>;
}

function formatTime(seconds:number){
  if(!Number.isFinite(seconds)||seconds<0)return "0:00";
  const total=Math.floor(seconds);
  return `${Math.floor(total/60)}:${String(total%60).padStart(2,"0")}`;
}

async function readDuration(file:File){
  const url=URL.createObjectURL(file);
  try{
    const a=document.createElement("audio");
    a.preload="metadata";
    a.src=url;
    await new Promise<void>(resolve=>{
      a.onloadedmetadata=()=>resolve();
      a.onerror=()=>resolve();
    });
    return Number.isFinite(a.duration)?a.duration:undefined;
  }finally{
    URL.revokeObjectURL(url);
  }
}

export default function App(){
  const[tab,setTab]=useState<Tab>("library");
  const[tracks,setTracks]=useState<StoredTrack[]>([]);
  const[openTracks,setOpenTracks]=useState<Track[]>([]);
  const[query,setQuery]=useState("");
  const[searching,setSearching]=useState(false);
  const[selected,setSelected]=useState<Track|null>(null);
  const[playing,setPlaying]=useState(false);
  const[progress,setProgress]=useState(0);
  const[playerOpen,setPlayerOpen]=useState(false);
  const[hint,setHint]=useState(false);
  const[status,setStatus]=useState("");
  const audio=useRef<HTMLAudioElement|null>(null);
  const objectUrl=useRef<string|null>(null);
  const local=useMemo(()=>tracks.length?tracks:DEMO,[tracks]);
  const queue=tab==="discover"&&openTracks.length?openTracks:local;

  useEffect(()=>{listTracks().then(setTracks).catch(()=>undefined)},[]);

  useEffect(()=>{
    if(!selected)return;
    if(!("mediaSession" in navigator))return;
    const media=navigator.mediaSession;
    media.metadata=new MediaMetadata({
      title:selected.title,
      artist:selected.artist,
      album:selected.album,
      artwork:selected.artworkUrl?[{src:selected.artworkUrl}]:[]
    });
    media.setActionHandler("play",()=>toggle());
    media.setActionHandler("pause",()=>toggle());
    media.setActionHandler("previoustrack",()=>step(-1));
    media.setActionHandler("nexttrack",()=>step(1));
    return()=>{
      for(const action of ["play","pause","previoustrack","nexttrack"] as MediaSessionAction[]) {
        try{media.setActionHandler(action,null)}catch{undefined}
      }
    };
  },[selected,playing,queue]);

  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{
      if(e.target instanceof HTMLInputElement)return;
      if(e.code==="Space"){e.preventDefault();toggle()}
      if(e.code==="ArrowRight")seek(progress+10);
      if(e.code==="ArrowLeft")seek(progress-10);
    };
    window.addEventListener("keydown",onKey);
    return()=>window.removeEventListener("keydown",onKey);
  },[progress,selected]);

  async function play(track:Track){
    if(!audio.current)audio.current=new Audio();
    const a=audio.current;
    if(objectUrl.current){URL.revokeObjectURL(objectUrl.current);objectUrl.current=null}
    let src=track.audioUrl;
    if(track.blobId){
      const blob=await getBlob(track.blobId);
      if(!blob){setStatus("This local file is no longer available.");return}
      src=URL.createObjectURL(blob);
      objectUrl.current=src;
    }
    setSelected(track);
    setProgress(0);
    setPlayerOpen(true);
    if(!src){setPlaying(false);return}
    a.src=src;
    a.ontimeupdate=()=>{
      setProgress(a.currentTime);
      if(Number.isFinite(a.duration)&&a.duration>0&&track.duration!==a.duration){
        setSelected(prev=>prev&&prev.id===track.id?{...prev,duration:a.duration}:prev);
      }
      const media=navigator.mediaSession;
      if(media&&"setPositionState" in media&&Number.isFinite(a.duration)&&a.duration>0){
        try{media.setPositionState({duration:a.duration,playbackRate:a.playbackRate,position:Math.min(a.currentTime,a.duration)})}catch{undefined}
      }
    };
    a.onended=()=>{setPlaying(false);step(1)};
    a.onerror=()=>{setPlaying(false);setStatus("This audio source could not be played here.")};
    try{
      await a.play();
      setPlaying(true);
      setStatus("");
    }catch{
      setPlaying(false);
      setStatus("Playback needs a tap to start or the source blocked browser playback.");
    }
  }

  function toggle(){
    if(!audio.current||!selected)return;
    if(audio.current.paused)audio.current.play().then(()=>setPlaying(true)).catch(()=>undefined);
    else{audio.current.pause();setPlaying(false)}
  }

  function seek(value:number){
    if(!audio.current||!Number.isFinite(audio.current.duration))return;
    audio.current.currentTime=Math.max(0,Math.min(value,audio.current.duration));
    setProgress(audio.current.currentTime);
  }

  function step(direction:number){
    if(!selected||!queue.length)return;
    const index=queue.findIndex(t=>t.id===selected.id);
    const next=queue[(index+direction+queue.length)%queue.length];
    if(next&&next.id!==selected.id)void play(next);
  }

  async function importFiles(e:ChangeEvent<HTMLInputElement>){
    for(const file of [...(e.target.files||[])]){
      const id=crypto.randomUUID(),blobId=crypto.randomUUID(),title=file.name.replace(/\.[^.]+$/,"");
      const duration=await readDuration(file);
      await saveTrack({id,blobId,title,artist:"Imported file",album:"Local library",source:"local",duration,addedAt:Date.now()},file);
    }
    setTracks(await listTracks());
    e.target.value="";
    setStatus("Added to your local shelf.");
  }

  async function search(){
    if(!query.trim())return;
    setSearching(true);setStatus("");
    try{setOpenTracks(await searchOpenMusic(query.trim()))}
    catch{setOpenTracks([]);setStatus("Open music search is unavailable right now.")}
    finally{setSearching(false)}
  }

  async function download(track:Track){
    if(!track.audioUrl||(track.license!=="cc0"&&track.license!=="public-domain"))return;
    setStatus("Saving a local copy…");
    try{
      const r=await fetch(track.audioUrl);
      if(!r.ok)throw new Error("download");
      const stored:StoredTrack={...track,blobId:crypto.randomUUID(),addedAt:Date.now()};
      await saveTrack(stored,await r.blob());
      setTracks(await listTracks());
      setStatus("Saved to Downloads.");
    }catch{setStatus("This source does not allow a browser-side download. Open the source page to retrieve it.")}
  }

  async function remove(track:StoredTrack){
    await deleteTrack(track.id,track.blobId);
    setTracks(await listTracks());
    if(selected?.id===track.id){
      audio.current?.pause();setSelected(null);setPlaying(false);setPlayerOpen(false);
    }
  }

  const page=tab==="library"
    ? <Library local={local} tracks={tracks} play={play} importFiles={importFiles}/>
    : tab==="discover"
      ? <Discover query={query} setQuery={setQuery} search={search} searching={searching} results={openTracks} play={play} download={download}/>
      : tab==="downloads"
        ? <Downloads tracks={tracks} play={play} remove={remove}/>
        : <Settings show={()=>setHint(true)}/>;

  return <div className="app-shell">
    <div className="ambient ambient-one"/>
    <div className="ambient ambient-two"/>
    <header className="topbar glass-surface">
      <div className="wordmark">music<span>for</span>all</div>
      <div className="topbar-meta">local first · open by default</div>
    </header>
    <main>{page}</main>

    {status&&<button className="status-toast" onClick={()=>setStatus("")}>{status}<span>×</span></button>}

    {selected&&<div className="mini glass-surface">
      <button className="mini-main" onClick={()=>setPlayerOpen(true)}>
        <Artwork track={selected}/>
        <span><b>{selected.title}</b><small>{selected.artist}</small></span>
      </button>
      <div className="mini-progress" style={{"--progress":`${selected.duration?Math.min(progress/selected.duration,1)*100:0}%`} as CSSProperties}/>
      <button className="play" aria-label={playing?"Pause":"Play"} onClick={toggle}>{playing?"Ⅱ":"▶"}</button>
    </div>}

    <nav className="nav glass-surface">
      {NAV.map(n=><button className={tab===n.id?"nav-item active":"nav-item"} key={n.id} onClick={()=>setTab(n.id)}><span>{n.icon}</span>{n.label}</button>)}
    </nav>

    {playerOpen&&selected&&<NowPlaying track={selected} progress={progress} playing={playing} toggle={toggle} seek={seek} previous={()=>step(-1)} next={()=>step(1)} close={()=>setPlayerOpen(false)} status={status}/>}
    {hint&&<div className="backdrop" onClick={()=>setHint(false)}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <button className="close" onClick={()=>setHint(false)}>×</button>
        <div className="eyebrow">MAKE IT AN APP</div>
        <h2>Put Music For All on your Home Screen.</h2>
        <p>Safari on iPhone → Share → Add to Home Screen → turn on “Open as Web App” → Add.</p>
        <button className="button dark" onClick={()=>setHint(false)}>Got it</button>
      </div>
    </div>}
  </div>
}

function NowPlaying({track,progress,playing,toggle,seek,previous,next,close,status}:{track:Track;progress:number;playing:boolean;toggle:()=>void;seek:(n:number)=>void;previous:()=>void;next:()=>void;close:()=>void;status:string}){
  const duration=track.duration||0;
  return <div className="player-backdrop" onClick={close}>
    <section className="player-sheet" onClick={e=>e.stopPropagation()}>
      <button className="player-close" onClick={close}>⌄</button>
      <div className="player-label">NOW PLAYING</div>
      <Artwork track={track} size="large"/>
      <div className="player-copy">
        <h2>{track.title}</h2>
        <p>{track.artist}</p>
        <small>{track.album}</small>
      </div>
      <div className="seek-wrap">
        <input aria-label="Playback position" type="range" min="0" max={duration||1} step="0.1" value={Math.min(progress,duration||1)} onChange={e=>seek(Number(e.target.value))}/>
        <div><span>{formatTime(progress)}</span><span>{formatTime(duration)}</span></div>
      </div>
      <div className="player-controls">
        <button onClick={previous} aria-label="Previous track">↞</button>
        <button className="player-play" onClick={toggle} aria-label={playing?"Pause":"Play"}>{playing?"Ⅱ":"▶"}</button>
        <button onClick={next} aria-label="Next track">↠</button>
      </div>
      <div className="player-meta">
        <span>{track.source==="open"?(track.license==="cc0"?"CC0":"PUBLIC DOMAIN"):"LOCAL"}</span>
        {track.sourceUrl&&<a href={track.sourceUrl} target="_blank" rel="noreferrer">Source ↗</a>}
      </div>
      {status&&<div className="player-status">{status}</div>}
    </section>
  </div>
}

function Library({local,tracks,play,importFiles}:{local:Track[];tracks:StoredTrack[];play:(t:Track)=>void;importFiles:(e:ChangeEvent<HTMLInputElement>)=>void}){
  return <section className="page">
    <div className="eyebrow">YOUR MUSIC</div><h1>Your library</h1>
    <p className="lede">Everything you keep. Nothing you don't.</p>
    <div className="toolbar">
      <label className="button dark glass-control">Import music<input hidden type="file" multiple accept="audio/*,.flac,.m4a,.mp3,.wav,.aiff" onChange={importFiles}/></label>
      <button className="button glass-control" onClick={()=>local[0]&&play(local[0])}>Play something</button>
    </div>
    <div className="section-head"><span>Recently added</span><span>{tracks.length} files</span></div>
    <div className="tracks">{local.map(t=><Row key={t.id} track={t} play={play}/>)}</div>
    {!tracks.length&&<div className="notice"><b>Your first shelf is empty.</b><span>Import audio from Files or your Mac. Nothing is uploaded to a Music For All server.</span></div>}
  </section>
}

function Discover({query,setQuery,search,searching,results,play,download}:{query:string;setQuery:(s:string)=>void;search:()=>void;searching:boolean;results:Track[];play:(t:Track)=>void;download:(t:Track)=>void}){
  return <section className="page">
    <div className="eyebrow">OPEN MUSIC</div><h1>Music you can actually keep.</h1>
    <p className="lede">Search openly licensed audio. Downloads are limited to records marked Public Domain or CC0.</p>
    <div className="search"><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()} placeholder="Search classical, ambient, field recordings…"/><button onClick={search}>{searching?"…":"Search"}</button></div>
    <div className="rights">Openverse says licence information should be verified per work. We therefore narrow downloads instead of treating every open licence as unrestricted. <a href="https://docs.openverse.org/" target="_blank" rel="noreferrer">Read the rights model</a></div>
    <div className="tracks">{results.map(t=><Row key={t.id} track={t} play={play} download={download}/>)}</div>
    {!results.length&&<div className="empty">Search for something. The interface stays quiet until you ask.</div>}
  </section>
}

function Downloads({tracks,play,remove}:{tracks:StoredTrack[];play:(t:Track)=>void;remove:(t:StoredTrack)=>void}){
  return <section className="page">
    <div className="eyebrow">OFFLINE</div><h1>Downloads</h1><p className="lede">Files Music For All has stored locally.</p>
    <div className="tracks">{tracks.map(t=><Row key={t.id} track={t} play={play} remove={remove}/>)}</div>
    {!tracks.length&&<div className="empty">Nothing offline yet.</div>}
  </section>
}

function Settings({show}:{show:()=>void}){
  return <section className="page">
    <div className="eyebrow">SYSTEM</div><h1>Settings</h1><p className="lede">The quiet machinery behind the shelf.</p>
    <div className="settings glass-surface">
      <div><b>Install as an app</b><span>Safari → Share → Add to Home Screen → Open as Web App.</span><button onClick={show}>Show</button></div>
      <div><b>Local-first</b><span>Imported and downloaded audio stays in this browser on this device.</span><em>ON</em></div>
      <div><b>Connected services</b><span>Apple Music and Spotify stay separate from owned files and require their own authentication/configuration.</span><em>PLANNED</em></div>
    </div>
    <div className="about">Music For All · open source <a href="https://github.com/madebykraman/musicforall" target="_blank" rel="noreferrer">GitHub</a></div>
  </section>
}

function Row({track,play,download,remove}:{track:Track;play:(t:Track)=>void;download?:(t:Track)=>void;remove?:(t:StoredTrack)=>void}){
  return <article className="row">
    <button className="art-button" onClick={()=>play(track)}><Artwork track={track}/></button>
    <button className="copy" onClick={()=>play(track)}><b>{track.title}</b><span>{track.artist} · {track.album}</span></button>
    <small className="source">{track.source==="open"?(track.license==="cc0"?"CC0":"PUBLIC DOMAIN"):"LOCAL"}</small>
    {download&&<button className="icon" aria-label="Download" onClick={()=>download(track)}>↓</button>}
    {remove&&<button className="icon" aria-label="Remove" onClick={()=>remove(track as StoredTrack)}>×</button>}
  </article>
}
