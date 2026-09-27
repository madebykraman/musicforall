import {useEffect,useMemo,useRef,useState} from "react";
import type {ChangeEvent,CSSProperties,ReactNode,RefObject} from "react";
import type {StoredTrack,Tab,Track} from "./types";
import {deleteTrack,getBlob,listTracks,saveTrack} from "./lib/db";
import {searchOpenMusic} from "./lib/openverse";

type LibraryMode="songs"|"albums"|"artists";
type SortMode="recent"|"title"|"artist";

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
    heart:<path d="M20.8 8.8c0 5-8.8 10-8.8 10s-8.8-5-8.8-10a4.7 4.7 0 0 1 8.8-2.2A4.7 4.7 0 0 1 20.8 8.8Z"/>,
    shuffle:<><path d="M3 7h3c4 0 5 10 9 10h6"/><path d="m18 14 3 3-3 3"/><path d="M3 17h3c1.3 0 2.3-.7 3-1.5M15 7h3l3 3"/></>,
    repeat:<><path d="m17 2 3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12"/><path d="m7 22-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/></>,
    trash:<><path d="M4 7h16M10 11v6M14 11v6"/><path d="m6 7 1 14h10l1-14M9 7V4h6v3"/></>,
    plus:<><path d="M12 5v14M5 12h14"/></>,
    compass2:<><circle cx="12" cy="12" r="8.5"/><path d="m14.8 9.2-1.6 4-4 1.6 1.6-4z"/></>
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
    : <div className={`artwork artwork-${size} artwork-generated`} style={{"--hue":seed%360} as CSSProperties}><span>{track.title.slice(0,1).toUpperCase()}</span></div>;
}

function readDuration(file:File){
  return new Promise<number|undefined>(resolve=>{
    const url=URL.createObjectURL(file);
    const audio=document.createElement("audio");
    audio.preload="metadata";
    audio.onloadedmetadata=()=>{const duration=Number.isFinite(audio.duration)?audio.duration:undefined;URL.revokeObjectURL(url);resolve(duration)};
    audio.onerror=()=>{URL.revokeObjectURL(url);resolve(undefined)};
    audio.src=url;
  });
}

function filenameMetadata(file:File){
  const base=file.name.replace(/.[^.]+$/i,"").replace(/[_]+/g," ").trim();
  const parts=base.split(/s+-s+|s+–s+|s+—s+/).map(v=>v.trim()).filter(Boolean);
  return {title:parts.length>1?parts.slice(1).join(" - "):base,artist:parts.length>1?parts[0]:"Unknown artist",album:"Unknown album"};
}

function loadFavorites(){
  try{return new Set<string>(JSON.parse(localStorage.getItem("music-for-all:favorites")||"[]"))}catch{return new Set<string>()}
}
function saveFavorites(ids:Set<string>){try{localStorage.setItem("music-for-all:favorites",JSON.stringify([...ids]))}catch{undefined}}
function saveRecent(id:string){
  try{
    const current=JSON.parse(localStorage.getItem("music-for-all:recent")||"[]") as string[];
    localStorage.setItem("music-for-all:recent",JSON.stringify([id,...current.filter(x=>x!==id)].slice(0,20)));
  }catch{undefined}
}

