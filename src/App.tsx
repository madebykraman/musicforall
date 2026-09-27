import {useEffect,useMemo,useRef,useState} from "react";
import type {ChangeEvent,ReactNode} from "react";
import type {StoredTrack,Tab,Track} from "./types";
import {getBlob,listTracks,saveTrack} from "./lib/db";
import {searchOpenMusic} from "./lib/openverse";

type LibraryView="songs"|"albums"|"artists";
type Sort="recent"|"title"|"artist";

const NAV:[Tab,string,string][]=[
  ["home","Library","library"],["explore","Explore","compass"],["settings","Settings","settings"]
];

function Icon({name,size=20}:{name:string;size?:number}){
 const p:Record<string,ReactNode>={
  library:<><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 1 4 16.5z"/><path d="M4 6h16M8 10h8M8 14h5"/></>,
  compass:<><circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2.3 5.2-5.2 2.3 2.3-5.2z"/></>,
  settings:<><circle cx="12" cy="12" r="3"/><path d="M19 15.2a2 2 0 0 0 .4 2.2l.1.1-2.1 2.1-.1-.1a2 2 0 0 0-2.2-.4 2 2 0 0 0-1.2 1.8v.1h-3v-.1a2 2 0 0 0-1.2-1.8 2 2 0 0 0-2.2.4l-.1.1-2.1-2.1.1-.1a2 2 0 0 0 .4-2.2A2 2 0 0 0 4 14H3.9v-3H4a2 2 0 0 0 1.8-1.2 2 2 0 0 0-.4-2.2l-.1-.1 2.1-2.1.1.1a2 2 0 0 0 2.2.4A2 2 0 0 0 11 4.1V4h3v.1a2 2 0 0 0 1.2 1.8 2 2 0 0 0 2.2-.4l.1-.1 2.1 2.1-.1.1a2 2 0 0 0-.4 2.2A2 2 0 0 0 20 11h.1v3H20a2 2 0 0 0-1.8 1.2Z"/></>,
  search:<><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></>,
  play:<path fill="currentColor" stroke="none" d="m9 6 10 6-10 6z"/>,
  pause:<><path d="M9 6v12M15 6v12"/></>,
  next:<><path d="M18 5v14"/><path d="m6 6 9 6-9 6z"/></>,
  previous:<><path d="M6 5v14"/><path d="m18 6-9 6 9 6z"/></>,
  heart:<path d="M20.5 8.8c0 5-8.5 9.9-8.5 9.9S3.5 13.8 3.5 8.8a4.5 4.5 0 0 1 8.5-2.1 4.5 4.5 0 0 1 8.5 2.1Z"/>,
  heartFill:<path fill="currentColor" stroke="none" d="M20.5 8.8c0 5-8.5 9.9-8.5 9.9S3.5 13.8 3.5 8.8a4.5 4.5 0 0 1 8.5-2.1 4.5 4.5 0 0 1 8.5 2.1 4.5 4.5 0 0 1 8.5 2.1Z"/>,
  plus:<><path d="M12 5v14M5 12h14"/></>,
  more:<><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/></>,
  shuffle:<><path d="M3 7h3c4 0 5 10 9 10h6"/><path d="m18 14 3 3-3 3"/><path d="M3 17h3c1.5 0 2.5-.6 3-1.5M15 7h3l3 3"/></>,
  repeat:<><path d="m17 2 3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12"/><path d="m7 22-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/></>,
  queue:<><path d="M4 6h11M4 12h11M4 18h7"/><path d="m17 16 3 3-3 3"/></>,
  close:<><path d="m6 6 12 12M18 6 6 18"/></>,
  back:<path d="M19 12H6M11 6l-5 6 5 6"/>,
  download:<><path d="M12 3v11"/><path d="m7 10 5 5 5-5"/><path d="M4 20h16"/></>,
  trash:<><path d="M4 7h16M10 11v6M14 11v6"/><path d="m6 7 1 14h10l1-14M9 7V4h6v3"/></>,
  arrow:<path d="M5 12h13M13 6l6 6-6 6"/>
 };
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{p[name]}</svg>;
}

