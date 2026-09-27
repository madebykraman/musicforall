import {useEffect,useMemo,useRef,useState} from "react";
import type {ChangeEvent,CSSProperties,ReactNode,RefObject} from "react";
import type {StoredTrack,Tab,Track} from "./types";
import {deleteTrack,getBlob,listTracks,saveTrack} from "./lib/db";
import {searchOpenMusic} from "./lib/openverse";
import {parseBlob} from "music-metadata";

type LibraryMode="songs"|"albums"|"artists";

const NAV:[Tab,string,string][]=[
  ["library","Library","library"],["discover","Discover","compass"],["downloads","Downloads","download"],["settings","Settings","settings"]
];

function Icon({name,size=18}:{name:string;size?:number}){
  const common={width:size,height:size,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round" as const,strokeLinejoin:"round" as const,ariaHidden:true};
  const paths:Record<string,ReactNode>={
    library:<><path d="M4 5.5h16v14H4z"/><path d="M8 3.5v4M16 3.5v4M4 9h16"/></>,
    compass:<><circle cx="12" cy="12" r="8.5"/><path d="m14.8 9.2-1.6 4-4 1.6 1.6-4z"/></>,
    download:<><path d="M12 3v11"/><path d="m7.5 9.5 4.5 4.5 4.5-4.5"/><path d="M5 19.5h14"/></>,
    settings:<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-2.6v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.5-1H6.3v-2.6h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.2h2.6v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2V14h-.2a1.7 1.7 0 0 0-1.5 1Z"/></>,
    search:<><circle cx="10.8" cy="10.8" r="6.4"/><path d="m16 16 4 4"/></>,
    play:<path fill="currentColor" stroke="none" d="m9 6 10 6-10 6z"/>,
    pause:<><path d="M9 6v12M15 6v12"/></>,
    previous:<><path d="M6 5v14"/><path d="m18 6-9 6 9 6z"/></>,
    next:<><path d="M18 5v14"/><path d="m6 6 9 6-9 6z"/></>,
    close:<><path d="m6 6 12 12M18 6 6 18"/></>,
    more:<><circle cx="6" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1" fill="currentColor" stroke="none"/></>,
    chevron:<path d="m9 18 6-6-6-6"/>,
    shuffle:<><path d="M3 7h3c4 0 5 10 9 10h6"/><path d="m18 14 3 3-3 3"/><path d="M3 17h3c1.3 0 2.3-.7 3-1.5M15 7h3l3 3"/></>
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function formatTime(seconds:number){
  if(!Number.isFinite(seconds)||seconds<0)return "0:00";
  const total=Math.floor(seconds);
  return `${Math.floor(total/60)}:${String(total%60).padStart(2,"0")}`;
}

function Artwork({track,size="normal"}:{track:Track;size?:"normal"|"large"|"card"}){
  const seed=[...track.title+track.artist].reduce((s,c)=>s+c.charCodeAt(0),0);
  return track.artworkUrl
    ? <img className={`artwork artwork-${size}`} src={track.artworkUrl} alt=""/>
    : <div className={`artwork artwork-${size} artwork-generated`} style={{"--hue":seed%360} as CSSProperties}>
        <span>{track.title.slice(0,1).toUpperCase()}</span>
      </div>;
}

async function readMetadata(file:File){
  try{
    const metadata=await parseBlob(file);
    const picture=metadata.common.picture?.[0];
    let artworkUrl:string|undefined;
    if(picture){
      let binary="";
      const chunk=0x8000;
      for(let i=0;i<picture.data.length;i+=chunk)binary+=String.fromCharCode(...picture.data.subarray(i,i+chunk));
      artworkUrl="data:"+picture.format+";base64,"+btoa(binary);
    }
    return {
      title:metadata.common.title?.trim()||file.name.replace(/\.[^.]+$/,""),
      artist:metadata.common.artist?.trim()||"Unknown artist",
      album:metadata.common.album?.trim()||"Unknown album",
      duration:metadata.format.duration,
      artworkUrl
    };
  }catch{
    return {
      title:file.name.replace(/\.[^.]+$/,""),
      artist:"Unknown artist",
      album:"Unknown album",
      duration:await readDuration(file)
    };
  }
}
async function readDuration(file:File){
  const url=URL.createObjectURL(file);
  try{
    const a=document.createElement("audio");a.preload="metadata";a.src=url;
    await new Promise<void>(resolve=>{a.onloadedmetadata=()=>resolve();a.onerror=()=>resolve()});
    return Number.isFinite(a.duration)?a.duration:undefined;
  }finally{URL.revokeObjectURL(url)}
}

export default function App(){
  const[tab,setTab]=useState<Tab>("library");
  const[tracks,setTracks]=useState<StoredTrack[]>([]);
  const[openTracks,setOpenTracks]=useState<Track[]>([]);
  const[query,setQuery]=useState("");
  const[libraryQuery,setLibraryQuery]=useState("");
  const[libraryMode,setLibraryMode]=useState<LibraryMode>("songs");
  const[searching,setSearching]=useState(false);
  const[selected,setSelected]=useState<Track|null>(null);
  const[playing,setPlaying]=useState(false);
  const[progress,setProgress]=useState(0);
  const[playerOpen,setPlayerOpen]=useState(false);
  const[queueOpen,setQueueOpen]=useState(false);
  const[hint,setHint]=useState(false);
  const[status,setStatus]=useState("");
  const librarySearchRef=useRef<HTMLInputElement|null>(null);
  const discoverSearchRef=useRef<HTMLInputElement|null>(null);
  const audio=useRef<HTMLAudioElement|null>(null);
  const objectUrl=useRef<string|null>(null);
  const local=tracks;
  const filtered=useMemo(()=>{
    const q=libraryQuery.trim().toLowerCase();
    return q?local.filter(t=>[t.title,t.artist,t.album].some(v=>v.toLowerCase().includes(q))):local;
  },[local,libraryQuery]);
  const queue=tab==="discover"&&openTracks.length?openTracks:local;

  useEffect(()=>{listTracks().then(setTracks).catch(()=>undefined)},[]);

  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{
      if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){
        e.preventDefault();
        if(tab==="discover")discoverSearchRef.current?.focus();
        else {if(tab!=="library")setTab("library");window.setTimeout(()=>librarySearchRef.current?.focus(),0)}
      }
    };
    window.addEventListener("keydown",onKey);
    return()=>window.removeEventListener("keydown",onKey);
  },[tab]);

  useEffect(()=>{
    if(!selected||!("mediaSession" in navigator))return;
    const media=navigator.mediaSession;
    media.metadata=new MediaMetadata({title:selected.title,artist:selected.artist,album:selected.album,artwork:selected.artworkUrl?[{src:selected.artworkUrl}]:[]});
    for(const [action,fn] of [["play",toggle],["pause",toggle],["previoustrack",()=>step(-1)],["nexttrack",()=>step(1)]] as const){
      try{media.setActionHandler(action,fn)}catch{undefined}
    }
    return()=>{for(const action of ["play","pause","previoustrack","nexttrack"] as MediaSessionAction[]){try{media.setActionHandler(action,null)}catch{undefined}}};
  },[selected,playing,queue]);

  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{
      if(e.target instanceof HTMLInputElement)return;
      if(e.code==="Space"){e.preventDefault();toggle()}
      if(e.code==="ArrowRight")seek(progress+10);
      if(e.code==="ArrowLeft")seek(progress-10);
    };
    window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey);
  },[progress,selected]);

  async function play(track:Track){
    if(!audio.current)audio.current=new Audio();
    const a=audio.current;
    if(objectUrl.current){URL.revokeObjectURL(objectUrl.current);objectUrl.current=null}
    let src=track.audioUrl;
    if(track.blobId){
      const blob=await getBlob(track.blobId);
      if(!blob){setStatus("This local file is no longer available.");return}
      src=URL.createObjectURL(blob);objectUrl.current=src;
    }
    setSelected(track);setProgress(0);setPlayerOpen(true);
    if(!src){setPlaying(false);return}
    a.src=src;
    a.ontimeupdate=()=>{
      setProgress(a.currentTime);
      if(Number.isFinite(a.duration)&&a.duration>0&&track.duration!==a.duration)setSelected(prev=>prev&&prev.id===track.id?{...prev,duration:a.duration}:prev);
      if("mediaSession" in navigator&&"setPositionState" in navigator.mediaSession&&Number.isFinite(a.duration)&&a.duration>0){
        try{navigator.mediaSession.setPositionState({duration:a.duration,playbackRate:a.playbackRate,position:Math.min(a.currentTime,a.duration)})}catch{undefined}
      }
    };
    a.onended=()=>{setPlaying(false);step(1)};
    a.onerror=()=>{setPlaying(false);setStatus("This audio source could not be played here.")};
    try{await a.play();setPlaying(true);setStatus("")}catch{setPlaying(false);setStatus("Playback needs a tap to start or the source blocked browser playback.")}
  }

  function toggle(){
    if(!audio.current||!selected)return;
    if(audio.current.paused)audio.current.play().then(()=>setPlaying(true)).catch(()=>undefined);
    else{audio.current.pause();setPlaying(false)}
  }

  function seek(value:number){
    if(!audio.current||!Number.isFinite(audio.current.duration))return;
    audio.current.currentTime=Math.max(0,Math.min(value,audio.current.duration));setProgress(audio.current.currentTime);
  }

  function step(direction:number){
    if(!selected||!queue.length)return;
    const index=queue.findIndex(t=>t.id===selected.id);
    const next=queue[(index+direction+queue.length)%queue.length];
    if(next&&next.id!==selected.id)void play(next);
  }

  async function importFiles(e:ChangeEvent<HTMLInputElement>){
    const files=[...(e.target.files||[])];
    if(!files.length)return;
    setStatus("Reading "+files.length+" "+(files.length===1?"track":"tracks")+"…");
    for(const file of files){
      const id=crypto.randomUUID(),blobId=crypto.randomUUID();
      const metadata=await readMetadata(file);
      await saveTrack({id,blobId,title:metadata.title,artist:metadata.artist,album:metadata.album,source:"local",duration:metadata.duration,artworkUrl:metadata.artworkUrl,addedAt:Date.now()},file);
    }
    setTracks(await listTracks());e.target.value="";setStatus("Added "+files.length+" "+(files.length===1?"track":"tracks")+" to your library.");
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
      const r=await fetch(track.audioUrl);if(!r.ok)throw new Error();
      const stored:StoredTrack={...track,blobId:crypto.randomUUID(),addedAt:Date.now()};
      await saveTrack(stored,await r.blob());setTracks(await listTracks());setStatus("Saved to Downloads.");
    }catch{setStatus("This source blocks browser downloads. Use its source page instead.")}
  }

  async function remove(track:StoredTrack){
    await deleteTrack(track.id,track.blobId);setTracks(await listTracks());
    if(selected?.id===track.id){audio.current?.pause();setSelected(null);setPlaying(false);setPlayerOpen(false)}
  }

  const page=tab==="library"
    ? <Library local={filtered} total={local.length} mode={libraryMode} setMode={setLibraryMode} query={libraryQuery} setQuery={setLibraryQuery} searchRef={librarySearchRef} play={play} importFiles={importFiles}/>
    : tab==="discover"
      ? <Discover query={query} setQuery={setQuery} search={search} searching={searching} results={openTracks} play={play} download={download} searchRef={discoverSearchRef}/>
      : tab==="downloads"
        ? <Downloads tracks={tracks} play={play} remove={remove}/>
        : <Settings show={()=>setHint(true)}/>;

  return <div className="app-shell">
    <div className="ambient ambient-one"/><div className="ambient ambient-two"/>
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">m</span><span>music for all</span></div>
      <div className="sidebar-label">Library</div>
      <nav>{NAV.map(([id,label,icon])=><button key={id} className={tab===id?"side-item active":"side-item"} onClick={()=>setTab(id)}><Icon name={icon}/><span>{label}</span>{id==="downloads"&&tracks.length>0&&<i>{tracks.length}</i>}</button>)}</nav>
      <div className="sidebar-bottom"><span>LOCAL FIRST</span><small>Nothing leaves this device.</small></div>
    </aside>
    <header className="topbar">
      <div className="mobile-brand"><span className="brand-mark">m</span>music for all</div>
      <div className="topbar-right"><button className="top-search" onClick={()=>{if(tab==="discover")discoverSearchRef.current?.focus();else{if(tab!=="library")setTab("library");window.setTimeout(()=>librarySearchRef.current?.focus(),0)}}}><Icon name="search" size={17}/><span>{tab==="library"?"Search your library":"Search"}</span><kbd>⌘ K</kbd></button></div>
    </header>
    <main>{page}</main>
    <nav className="mobile-nav" aria-label="Primary">{NAV.map(([id,label,icon])=><button key={id} className={tab===id?"active":""} onClick={()=>setTab(id)}><Icon name={icon} size={17}/><span>{label}</span></button>)}</nav>

    {status&&<button className="status-toast" onClick={()=>setStatus("")}>{status}<Icon name="close" size={15}/></button>}

    {selected&&<div className="mini-player">
      <div className="mini-progress" style={{"--progress":`${selected.duration?Math.min(progress/selected.duration,1)*100:0}%`} as CSSProperties}/>
      <button className="mini-track" onClick={()=>setPlayerOpen(true)}><Artwork track={selected}/><span><b>{selected.title}</b><small>{selected.artist}</small></span></button>
      <div className="mini-actions"><button onClick={()=>step(-1)} aria-label="Previous"><Icon name="previous" size={17}/></button><button className="mini-play" onClick={toggle} aria-label={playing?"Pause":"Play"}><Icon name={playing?"pause":"play"} size={17}/></button><button onClick={()=>step(1)} aria-label="Next"><Icon name="next" size={17}/></button><button className="queue-toggle" onClick={()=>setQueueOpen(v=>!v)}><Icon name="more" size={18}/></button></div>
    </div>}

    {queueOpen&&selected&&<Queue tracks={queue} selected={selected} play={play} close={()=>setQueueOpen(false)}/>}
    {playerOpen&&selected&&<NowPlaying track={selected} progress={progress} playing={playing} toggle={toggle} seek={seek} previous={()=>step(-1)} next={()=>step(1)} close={()=>setPlayerOpen(false)} queue={()=>setQueueOpen(true)} status={status}/>}
    {hint&&<div className="backdrop" onClick={()=>setHint(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setHint(false)}><Icon name="close"/></button><div className="eyebrow">INSTALL</div><h2>Keep Music For All one tap away.</h2><p>Safari → Share → Add to Home Screen → turn on “Open as Web App” → Add.</p><button className="primary" onClick={()=>setHint(false)}>Done</button></div></div>}
  </div>
}