export default function App(){
  const[tab,setTab]=useState<Tab>("library");
  const[tracks,setTracks]=useState<StoredTrack[]>([]);
  const[openTracks,setOpenTracks]=useState<Track[]>([]);
  const[queue,setQueue]=useState<Track[]>([]);
  const[query,setQuery]=useState("");
  const[libraryQuery,setLibraryQuery]=useState("");
  const[libraryMode,setLibraryMode]=useState<LibraryMode>("songs");
  const[sort,setSort]=useState<SortMode>("recent");
  const[searching,setSearching]=useState(false);
  const[selected,setSelected]=useState<Track|null>(null);
  const[playing,setPlaying]=useState(false);
  const[progress,setProgress]=useState(0);
  const[playerOpen,setPlayerOpen]=useState(false);
  const[queueOpen,setQueueOpen]=useState(false);
  const[hint,setHint]=useState(false);
  const[status,setStatus]=useState("");
  const[favorites,setFavorites]=useState<Set<string>>(()=>loadFavorites());
  const[shuffle,setShuffle]=useState(false);
  const[repeat,setRepeat]=useState(false);
  const librarySearchRef=useRef<HTMLInputElement|null>(null);
  const discoverSearchRef=useRef<HTMLInputElement|null>(null);
  const audio=useRef<HTMLAudioElement|null>(null);
  const objectUrl=useRef<string|null>(null);

  const local=useMemo(()=>[...tracks].sort((a,b)=>{
    if(sort==="title")return a.title.localeCompare(b.title);
    if(sort==="artist")return a.artist.localeCompare(b.artist)||a.title.localeCompare(b.title);
    return b.addedAt-a.addedAt;
  }),[tracks,sort]);
  const filtered=useMemo(()=>{
    const q=libraryQuery.trim().toLowerCase();
    return q?local.filter(t=>[t.title,t.artist,t.album].some(v=>v.toLowerCase().includes(q))):local;
  },[local,libraryQuery]);
  const favoriteTracks=useMemo(()=>local.filter(t=>favorites.has(t.id)),[local,favorites]);

  useEffect(()=>{listTracks().then(found=>{setTracks(found);setQueue(found)}).catch(()=>setStatus("Your local library could not be opened. No files were changed."))},[]);
  useEffect(()=>{setQueue(current=>{const ids=new Set(current.map(t=>t.id));const additions=local.filter(t=>!ids.has(t.id));return [...current.filter(t=>local.some(x=>x.id===t.id)),...additions]})},[local]);
  useEffect(()=>()=>{if(objectUrl.current)URL.revokeObjectURL(objectUrl.current);audio.current?.pause()},[]);

  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{
      if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){
        e.preventDefault();
        if(tab==="discover")discoverSearchRef.current?.focus();
        else{if(tab!=="library")setTab("library");window.setTimeout(()=>librarySearchRef.current?.focus(),0)}
      }
    };
    window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey);
  },[tab]);

  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{
      if(e.target instanceof HTMLInputElement)return;
      if(e.code==="Space"){e.preventDefault();toggle()}
      if(e.code==="ArrowRight")seek(progress+10);
      if(e.code==="ArrowLeft")seek(progress-10);
    };
    window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey);
  },[progress,selected]);

  useEffect(()=>{
    if(!selected||!("mediaSession" in navigator))return;
    const media=navigator.mediaSession;
    media.metadata=new MediaMetadata({title:selected.title,artist:selected.artist,album:selected.album,artwork:selected.artworkUrl?[{src:selected.artworkUrl}]:[]});
    for(const [action,fn] of [["play",toggle],["pause",toggle],["previoustrack",()=>step(-1)],["nexttrack",()=>step(1)]] as const){try{media.setActionHandler(action,fn)}catch{undefined}}
    return()=>{for(const action of ["play","pause","previoustrack","nexttrack"] as MediaSessionAction[]){try{media.setActionHandler(action,null)}catch{undefined}}};
  },[selected,playing,queue,shuffle,repeat]);

  async function play(track:Track){
    if(!audio.current)audio.current=new Audio();
    const a=audio.current;
    if(objectUrl.current){URL.revokeObjectURL(objectUrl.current);objectUrl.current=null}
    let src=track.audioUrl;
    try{
      if(track.blobId){
        const blob=await getBlob(track.blobId);
        if(!blob){setStatus("This local file is no longer available.");return}
        src=URL.createObjectURL(blob);objectUrl.current=src;
      }
      setSelected(track);setProgress(0);setPlayerOpen(true);saveRecent(track.id);
      setQueue(current=>current.some(t=>t.id===track.id)?current:[...current,track]);
      if(!src){setPlaying(false);return}
      a.src=src;
      a.ontimeupdate=()=>{setProgress(a.currentTime);if("mediaSession" in navigator&&"setPositionState" in navigator.mediaSession&&Number.isFinite(a.duration)&&a.duration>0){try{navigator.mediaSession.setPositionState({duration:a.duration,playbackRate:a.playbackRate,position:Math.min(a.currentTime,a.duration)})}catch{undefined}}};
      a.onended=()=>{if(repeat){void play(track)}else{setPlaying(false);step(1)}};
      a.onerror=()=>{setPlaying(false);setStatus("This audio source could not be played here.")};
      await a.play();setPlaying(true);setStatus("");
    }catch{setPlaying(false);setStatus("Playback could not start. The file may no longer be available to this browser.")}
  }

  function toggle(){
    if(!audio.current||!selected)return;
    if(audio.current.paused)audio.current.play().then(()=>setPlaying(true)).catch(()=>setStatus("Playback needs a tap to start here."));
    else{audio.current.pause();setPlaying(false)}
  }
  function seek(value:number){if(!audio.current||!Number.isFinite(audio.current.duration))return;audio.current.currentTime=Math.max(0,Math.min(value,audio.current.duration));setProgress(audio.current.currentTime)}
  function step(direction:number){
    if(!selected||!queue.length)return;
    if(shuffle&&direction>0){const candidates=queue.filter(t=>t.id!==selected.id);const next=candidates[Math.floor(Math.random()*candidates.length)];if(next)void play(next);return}
    const index=queue.findIndex(t=>t.id===selected.id);const next=queue[(index+direction+queue.length)%queue.length];if(next&&next.id!==selected.id)void play(next);
  }
  function toggleFavorite(id:string){setFavorites(current=>{const next=new Set(current);if(next.has(id))next.delete(id);else next.add(id);saveFavorites(next);return next})}

  async function importFiles(e:ChangeEvent<HTMLInputElement>){
    const files=[...(e.target.files||[])];if(!files.length)return;
    setStatus("Importing 1 of "+files.length+"…");let imported=0;
    try{
      for(const file of files){
        const id=crypto.randomUUID(),blobId=crypto.randomUUID();
        const meta=filenameMetadata(file);const duration=await readDuration(file);
        await saveTrack({id,blobId,title:meta.title||file.name,artist:meta.artist,album:meta.album,source:"local",duration,addedAt:Date.now()},file);
        imported++;setStatus("Imported "+imported+" of "+files.length+"…");
      }
      const found=await listTracks();setTracks(found);setQueue(found);setStatus("Added "+imported+" "+(imported===1?"track":"tracks")+" to your library.");
    }catch(error){console.error("Music For All import failed",error);setTracks(await listTracks().catch(()=>[]));setStatus(imported?"Imported "+imported+" tracks. The remaining file could not be saved.":"Could not save this file. Your existing library is unchanged.")}
    finally{e.target.value=""}
  }

  async function search(){
    if(!query.trim())return;setSearching(true);setStatus("");
    try{setOpenTracks(await searchOpenMusic(query.trim()))}catch{setOpenTracks([]);setStatus("Open music search is unavailable right now.")}finally{setSearching(false)}
  }
  async function download(track:Track){
    if(!track.audioUrl||(track.license!=="cc0"&&track.license!=="public-domain"))return;
    setStatus("Saving a local copy…");
    try{const r=await fetch(track.audioUrl);if(!r.ok)throw new Error();const stored:StoredTrack={...track,blobId:crypto.randomUUID(),addedAt:Date.now()};await saveTrack(stored,await r.blob());const found=await listTracks();setTracks(found);setQueue(current=>[...current,stored]);setStatus("Saved to Downloads.")}catch{setStatus("This source blocks browser downloads. Use its source page instead.")}
  }
  async function remove(track:StoredTrack){
    await deleteTrack(track.id,track.blobId);setTracks(await listTracks());setQueue(current=>current.filter(t=>t.id!==track.id));
    if(selected?.id===track.id){audio.current?.pause();setSelected(null);setPlaying(false);setPlayerOpen(false)}
  }

  const focusSearch=()=>{if(tab==="discover")discoverSearchRef.current?.focus();else{if(tab!=="library")setTab("library");window.setTimeout(()=>librarySearchRef.current?.focus(),0)}};
  const page=tab==="library"
    ? <Library local={filtered} total={local.length} favorites={favoriteTracks} favoriteIds={favorites} mode={libraryMode} setMode={setLibraryMode} sort={sort} setSort={setSort} query={libraryQuery} setQuery={setLibraryQuery} searchRef={librarySearchRef} play={play} importFiles={importFiles} toggleFavorite={toggleFavorite}/>
    : tab==="discover"
      ? <Discover query={query} setQuery={setQuery} search={search} searching={searching} results={openTracks} play={play} download={download} searchRef={discoverSearchRef}/>
      : tab==="downloads"
        ? <Downloads tracks={tracks} favorites={favorites} play={play} remove={remove} toggleFavorite={toggleFavorite}/>
        : <Settings show={()=>setHint(true)} tracks={tracks.length}/>;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">m</span><span>music for all</span></div>
      <div className="sidebar-label">Workspace</div>
      <nav>{NAV.map(([id,label,icon])=><button key={id} className={tab===id?"side-item active":"side-item"} onClick={()=>setTab(id)}><Icon name={icon}/><span>{label}</span>{id==="downloads"&&tracks.length>0&&<i>{tracks.length}</i>}</button>)}</nav>
      <div className="sidebar-bottom"><span>LOCAL FIRST</span><small>Audio stays on this device.</small></div>
    </aside>
    <header className="topbar">
      <div className="mobile-brand"><span className="brand-mark">m</span><span>music for all</span></div>
      <div className="topbar-right"><button className="top-search" onClick={focusSearch}><Icon name="search" size={17}/><span>{tab==="library"?"Search library":"Search"}</span><kbd>⌘ K</kbd></button></div>
    </header>
    <main>{page}</main>
    <nav className="mobile-nav" aria-label="Primary">{NAV.map(([id,label,icon])=><button key={id} className={tab===id?"active":""} onClick={()=>setTab(id)}><Icon name={icon} size={17}/><span>{label}</span></button>)}</nav>
    {status&&<button className="status-toast" onClick={()=>setStatus("")}>{status}<Icon name="close" size={14}/></button>}
    {selected&&<div className="mini-player">
      <div className="mini-progress" style={{"--progress":`${selected.duration?Math.min(progress/selected.duration,1)*100:0}%`} as CSSProperties}/>
      <button className="mini-track" onClick={()=>setPlayerOpen(true)}><Artwork track={selected}/><span><b>{selected.title}</b><small>{selected.artist}</small></span></button>
      <div className="mini-actions"><button onClick={()=>step(-1)} aria-label="Previous"><Icon name="previous" size={16}/></button><button className="mini-play" onClick={toggle} aria-label={playing?"Pause":"Play"}><Icon name={playing?"pause":"play"} size={17}/></button><button onClick={()=>step(1)} aria-label="Next"><Icon name="next" size={16}/></button><button onClick={()=>setQueueOpen(v=>!v)} aria-label="Queue"><Icon name="more" size={17}/></button></div>
    </div>}
    {queueOpen&&selected&&<Queue tracks={queue} selected={selected} play={play} close={()=>setQueueOpen(false)}/>}
    {playerOpen&&selected&&<NowPlaying track={selected} progress={progress} playing={playing} favorite={favorites.has(selected.id)} toggleFavorite={()=>toggleFavorite(selected.id)} toggle={toggle} seek={seek} previous={()=>step(-1)} next={()=>step(1)} shuffle={shuffle} repeat={repeat} setShuffle={setShuffle} setRepeat={setRepeat} close={()=>setPlayerOpen(false)} queue={()=>setQueueOpen(true)} status={status}/>}
    {hint&&<div className="backdrop" onClick={()=>setHint(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setHint(false)}><Icon name="close"/></button><div className="eyebrow">INSTALL</div><h2>Put Music For All on your Home Screen.</h2><p>Safari → Share → Add to Home Screen. On iOS 26, leave “Open as Web App” enabled.</p><button className="primary" onClick={()=>setHint(false)}>Done</button></div></div>}
  </div>;
}