function time(s?:number){if(!Number.isFinite(s)||!s)return "—";const n=Math.floor(s);return Math.floor(n/60)+":"+String(n%60).padStart(2,"0")}
function seed(t:Track){return [...(t.title+t.artist+t.album)].reduce((a,c)=>a+c.charCodeAt(0),0)}
function Artwork({track,size="medium"}:{track:Track;size:"small"|"medium"|"large"|"hero"}){
 const s=seed(track);
 return track.artworkUrl?<img className={"art art-"+size} src={track.artworkUrl} alt=""/>:
 <div className={"art art-"+size+" generated generated-"+(s%8)}><span>{track.title.trim().slice(0,1).toUpperCase()}</span><i/></div>;
}
function ids(key:string){try{return new Set<string>(JSON.parse(localStorage.getItem(key)||"[]"))}catch{return new Set<string>()}}
function persist(key:string,set:Set<string>){try{localStorage.setItem(key,JSON.stringify([...set]))}catch{}}
function remember(id:string){try{const old=JSON.parse(localStorage.getItem("mfa:recent")||"[]") as string[];localStorage.setItem("mfa:recent",JSON.stringify([id,...old.filter(x=>x!==id)].slice(0,40)))}catch{}}
function fileMeta(file:File){const base=file.name.replace(/.[^.]+$/,"").replace(/[_]+/g," ").trim();const p=base.split(/\s+-\s+|\s+–\s+|\s+—\s+/).map(x=>x.trim()).filter(Boolean);return{title:p.length>1?p.slice(1).join(" — "):base,artist:p.length>1?p[0]:"Local file",album:"Local files"}}
function duration(file:File){return new Promise<number|undefined>(resolve=>{const url=URL.createObjectURL(file),a=document.createElement("audio");let done=false;const finish=(v?:number)=>{if(done)return;done=true;clearTimeout(timer);a.removeAttribute("src");a.load();URL.revokeObjectURL(url);resolve(v)};const timer=window.setTimeout(()=>finish(),5000);a.preload="metadata";a.onloadedmetadata=()=>finish(Number.isFinite(a.duration)?a.duration:undefined);a.onerror=()=>finish();a.src=url})}