function Library({local,total,mode,setMode,query,setQuery,searchRef,play,importFiles}:{local:Track[];total:number;mode:LibraryMode;setMode:(m:LibraryMode)=>void;query:string;setQuery:(q:string)=>void;searchRef:RefObject<HTMLInputElement|null>;play:(t:Track)=>void;importFiles:(e:ChangeEvent<HTMLInputElement>)=>void}){
  const albums=Array.from(new Map(local.map(t=>[t.album,t])).values());
  const artists=Array.from(new Map(local.map(t=>[t.artist,t])).values());
  return <section className="page">
    <div className="page-head"><div><div className="eyebrow">YOUR COLLECTION</div><h1>Library</h1></div><label className="primary import">Import music<input hidden type="file" multiple accept="audio/*,.flac,.m4a,.mp3,.wav,.aiff" onChange={importFiles}/></label></div>
    <div className="library-tools"><div className="segmented">{(["songs","albums","artists"] as LibraryMode[]).map(m=><button key={m} className={mode===m?"active":""} onClick={()=>setMode(m)}>{m[0].toUpperCase()+m.slice(1)}</button>)}</div><label className="library-search"><Icon name="search" size={16}/><input ref={searchRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search library"/></label></div>
    {mode==="songs"&&<SongView tracks={local} play={play}/>}
    {mode==="albums"&&<CardGrid items={albums} type="album" play={play}/>}
    {mode==="artists"&&<CardGrid items={artists} type="artist" play={play}/>}
    {!local.length&&<div className="empty-state"><div className="empty-art">+</div><h3>Start with your own music.</h3><p>Import MP3, FLAC, M4A, WAV or AIFF files. They stay in this browser and are never uploaded to Music For All.</p><label className="primary">Choose files<input hidden type="file" multiple accept="audio/*,.flac,.m4a,.mp3,.wav,.aiff" onChange={importFiles}/></label></div>}
    <div className="library-foot"><span>{total} {total===1?"track":"tracks"} in this browser</span><span>Local library</span></div>
  </section>
}

function SongView({tracks,play}:{tracks:Track[];play:(t:Track)=>void}){
  return <div className="song-list"><div className="list-head"><span>#</span><span>Title</span><span>Album</span><span>Source</span><span>Time</span></div>{tracks.map((t,i)=><button className="song-row" key={t.id} onClick={()=>play(t)}><span className="song-index">{String(i+1).padStart(2,"0")}</span><span className="song-title"><Artwork track={t}/><span><b>{t.title}</b><small>{t.artist}</small></span></span><span className="song-album">{t.album}</span><span className="song-source">{t.source==="open"?(t.license==="cc0"?"CC0":"PDM"):"LOCAL"}</span><span className="song-time">{t.duration?formatTime(t.duration):"—"}</span></button>)}</div>
}

function CardGrid({items,type,play}:{items:Track[];type:"album"|"artist";play:(t:Track)=>void}){
  return <div className={type==="artist"?"card-grid artist-grid":"card-grid"}>{items.map(t=><button className="media-card" key={type==="album"?t.album:t.artist} onClick={()=>play(t)}><Artwork track={t} size="card"/><b>{type==="album"?t.album:t.artist}</b><span>{type==="album"?t.artist:"Artist"}</span></button>)}</div>
}

function Discover({query,setQuery,search,searching,results,play,download,searchRef}:{query:string;setQuery:(s:string)=>void;search:()=>void;searching:boolean;results:Track[];play:(t:Track)=>void;download:(t:Track)=>void;searchRef:React.RefObject<HTMLInputElement|null>}){
  return <section className="page"><div className="eyebrow">OPEN CATALOGUE</div><h1>Discover music you can keep.</h1><p className="lede">A narrow, rights-aware doorway into public-domain and CC0 audio.</p><div className="discover-search"><Icon name="search"/><input ref={searchRef} value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()} placeholder="Try “piano”, “rain”, “Debussy”…"/><button onClick={search}>{searching?"Searching":"Search"}</button></div><div className="rights">Downloads are restricted to Public Domain and CC0. Open licences still need to be checked per work. <a href="https://docs.openverse.org/" target="_blank" rel="noreferrer">Rights model ↗</a></div><div className="song-list discover-list">{results.map((t,i)=><button className="song-row" key={t.id} onClick={()=>play(t)}><span className="song-index">{String(i+1).padStart(2,"0")}</span><span className="song-title"><Artwork track={t}/><span><b>{t.title}</b><small>{t.artist}</small></span></span><span className="song-album">{t.provider||"Open music"}</span><span className="song-source">{t.license==="cc0"?"CC0":"PDM"}</span><span className="row-download" onClick={e=>{e.stopPropagation();download(t)}}>↓</span></button>)}</div>{!results.length&&<div className="quiet-state">Search the open catalogue. Results will appear here without changing your library.</div>}</section>
}