function Library({local,total,favorites,favoriteIds,mode,setMode,sort,setSort,query,setQuery,searchRef,play,importFiles,toggleFavorite}:{local:Track[];total:number;favorites:Track[];favoriteIds:Set<string>;mode:LibraryMode;setMode:(m:LibraryMode)=>void;sort:SortMode;setSort:(m:SortMode)=>void;query:string;setQuery:(q:string)=>void;searchRef:RefObject<HTMLInputElement|null>;play:(t:Track)=>void;importFiles:(e:ChangeEvent<HTMLInputElement>)=>void;toggleFavorite:(id:string)=>void}){
  const albums=Array.from(new Map(local.map(t=>[t.album,t])).values());const artists=Array.from(new Map(local.map(t=>[t.artist,t])).values());
  return <section className="page">
    <div className="page-head"><div><div className="eyebrow">YOUR COLLECTION</div><h1>Library</h1><p className="page-note">{total?`${total} ${total===1?"track":"tracks"} stored on this device.`:"Your music, kept here."}</p></div><label className="primary import">Import music<input hidden type="file" multiple accept="audio/*,.flac,.m4a,.mp3,.wav,.aiff" onChange={importFiles}/></label></div>
    {total>0&&<div className="library-strip"><div><span>Favourites</span><b>{favorites.length}</b></div><div><span>Storage</span><b>Local</b></div><div><span>Order</span><select value={sort} onChange={e=>setSort(e.target.value as SortMode)}><option value="recent">Recently added</option><option value="title">Title</option><option value="artist">Artist</option></select></div></div>}
    <div className="library-tools"><div className="segmented">{(["songs","albums","artists"] as LibraryMode[]).map(m=><button key={m} className={mode===m?"active":""} onClick={()=>setMode(m)}>{m[0].toUpperCase()+m.slice(1)}</button>)}</div><label className="library-search"><Icon name="search" size={16}/><input ref={searchRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search library"/></label></div>
    {mode==="songs"&&<SongView tracks={local} favorites={favoriteIds} play={play} toggleFavorite={toggleFavorite}/>} {mode==="albums"&&<CardGrid items={albums} type="album" play={play}/>} {mode==="artists"&&<CardGrid items={artists} type="artist" play={play}/>}
    {!local.length&&<div className="empty-state"><div className="empty-art"><Icon name="plus" size={26}/></div><h3>Start with your own music.</h3><p>Import MP3, FLAC, M4A, WAV or AIFF files. Music For All stores the audio locally and does not upload it to a server.</p><label className="primary">Choose files<input hidden type="file" multiple accept="audio/*,.flac,.m4a,.mp3,.wav,.aiff" onChange={importFiles}/></label></div>}
    {favorites.length>0&&mode==="songs"&&<section className="secondary-section"><div className="section-heading"><span>FAVOURITES</span><b>{favorites.length}</b></div><div className="favorite-list">{favorites.slice(0,5).map(t=><button key={t.id} onClick={()=>play(t)}><Artwork track={t}/><span><b>{t.title}</b><small>{t.artist}</small></span></button>)}</div></section>}
    <div className="library-foot"><span>{total} {total===1?"track":"tracks"} in this browser</span><span>Local library</span></div>
  </section>;
}

function SongView({tracks,favorites,play,toggleFavorite,remove}:{tracks:Track[];favorites:Set<string>;play:(t:Track)=>void;toggleFavorite:(id:string)=>void;remove?:((t:StoredTrack)=>void)}){
  return <div className="song-list"><div className="list-head"><span>#</span><span>Title</span><span>Album</span><span>Source</span><span>Time</span><span/></div>{tracks.map((t,i)=><div className="song-row" key={t.id}><span className="song-index">{String(i+1).padStart(2,"0")}</span><button className="song-main" onClick={()=>play(t)}><Artwork track={t}/><span><b>{t.title}</b><small>{t.artist}</small></span></button><span className="song-album">{t.album}</span><span className="song-source">{t.source==="open"?(t.license==="cc0"?"CC0":"PDM"):"LOCAL"}</span><span className="song-time">{t.duration?formatTime(t.duration):"—"}</span><div className="row-actions"><button className={favorites.has(t.id)?"icon-button favorite active":"icon-button favorite"} onClick={()=>toggleFavorite(t.id)} aria-label={favorites.has(t.id)?"Remove from favourites":"Add to favourites"}><Icon name="heart" size={16}/></button>{remove&&"blobId" in t&&<button className="icon-button danger" onClick={()=>remove(t as StoredTrack)} aria-label="Remove from downloads"><Icon name="trash" size={16}/></button>}</div></div>)}</div>;
}

function CardGrid({items,type,play}:{items:Track[];type:"album"|"artist";play:(t:Track)=>void}){return <div className={type==="artist"?"card-grid artist-grid":"card-grid"}>{items.map(t=><button className="media-card" key={type==="album"?t.album:t.artist} onClick={()=>play(t)}><Artwork track={t} size="card"/><b>{type==="album"?t.album:t.artist}</b><span>{type==="album"?t.artist:"Artist"}</span></button>)}</div>}

function Discover({query,setQuery,search,searching,results,play,download,searchRef}:{query:string;setQuery:(s:string)=>void;search:()=>void;searching:boolean;results:Track[];play:(t:Track)=>void;download:(t:Track)=>void;searchRef:RefObject<HTMLInputElement|null>}){return <section className="page discover-page"><div className="eyebrow">OPEN CATALOGUE</div><h1>Find music you can keep.</h1><p className="lede">A narrow, rights-aware doorway into public-domain and CC0 audio.</p><div className="discover-search"><Icon name="search"/><input ref={searchRef} value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()} placeholder="Search piano, rain, Debussy…"/><button onClick={search}>{searching?"Searching":"Search"}</button></div><div className="rights">Downloads are restricted to Public Domain and CC0. Open licences still need to be checked per work. <a href="https://docs.openverse.org/" target="_blank" rel="noreferrer">Rights model ↗</a></div><div className="song-list discover-list">{results.map((t,i)=><div className="song-row" key={t.id}><span className="song-index">{String(i+1).padStart(2,"0")}</span><button className="song-main" onClick={()=>play(t)}><Artwork track={t}/><span><b>{t.title}</b><small>{t.artist}</small></span></button><span className="song-album">{t.provider||"Open music"}</span><span className="song-source">{t.license==="cc0"?"CC0":"PDM"}</span><span className="row-actions"><button className="download-action" onClick={()=>download(t)} aria-label="Save offline"><Icon name="download" size={16}/></button></span></div>)}</div>{!results.length&&<div className="quiet-state"><Icon name="compass" size={22}/><p>Search the open catalogue. Results will appear here without changing your library.</p></div>}</section>}