export default function App(){
 const[tab,setTab]=useState<Tab>("home"),[tracks,setTracks]=useState<StoredTrack[]>([]),[selected,setSelected]=useState<Track|null>(null),[playing,setPlaying]=useState(false),[progress,setProgress]=useState(0),[player,setPlayer]=useState(false),[queueOpen,setQueueOpen]=useState(false),[status,setStatus]=useState(""),[favorites,setFavorites]=useState<Set<string>>(()=>ids("mfa:favorites")),[recent,setRecent]=useState<string[]>(()=>{try{return JSON.parse(localStorage.getItem("mfa:recent")||"[]")}catch{return[]}}),[shuffle,setShuffle]=useState(false),[repeat,setRepeat]=useState(false),[onboard,setOnboard]=useState(false),[search,setSearch]=useState("");
 const audio=useRef(new Audio()),objectUrl=useRef<string|null>(null);

 useEffect(()=>{listTracks().then(found=>{setTracks(found);if(!found.length){try{setOnboard(localStorage.getItem("mfa:onboarded")!=="1")}catch{setOnboard(true)}}}).catch(()=>setStatus("Your library could not be opened."))},[]);
 useEffect(()=>()=>{audio.current.pause();if(objectUrl.current)URL.revokeObjectURL(objectUrl.current)},[]);
 useEffect(()=>{const a=audio.current;a.ontimeupdate=()=>{setProgress(a.currentTime);if("mediaSession" in navigator&&Number.isFinite(a.duration)){try{navigator.mediaSession.setPositionState({duration:a.duration,playbackRate:a.playbackRate,position:a.currentTime})}catch{}}};a.onloadedmetadata=()=>setProgress(a.currentTime);a.onended=()=>{if(repeat&&selected)void play(selected);else advance(1)};return()=>{a.ontimeupdate=null;a.onended=null}},[selected,shuffle,repeat]);
 useEffect(()=>{if("mediaSession" in navigator)navigator.mediaSession.playbackState=playing?"playing":"paused"},[playing]);\n useEffect(()=>{if(!status)return;const timer=window.setTimeout(()=>setStatus(""),2600);return()=>window.clearTimeout(timer)},[status]);
 useEffect(()=>{if(!selected||!("mediaSession" in navigator))return;const m=navigator.mediaSession;m.metadata=new MediaMetadata({title:selected.title,artist:selected.artist||"Local file",album:selected.album||"Music For All",artwork:selected.artworkUrl?[{src:selected.artworkUrl}]:[]});const actions:Partial<Record<MediaSessionAction,()=>void>>={play:()=>toggle(),pause:()=>toggle(),seekbackward:()=>seek(Math.max(0,audio.current.currentTime-10)),seekforward:()=>seek(audio.current.currentTime+10),previoustrack:()=>advance(-1),nexttrack:()=>advance(1),seekto:()=>{}};for(const [action,handler] of Object.entries(actions) as [MediaSessionAction,()=>void][]{try{m.setActionHandler(action,handler)}catch{}}return()=>{m.metadata=null;for(const action of Object.keys(actions) as MediaSessionAction[]){try{m.setActionHandler(action,null)}catch{}}}},[selected]);

 const sorted=useMemo(()=>[...tracks].sort((a,b)=>b.addedAt-a.addedAt),[tracks]);
 const recentTracks=useMemo(()=>recent.map(id=>tracks.find(t=>t.id===id)).filter(Boolean) as StoredTrack[],[recent,tracks]);
 const queue=useMemo(()=>selected?[selected,...sorted.filter(t=>t.id!==selected.id)]:sorted,[selected,sorted]);

 function go(t:Tab){setTab(t);setSearch("")}
 async function play(track:Track){try{if(objectUrl.current){URL.revokeObjectURL(objectUrl.current);objectUrl.current=null}let src=track.audioUrl;if(track.blobId){const blob=await getBlob(track.blobId);if(!blob){setStatus("This file is no longer on the device.");return}src=URL.createObjectURL(blob);objectUrl.current=src}if(!src){setStatus("This track has no playable audio.");return}audio.current.src=src;audio.current.currentTime=0;setSelected(track);setProgress(0);remember(track.id);setRecent(r=>[track.id,...r.filter(x=>x!==track.id)].slice(0,40));await audio.current.play();setPlaying(true);setStatus("");}catch{setPlaying(false);setStatus("Playback could not start.")}}
 function toggle(){if(!selected)return;if(audio.current.paused)audio.current.play().then(()=>setPlaying(true)).catch(()=>setStatus("Tap play to start playback."));else{audio.current.pause();setPlaying(false)}}
 function seek(v:number){const d=audio.current.duration;if(!Number.isFinite(d))return;const n=Math.max(0,Math.min(v,d));audio.current.currentTime=n;setProgress(n)}
 function advance(dir:number){if(!selected||!queue.length)return;const candidates=queue.filter(t=>t.id!==selected.id);let next:Track|undefined;if(shuffle&&dir>0)next=candidates[Math.floor(Math.random()*candidates.length)];else{const i=queue.findIndex(t=>t.id===selected.id);next=queue[(i+dir+queue.length)%queue.length]}if(next)void play(next);else if(repeat)void play(selected);else setPlaying(false)}
 function fav(id:string){setFavorites(current=>{const n=new Set(current);n.has(id)?n.delete(id):n.add(id);persist("mfa:favorites",n);return n})}
 async function importFiles(e:ChangeEvent<HTMLInputElement>){const files=[...(e.target.files||[])];if(!files.length)return;let done=0;setStatus("Importing "+files.length+" "+(files.length===1?"track":"tracks")+"…");try{for(const file of files){const meta=fileMeta(file);const id=crypto.randomUUID();const blobId=crypto.randomUUID();await saveTrack({id,blobId,title:meta.title||file.name,artist:meta.artist,album:meta.album,source:"local",duration:await duration(file),addedAt:Date.now()},file);done++;setStatus("Imported "+done+" of "+files.length)}const found=await listTracks();setTracks(found);try{localStorage.setItem("mfa:onboarded","1")}catch{}setOnboard(false);setStatus(done+" "+(done===1?"track":"tracks")+" imported.");}catch{setTracks(await listTracks().catch(()=>[]));setStatus(done?done+" imported; one or more files failed.":"Import failed. Your existing library is unchanged.")}finally{e.target.value=""}}
 async function searchOpen(query:string){if(!query.trim())return;setStatus("");try{setSearching(true);setOpen(await searchOpenMusic(query.trim()))}catch{setOpen([]);setStatus("Explore is unavailable right now.")}finally{setSearching(false)}}
 const[open,setOpen]=useState<Track[]>([]),[searching,setSearching]=useState(false);
 async function download(t:Track){if(!t.audioUrl)return;setStatus("Saving to library…");try{const r=await fetch(t.audioUrl);if(!r.ok)throw new Error();const s:StoredTrack={...t,blobId:crypto.randomUUID(),addedAt:Date.now()};await saveTrack(s,await r.blob());setTracks(await listTracks());setStatus("Saved to library.");}catch{setStatus("This source does not permit browser downloads.")}}

 return <div className="app">
  <header className="topbar">
   <button className="wordmark" onClick={()=>go("home")}><span className="mark">M</span><span>music for all</span></button>
   <div className="topbar-actions">
    <button className="icon-button search-trigger" onClick={()=>go("explore")} aria-label="Search"><Icon name="search" size={21}/></button>
    <label className="import-button"><Icon name="plus" size={18}/><span>Import</span><input hidden type="file" multiple accept="audio/*,.flac,.m4a,.mp3,.wav,.aiff" onChange={importFiles}/></label>
   </div>
  </header>

  <main>
   {tab==="home"&&<LibraryHome tracks={sorted} recent={recentTracks} selected={selected} playing={playing} favorites={favorites} play={play} toggle={toggle} fav={fav} openPlayer={()=>setPlayer(true)} importFiles={importFiles}/>}
   {tab==="explore"&&<Explore query={search} setQuery={setSearch} search={()=>searchOpen(search)} searching={searching} results={open} play={play} download={download}/>}
   {tab==="settings"&&<Settings tracks={tracks} onboard={()=>setOnboard(true)}/>}
  </main>

  {selected&&!player&&<MiniPlayer track={selected} playing={playing} progress={progress} toggle={toggle} open={()=>setPlayer(true)} queue={()=>setQueueOpen(true)}/>}
  <nav className="tabbar">{NAV.map(([id,label,icon])=><button key={id} className={tab===id?"active":""} onClick={()=>go(id)}><Icon name={icon} size={21}/><span>{label}</span></button>)}</nav>

  {queueOpen&&selected&&<Queue queue={queue} selected={selected} play={play} close={()=>setQueueOpen(false)}/>}
  {player&&selected&&<Player track={selected} progress={progress} playing={playing} favorite={favorites.has(selected.id)} fav={()=>fav(selected.id)} toggle={toggle} seek={seek} previous={()=>advance(-1)} next={()=>advance(1)} shuffle={shuffle} repeat={repeat} setShuffle={setShuffle} setRepeat={setRepeat} queue={()=>setQueueOpen(true)} close={()=>setPlayer(false)}/>}
  {onboard&&<Onboarding importFiles={importFiles} close={()=>{try{localStorage.setItem("mfa:onboarded","1")}catch{}setOnboard(false)}}/>}
  {status&&<button className="toast" onClick={()=>setStatus("")}>{status}<Icon name="close" size={14}/></button>}
 </div>
}

function LibraryHome({tracks,recent,selected,playing,favorites,play,toggle,fav,openPlayer,importFiles}:{tracks:StoredTrack[];recent:StoredTrack[];selected:Track|null;playing:boolean;favorites:Set<string>;play:(t:Track)=>void;toggle:()=>void;fav:(id:string)=>void;openPlayer:()=>void;importFiles:(e:ChangeEvent<HTMLInputElement>)=>void}){
 const[view,setView]=useState<LibraryView>("songs"),[sort,setSort]=useState<Sort>("recent"),[query,setQuery]=useState("");
 const visible=useMemo(()=>{const q=query.toLowerCase().trim();return [...tracks].sort((a,b)=>sort==="title"?a.title.localeCompare(b.title):sort==="artist"?a.artist.localeCompare(b.artist):b.addedAt-a.addedAt).filter(t=>!q||[t.title,t.artist,t.album].some(x=>x.toLowerCase().includes(q)))},[tracks,sort,query]);
 const albums=Array.from(new Map(visible.map(t=>[t.album,t])).values());
 const artists=Array.from(new Map(visible.map(t=>[t.artist,t])).values());
 return <section className="library-page">
  <div className="library-title">
   <div><span className="kicker">YOUR LIBRARY</span><h1>{tracks.length?<>Your music<span className="title-dot">.</span></>:<>Bring your music<br/><i>home.</i></>}</h1></div>
   <div className="library-count">{tracks.length}<small>{tracks.length===1?"track":"tracks"}</small></div>
  </div>

  {selected?<section className="now-card" onClick={openPlayer}>
   <Artwork track={selected} size="hero"/>
   <div className="now-copy"><span className="kicker">NOW PLAYING</span><h2>{selected.title}</h2><p>{selected.artist}</p><small>{selected.album}</small><div className="now-actions"><button onClick={e=>{e.stopPropagation();toggle()}} className="round-play"><Icon name={playing?"pause":"play"} size={20}/></button><button onClick={e=>{e.stopPropagation();fav(selected.id)}} className={favorites.has(selected.id)?"heart active":"heart"}><Icon name={favorites.has(selected.id)?"heartFill":"heart"} size={20}/></button></div></div>
  </section>:<section className="welcome-card"><div><span className="kicker">LOCAL MUSIC PLAYER</span><h2>Your music,<br/><i>without the noise.</i></h2><p>Import your files. They stay on this device. No account required.</p></div><label className="welcome-import">Import music<input hidden type="file" multiple accept="audio/*,.flac,.m4a,.mp3,.wav,.aiff" onChange={importFiles}/></label></section>}

  {recent.length>0&&<section className="strip"><div className="strip-head"><h2>Recently played</h2><span>{recent.length}</span></div><div className="cover-strip">{recent.slice(0,8).map(t=><button key={t.id} onClick={()=>play(t)}><Artwork track={t} size="medium"/><b>{t.title}</b><small>{t.artist}</small></button>)}</div></section>}

  {tracks.length>0&&<section className="library-section">
   <div className="library-toolbar">
    <div className="segmented">{(["songs","albums","artists"] as LibraryView[]).map(v=><button className={view===v?"active":""} onClick={()=>setView(v)} key={v}>{v}</button>)}</div>
    <label className="inline-search"><Icon name="search" size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search your library"/></label>
    <select value={sort} onChange={e=>setSort(e.target.value as Sort)}><option value="recent">Recently added</option><option value="title">Title</option><option value="artist">Artist</option></select>
   </div>
   {view==="songs"&&<SongList tracks={visible} favorites={favorites} fav={fav} play={play}/>}
   {view==="albums"&&<div className="grid">{albums.map(t=><button className="grid-item" key={t.album} onClick={()=>play(t)}><Artwork track={t} size="medium"/><b>{t.album}</b><small>{t.artist}</small></button>)}</div>}
   {view==="artists"&&<div className="artist-list">{artists.map(t=><button key={t.artist} onClick={()=>play(t)}><Artwork track={t} size="small"/><span><b>{t.artist}</b><small>{visible.filter(x=>x.artist===t.artist).length} {visible.filter(x=>x.artist===t.artist).length===1?"track":"tracks"}</small></span><Icon name="arrow" size={18}/></button>)}</div>}
   {!visible.length&&<div className="empty">Nothing matches your search.</div>}
  </section>}
 </section>
}

function SongList({tracks,favorites,fav,play}:{tracks:StoredTrack[];favorites:Set<string>;fav:(id:string)=>void;play:(t:Track)=>void}){
 return <div className="song-list">{tracks.map((t,i)=><div className="song" key={t.id}>
  <button className="song-main" onClick={()=>play(t)}><span className="song-number">{String(i+1).padStart(2,"0")}</span><Artwork track={t} size="small"/><span className="song-info"><b>{t.title}</b><small>{t.artist}<i>·</i>{t.album}</small></span></button>
  <span className="song-time">{time(t.duration)}</span>
  <button className={favorites.has(t.id)?"song-heart active":"song-heart"} onClick={()=>fav(t.id)} aria-label="Favourite"><Icon name={favorites.has(t.id)?"heartFill":"heart"} size={17}/></button>
 </div>)}</div>
}

function Explore({query,setQuery,search,searching,results,play,download}:{query:string;setQuery:(s:string)=>void;search:()=>void;searching:boolean;results:Track[];play:(t:Track)=>void;download:(t:Track)=>void}){
 return <section className="explore-page">
  <div className="explore-head"><span className="kicker">OPEN MUSIC</span><h1>Find something<br/><i>worth hearing.</i></h1><p>Search a small, rights-aware catalogue. Keep only music marked Public Domain or CC0.</p></div>
  <div className="big-search"><Icon name="search" size={25}/><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()} placeholder="Search sounds, instruments, recordings…"/><button onClick={search}>{searching?"…":"Search"}</button></div>
  {results.length?<div className="open-results">{results.map(t=><article key={t.id}><Artwork track={t} size="medium"/><div><span className="license">{t.license==="cc0"?"CC0":"PUBLIC DOMAIN"} · {t.provider||"OPEN"}</span><h2>{t.title}</h2><p>{t.artist}</p><small>{t.album}</small></div><div className="result-actions"><button onClick={()=>play(t)}><Icon name="play" size={16}/>Listen</button><button onClick={()=>download(t)}><Icon name="plus" size={16}/>Keep</button></div></article>)}</div>:<div className="explore-empty"><span>OPEN SHELF</span><h2>Search when you want<br/>something outside your library.</h2></div>}
 </section>
}