function Downloads({tracks,play,remove}:{tracks:StoredTrack[];play:(t:Track)=>void;remove:(t:StoredTrack)=>void}){
  return <section className="page"><div className="eyebrow">OFFLINE</div><h1>Downloads</h1><p className="lede">Audio you chose to store in this browser.</p>{tracks.length?<SongView tracks={tracks} play={play}/>:<div className="empty-state compact"><div className="empty-art"><Icon name="download" size={26}/></div><h3>Nothing offline yet.</h3><p>Public-domain and CC0 results can be saved here when their source permits browser downloads.</p></div>} {tracks.length>0&&<div className="download-manage">{tracks.map(t=><button key={t.id} onClick={()=>remove(t)}>Remove {t.title}</button>)}</div>}</section>
}

function Settings({show}:{show:()=>void}){
  return <section className="page"><div className="eyebrow">SYSTEM</div><h1>Settings</h1><p className="lede">A small, local music shelf. No account required.</p><div className="settings-list"><div className="setting-row"><span><b>Install as an app</b><small>Keep it on your Home Screen and use it like an app.</small></span><button onClick={show}>How</button></div><div className="setting-row"><span><b>Local-first storage</b><small>Imported and downloaded audio stays inside this browser on this device.</small></span><em>ON</em></div><div className="setting-row"><span><b>Connected services</b><small>Apple Music and Spotify are optional adapters, never mixed with your owned files.</small></span><em>PLANNED</em></div></div><div className="about"><span>Music For All · open source · MIT</span><a href="https://github.com/madebykraman/musicforall" target="_blank" rel="noreferrer">GitHub ↗</a></div></section>
}