function Downloads({tracks,favorites,play,remove,toggleFavorite}:{tracks:StoredTrack[];favorites:Set<string>;play:(t:Track)=>void;remove:(t:StoredTrack)=>void;toggleFavorite:(id:string)=>void}){return <section className="page"><div className="eyebrow">OFFLINE</div><h1>Downloads</h1><p className="lede">Files actually stored in this browser. Nothing here is a streaming bookmark.</p>{tracks.length?<SongView tracks={tracks} favorites={favorites} play={play} toggleFavorite={toggleFavorite} remove={remove}/>:<div className="empty-state compact"><div className="empty-art"><Icon name="download" size={26}/></div><h3>Nothing offline yet.</h3><p>Public-domain and CC0 results can be saved here when their source permits browser downloads.</p></div>}</section>}

function Settings({show,tracks}:{show:()=>void;tracks:number}){const[storage,setStorage]=useState<{usage:number;quota:number}|null>(null);useEffect(()=>{navigator.storage?.estimate().then(v=>{if(typeof v.usage==="number"&&typeof v.quota==="number")setStorage({usage:v.usage,quota:v.quota})}).catch(()=>undefined)},[]);const mb=(n:number)=>`${(n/1024/1024).toFixed(1)} MB`;return <section className="page"><div className="eyebrow">SYSTEM</div><h1>Settings</h1><p className="lede">A small, local music shelf. No account required.</p><div className="settings-list"><div className="setting-row"><span><b>Install as an app</b><small>Use the Home Screen version for a focused, app-like window.</small></span><button onClick={show}>How</button></div><div className="setting-row"><span><b>Local storage</b><small>{storage?`${mb(storage.usage)} used · ${mb(storage.quota)} available to this origin.`:"Storage usage is available in supported browsers."}</small></span><em>{tracks} {tracks===1?"TRACK":"TRACKS"}</em></div><div className="setting-row"><span><b>Audio files</b><small>Stored in Origin Private File System; library metadata is kept separately from the audio bytes.</small></span><em>LOCAL</em></div><div className="setting-row"><span><b>Connected services</b><small>Apple Music and Spotify remain optional adapters, never mixed with owned files.</small></span><em>PLANNED</em></div></div><div className="about"><span>Music For All · open source · MIT</span><a href="https://github.com/madebykraman/musicforall" target="_blank" rel="noreferrer">GitHub ↗</a></div></section>}