function Settings({tracks,onboard}:{tracks:StoredTrack[];onboard:()=>void}){
 const bytes=tracks.length?tracks.length:"0";
 return <section className="settings-page">
  <div className="settings-head"><span className="kicker">SETTINGS</span><h1>Make it<br/><i>yours.</i></h1><p>Music For All is intentionally small: your files, your device, your controls.</p></div>
  <div className="settings-list">
   <div className="setting"><span><b>LIBRARY</b><strong>{bytes} {tracks.length===1?"track":"tracks"}</strong><small>Your local collection is stored privately in this browser.</small></span><span className="setting-value">LOCAL</span></div>
   <div className="setting"><span><b>ONBOARDING</b><strong>Start over</strong><small>See the short introduction and import flow again.</small></span><button onClick={onboard}>Show intro</button></div>
   <div className="setting"><span><b>OPEN MUSIC</b><strong>Public Domain + CC0</strong><small>Explore uses a narrow rights model for keepable downloads.</small></span><span className="setting-value">OPENVERSE</span></div>
  </div>
  <footer><span>Music For All · local-first</span><span>v0.2</span></footer>
 </section>
}

function MiniPlayer({track,playing,progress,toggle,open,queue}:{track:Track;playing:boolean;progress:number;toggle:()=>void;open:()=>void;queue:()=>void}){
 return <div className="mini-player">
  <button className="mini-info" onClick={open}><Artwork track={track} size="small"/><span><b>{track.title}</b><small>{track.artist}</small></span></button>
  <div className="mini-progress" style={{width:track.duration?Math.min(100,progress/track.duration*100)+"%":"0%"}}/>
  <button className="mini-control" onClick={toggle} aria-label={playing?"Pause":"Play"}><Icon name={playing?"pause":"play"} size={19}/></button>
  <button className="mini-control queue-control" onClick={queue} aria-label="Queue"><Icon name="queue" size={20}/></button>
 </div>
}