function Queue({tracks,selected,play,close}:{tracks:Track[];selected:Track;play:(t:Track)=>void;close:()=>void}){
  return <div className="queue-popover"><div className="queue-head"><span>UP NEXT</span><button onClick={close}><Icon name="close" size={16}/></button></div>{tracks.map(t=><button className={t.id===selected.id?"queue-row current":"queue-row"} key={t.id} onClick={()=>play(t)}><Artwork track={t}/><span><b>{t.title}</b><small>{t.artist}</small></span>{t.id===selected.id&&<i>Playing</i>}</button>)}</div>
}

function NowPlaying({track,progress,playing,toggle,seek,previous,next,close,queue,status}:{track:Track;progress:number;playing:boolean;toggle:()=>void;seek:(n:number)=>void;previous:()=>void;next:()=>void;close:()=>void;queue:()=>void;status:string}){
  const duration=track.duration||0;
  return <div className="player-backdrop" onClick={close}><section className="player-sheet" onClick={e=>e.stopPropagation()}><div className="player-toolbar"><button onClick={close}><Icon name="chevron" size={20}/></button><span>NOW PLAYING</span><button onClick={queue}><Icon name="more" size={19}/></button></div><Artwork track={track} size="large"/><div className="player-copy"><div><h2>{track.title}</h2><p>{track.artist}</p></div><button><Icon name="more" size={19}/></button></div><div className="seek-wrap"><input aria-label="Playback position" type="range" min="0" max={duration||1} step=".1" value={Math.min(progress,duration||1)} onChange={e=>seek(Number(e.target.value))}/><div><span>{formatTime(progress)}</span><span>{formatTime(duration)}</span></div></div><div className="player-controls"><button onClick={previous} aria-label="Previous"><Icon name="previous" size={23}/></button><button className="player-play" onClick={toggle} aria-label={playing?"Pause":"Play"}><Icon name={playing?"pause":"play"} size={24}/></button><button onClick={next} aria-label="Next"><Icon name="next" size={23}/></button></div><div className="player-bottom"><span>{track.source==="open"?(track.license==="cc0"?"CC0":"PUBLIC DOMAIN"):"LOCAL"}</span>{track.sourceUrl&&<a href={track.sourceUrl} target="_blank" rel="noreferrer">Source ↗</a>}</div>{status&&<div className="player-status">{status}</div>}</section></div>
}