function Queue({tracks,selected,play,close}:{tracks:Track[];selected:Track;play:(t:Track)=>void;close:()=>void}){return <div className="queue-popover"><div className="queue-head"><div><span>QUEUE</span><b>{tracks.length} tracks</b></div><button onClick={close} aria-label="Close queue"><Icon name="close" size={16}/></button></div>{tracks.map(t=><button className={t.id===selected.id?"queue-row current":"queue-row"} key={t.id} onClick={()=>play(t)}><Artwork track={t}/><span><b>{t.title}</b><small>{t.artist}</small></span>{t.id===selected.id&&<i>Playing</i>}</button>)}</div>}

function NowPlaying({track,progress,playing,favorite,toggleFavorite,toggle,seek,previous,next,shuffle,repeat,setShuffle,setRepeat,close,queue,status}:{track:Track;progress:number;playing:boolean;favorite:boolean;toggleFavorite:()=>void;toggle:()=>void;seek:(n:number)=>void;previous:()=>void;next:()=>void;shuffle:boolean;repeat:boolean;setShuffle:(v:boolean)=>void;setRepeat:(v:boolean)=>void;close:()=>void;queue:()=>void;status:string}){const duration=track.duration||0;return <div className="player-backdrop" onClick={close}><section className="player-sheet" onClick={e=>e.stopPropagation()}><div className="player-toolbar"><button onClick={close} aria-label="Close"><Icon name="chevron" size={20}/></button><span>NOW PLAYING</span><button onClick={queue} aria-label="Open queue"><Icon name="more" size={19}/></button></div><Artwork track={track} size="large"/><div className="player-copy"><div><h2>{track.title}</h2><p>{track.artist}</p><small>{track.album}</small></div><button className={favorite?"player-favorite active":"player-favorite"} onClick={toggleFavorite} aria-label={favorite?"Remove from favourites":"Add to favourites"}><Icon name="heart" size={20}/></button></div><div className="seek-wrap"><input aria-label="Playback position" type="range" min="0" max={duration||1} step=".1" value={Math.min(progress,duration||1)} onChange={e=>seek(Number(e.target.value))}/><div><span>{formatTime(progress)}</span><span>{formatTime(duration)}</span></div></div><div className="player-controls"><button className={shuffle?"control active":"control"} onClick={()=>setShuffle(!shuffle)} aria-label="Shuffle"><Icon name="shuffle" size={18}/></button><button className="control" onClick={previous} aria-label="Previous"><Icon name="previous" size={22}/></button><button className="player-play" onClick={toggle} aria-label={playing?"Pause":"Play"}><Icon name={playing?"pause":"play"} size={24}/></button><button className="control" onClick={next} aria-label="Next"><Icon name="next" size={22}/></button><button className={repeat?"control active":"control"} onClick={()=>setRepeat(!repeat)} aria-label="Repeat"><Icon name="repeat" size={18}/></button></div><div className="player-bottom"><span>{track.source==="open"?(track.license==="cc0"?"CC0":"PUBLIC DOMAIN"):"LOCAL"}</span>{track.sourceUrl&&<a href={track.sourceUrl} target="_blank" rel="noreferrer">Source ↗</a>}</div>{status&&<div className="player-status">{status}</div>}</section></div>}