function Queue({queue,selected,play,close}:{queue:Track[];selected:Track;play:(t:Track)=>void;close:()=>void}){
 return <div className="overlay"><section className="queue-panel"><header><div><span>PLAY QUEUE</span><b>{queue.length} tracks</b></div><button onClick={close}><Icon name="close" size={20}/></button></header>{queue.map((t,i)=><button className={t.id===selected.id?"queue-row current":"queue-row"} key={t.id} onClick={()=>{void play(t);close()}}><span>{String(i+1).padStart(2,"0")}</span><Artwork track={t} size="small"/><span><b>{t.title}</b><small>{t.artist}</small></span>{t.id===selected.id&&<i>Playing</i>}</button>)}</section></div>
}

function Player({track,progress,playing,favorite,toggle,fav,seek,previous,next,shuffle,repeat,setShuffle,setRepeat,queue,close}:{track:Track;progress:number;playing:boolean;favorite:boolean;toggle:()=>void;fav:()=>void;seek:(n:number)=>void;previous:()=>void;next:()=>void;shuffle:boolean;repeat:boolean;setShuffle:(v:boolean)=>void;setRepeat:(v:boolean)=>void;queue:()=>void;close:()=>void}){
 return <div className="player">
  <header><button onClick={close}><Icon name="back" size={21}/><span>Library</span></button><span>NOW PLAYING</span><button onClick={queue}><Icon name="queue" size={21}/></button></header>
  <div className="player-content">
   <Artwork track={track} size="hero"/>
   <div className="player-info"><div className="player-title"><div><h1>{track.title}</h1><p>{track.artist}</p><small>{track.album}</small></div><button className={favorite?"player-heart active":"player-heart"} onClick={fav}><Icon name={favorite?"heartFill":"heart"} size={22}/></button></div>
    <div className="scrubber"><input type="range" min="0" max={Number.isFinite(audioDuration(track,progress))?audioDuration(track,progress):100} value={progress} onChange={e=>seek(Number(e.target.value))}/><div><span>{time(progress)}</span><span>{time(track.duration)}</span></div></div>
    <div className="transport"><button className={shuffle?"on":""} onClick={()=>setShuffle(!shuffle)}><Icon name="shuffle" size={20}/></button><button onClick={previous}><Icon name="previous" size={25}/></button><button className="play-main" onClick={toggle}><Icon name={playing?"pause":"play"} size={25}/></button><button onClick={next}><Icon name="next" size={25}/></button><button className={repeat?"on":""} onClick={()=>setRepeat(!repeat)}><Icon name="repeat" size={20}/></button></div>
    <button className="queue-link" onClick={queue}>View play queue <Icon name="arrow" size={17}/></button>
   </div>
  </div>
 </div>
}
function audioDuration(track:Track,progress:number){return track.duration&&track.duration>0?track.duration:Math.max(100,progress+1)}

function Onboarding({importFiles,close}:{importFiles:(e:ChangeEvent<HTMLInputElement>)=>void;close:()=>void}){
 return <div className="onboarding"><div className="onboard-art"><div className="onboard-logo">M</div><span>music for all</span></div><div className="onboard-copy"><span className="kicker">A PRIVATE MUSIC PLAYER</span><h1>Your music.<br/><i>Nothing else.</i></h1><p>A focused home for the files you already own. No account, feed or recommendation engine required.</p><label className="onboard-button">Import your music<input hidden type="file" multiple accept="audio/*,.flac,.m4a,.mp3,.wav,.aiff" onChange={importFiles}/></label><button className="onboard-skip" onClick={close}>Look around first <Icon name="arrow" size={17}/></button><div className="onboard-foot"><span>LOCAL STORAGE</span><span>NO ACCOUNT</span><span>OPEN MUSIC</span></div></div></div>
}