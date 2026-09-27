import {useEffect,useMemo,useRef,useState} from "react";
import type {ChangeEvent} from "react";
import type {StoredTrack,Tab,Track} from "./types";
import {getBlob,listTracks,saveTrack} from "./lib/db";
import {searchOpenMusic} from "./lib/openverse";

const Icon=({n,s=20}:{n:string;s?:number})=>{
 const d:Record<string,string>={
  home:"M3 10.5 12 3l9 7.5v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  search:"M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM16 16l5 5",
  library:"M4 5.5h16v13H4zM8 9h8M8 13h8M8 17h5",
  settings:"M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4",
  play:"M8 5v14l11-7z",
  pause:"M7 5h4v14H7zM13 5h4v14h-4z",
  next:"M5 5v14l9-7zM18 5v14",
  prev:"M19 5v14l-9-7zM6 5v14",
  heart:"M20.8 8.9c0 5.5-8.8 10.1-8.8 10.1S3.2 14.4 3.2 8.9A5 5 0 0 1 12 5.4a5 5 0 0 1 8.8 3.5",
  queue:"M4 6h11M4 12h11M4 18h7m5-3 4 3-4 3",
  plus:"M12 5v14M5 12h14",
  back:"m15 5-7 7 7 7",
  close:"M6 6l12 12M18 6 6 18",
  shuffle:"M4 7h3c4 0 5 10 10 10h3M4 17h3c1.5 0 2.5-1.2 3.3-2.5M17 4l3 3-3 3M17 14l3 3-3 3",
  repeat:"M17 2l3 3-3 3M4 5h16v6M7 22l-3-3 3-3M20 19H4v-6",
  more:"M12 5h.01M12 12h.01M12 19h.01"
 };
 return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d[n]||d.more}/></svg>
};

const Art=({t,large=false}:{t?:Track;large?:boolean})=>{
 const seed=(t?.title||"Music").split("").reduce((a,c)=>a+c.charCodeAt(0),0)%8;
 return <div className={"art art-"+seed+(large?" large":"")}><span>{(t?.title||"M").charAt(0).toUpperCase()}</span></div>
};
const fmt=(n=0)=>Number.isFinite(n)&&n>=0?Math.floor(n/60)+":"+String(Math.floor(n%60)).padStart(2,"0"):"—";
const stored=(k:string)=>{try{const x=JSON.parse(localStorage.getItem(k)||"[]");return Array.isArray(x)?x:[]}catch{return[]}};
const uid=()=>crypto.randomUUID?.()||String(Date.now()+Math.random());

export default function App(){
 const [tab,setTab]=useState<Tab>("home"),[tracks,setTracks]=useState<StoredTrack[]>([]),[selected,setSelected]=useState<StoredTrack|null>(null),[playing,setPlaying]=useState(false),[full,setFull]=useState(false),[queue,setQueue]=useState(false),[favorites,setFavorites]=useState<string[]>(()=>stored("mfa:favorites")),[recent,setRecent]=useState<string[]>(()=>stored("mfa:recent")),[query,setQuery]=useState(""),[openQuery,setOpenQuery]=useState(""),[results,setResults]=useState<Track[]>([]),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const audio=useRef(new Audio()),input=useRef<HTMLInputElement>(null);
 useEffect(()=>{listTracks().then(setTracks)},[]);
 useEffect(()=>localStorage.setItem("mfa:favorites",JSON.stringify(favorites)),[favorites]);
 useEffect(()=>localStorage.setItem("mfa:recent",JSON.stringify(recent)),[recent]);
 useEffect(()=>{if(message){const t=setTimeout(()=>setMessage(""),2200);return()=>clearTimeout(t)}},[message]);
 const ordered=useMemo(()=>[...tracks].sort((a,b)=>b.addedAt-a.addedAt),[tracks]);
 const filtered=useMemo(()=>ordered.filter(t=>(t.title+" "+t.artist+" "+t.album).toLowerCase().includes(query.toLowerCase())),[ordered,query]);
 const recentTracks=useMemo(()=>recent.map(id=>tracks.find(t=>t.id===id)).filter(Boolean) as StoredTrack[],[recent,tracks]);
 const favoriteTracks=useMemo(()=>tracks.filter(t=>favorites.includes(t.id)),[tracks,favorites]);

 const play=async(t:StoredTrack)=>{const b=await getBlob(t.blobId);if(!b){setMessage("Audio file unavailable.");return}audio.current.src=URL.createObjectURL(b);audio.current.load();await audio.current.play().catch(()=>{});setSelected(t);setPlaying(true);setRecent(x=>[t.id,...x.filter(i=>i!==t.id)].slice(0,20))};
 const toggle=async()=>{if(!selected){if(ordered[0])play(ordered[0]);return}if(audio.current.paused)await audio.current.play().catch(()=>{});else audio.current.pause()};
 const next=(dir=1)=>{if(!selected||!ordered.length)return;const i=ordered.findIndex(t=>t.id===selected.id);play(ordered[(i+dir+ordered.length)%ordered.length])};
 useEffect(()=>{const a=audio.current,p=()=>setPlaying(true),q=()=>setPlaying(false),e=()=>next(1);a.addEventListener("play",p);a.addEventListener("pause",q);a.addEventListener("ended",e);return()=>{a.removeEventListener("play",p);a.removeEventListener("pause",q);a.removeEventListener("ended",e)}},[ordered,selected]);
 const fav=(id:string)=>setFavorites(x=>x.includes(id)?x.filter(i=>i!==id):[...x,id]);
 const importFiles=async(e:ChangeEvent<HTMLInputElement>)=>{const fs=Array.from(e.target.files||[]);if(!fs.length)return;setBusy(true);for(const f of fs){const id=uid(),blobId=uid(),t:StoredTrack={id,blobId,title:f.name.replace(/\.[^.]+$/,"").replace(/[_-]+/g," ").trim()||"Untitled",artist:"Unknown artist",album:"Local music",source:"local",addedAt:Date.now()};try{const p=new Audio();p.src=URL.createObjectURL(f);await new Promise<void>(r=>{const done=()=>{t.duration=Number.isFinite(p.duration)?p.duration:undefined;r()};p.onloadedmetadata=done;p.onerror=()=>r();setTimeout(done,1800)});await saveTrack(t,f);setTracks(await listTracks());setMessage("Added to library")}catch{setMessage("Could not import "+f.name)}}setBusy(false);e.target.value=""};
 const searchOpen=async()=>{if(!openQuery.trim())return;setBusy(true);try{setResults(await searchOpenMusic(openQuery))}catch{setMessage("Open music search failed")}finally{setBusy(false)}};
 const keep=async(t:Track)=>{if(!t.audioUrl)return;try{const r=await fetch(t.audioUrl);if(!r.ok)throw 0;const b=await r.blob(),st:StoredTrack={...t,id:"local:"+uid(),blobId:uid(),addedAt:Date.now()};await saveTrack(st,b);setTracks(await listTracks());setMessage("Saved to library")}catch{setMessage("This source cannot be downloaded here")}};
 const nav=(t:Tab)=>{setTab(t);window.scrollTo({top:0,behavior:"smooth"})};

 if(full&&selected)return <Player t={selected} playing={playing} toggle={toggle} next={next} close={()=>setFull(false)} favorite={favorites.includes(selected.id)} fav={()=>fav(selected.id)} audio={audio.current} queue={ordered} openQueue={()=>setQueue(true)} queueOpen={queue} closeQueue={()=>setQueue(false)} play={play}/>;

 return <div className="app">
  <header className="topbar">
   <button className="brand" onClick={()=>nav("home")}><b>M</b><span>music for all</span></button>
   <div className="top-search"><Icon n="search"/><input value={query} onChange={e=>{setQuery(e.target.value);if(tab!=="library")setTab("library")}} placeholder="Search your music"/></div>
   <button className="add" onClick={()=>input.current?.click()} aria-label="Import music"><Icon n="plus" s={23}/></button>
  </header>
  <input ref={input} hidden type="file" accept="audio/*" multiple onChange={importFiles}/>
  <main>
   {tab==="home"&&<Home tracks={tracks} recent={recentTracks} favorites={favoriteTracks} selected={selected} playing={playing} play={play} toggle={toggle} importMusic={()=>input.current?.click()} explore={()=>nav("explore")} nav={nav}/>}
   {tab==="library"&&<Library tracks={filtered} allTracks={tracks} selected={selected} playing={playing} query={query} setQuery={setQuery} toggle={toggle} fav={fav} favorites={favorites} importMusic={()=>input.current?.click()}/>}
   {tab==="explore"&&<Explore query={openQuery} setQuery={setOpenQuery} search={searchOpen} results={results} busy={busy} keep={keep}/>}
   {tab==="settings"&&<Settings tracks={tracks} importMusic={()=>input.current?.click()}/>}
  </main>
  {selected&&<Mini t={selected} playing={playing} toggle={toggle} open={()=>setFull(true)} queue={()=>setQueue(true)}/>}
  <nav className="bottom-nav">
   <button className={tab==="home"?"on":""} onClick={()=>nav("home")}><Icon n="home"/><span>Home</span></button>
   <button className={tab==="explore"?"on":""} onClick={()=>nav("explore")}><Icon n="search"/><span>Search</span></button>
   <button className={tab==="library"?"on":""} onClick={()=>nav("library")}><Icon n="library"/><span>Library</span></button>
   <button className={tab==="settings"?"on":""} onClick={()=>nav("settings")}><Icon n="settings"/><span>Settings</span></button>
  </nav>
  {queue&&<Queue tracks={ordered} selected={selected} play={play} close={()=>setQueue(false)}/>}
  {message&&<div className="toast">{message}</div>}
  {busy&&<div className="loading"><span/></div>}
 </div>
}

function Section({title,action,children}:{title:string;action?:string;children:React.ReactNode}){return <section className="shelf"><div className="shelf-head"><h2>{title}</h2>{action&&<button>{action}<span>›</span></button>}</div>{children}</section>}

function Cards({tracks,play}:{tracks:StoredTrack[];play:(t:StoredTrack)=>void}){return <div className="rail">{tracks.map(t=><button className="music-card" key={t.id} onClick={()=>play(t)}><Art t={t}/><b>{t.title}</b><small>{t.artist}</small></button>)}</div>}

function Home({tracks,recent,favorites,selected,playing,play,toggle,importMusic,explore,nav}:{tracks:StoredTrack[];recent:StoredTrack[];favorites:StoredTrack[];selected:StoredTrack|null;playing:boolean;play:(t:StoredTrack)=>void;toggle:()=>void;importMusic:()=>void;explore:()=>void;nav:(t:Tab)=>void}){
 const albums=useMemo(()=>{const seen=new Set<string>();return tracks.filter(t=>{const k=(t.album||"Local music")+"|"+(t.artist||"");if(seen.has(k))return false;seen.add(k);return true}).slice(0,12)},[tracks]);
 const artists=useMemo(()=>{const seen=new Set<string>();return tracks.filter(t=>{const k=t.artist||"Unknown artist";if(seen.has(k))return false;seen.add(k);return true}).slice(0,12)},[tracks]);
 return <section className="home">
  <div className="welcome"><div><span className="eyebrow">MUSIC FOR ALL</span><h1>Good music.<br/><em>Close by.</em></h1><p>Your library, your files, your listening.</p></div><button className="hero-action" onClick={tracks.length?()=>nav("library"):importMusic}>{tracks.length?"Open library":"Add music"} <span>›</span></button></div>
  {selected&&<section className="continue"><div className="continue-art"><Art t={selected} large/></div><div className="continue-copy"><span className="eyebrow">NOW PLAYING</span><h2>{selected.title}</h2><p>{selected.artist}</p><div className="continue-actions"><button className="play-main" onClick={toggle}><Icon n={playing?"pause":"play"} s={19}/></button><button className="text-action" onClick={()=>nav("library")}>View library <span>›</span></button></div></div></section>}
  {recent.length>0&&<Section title="Jump back in" action="See all"><Cards tracks={recent.slice(0,8)} play={play}/></Section>}
  {favorites.length>0&&<Section title="Your favourites" action="See all"><Cards tracks={favorites.slice(0,8)} play={play}/></Section>}
  {albums.length>0&&<Section title="Albums"><Cards tracks={albums} play={play}/></Section>}
  {artists.length>0&&<Section title="Artists"><div className="artist-rail">{artists.map(t=><button key={t.id} onClick={()=>play(t)}><Art t={t}/><b>{t.artist}</b></button>)}</div></Section>}
  {tracks.length===0&&<section className="empty-home"><div className="empty-copy"><span className="eyebrow">YOUR LIBRARY</span><h2>Start with the music<br/><em>you already have.</em></h2><p>Import local audio and Music For All will turn it into a proper listening library.</p><button onClick={importMusic}>Import music</button><button className="secondary" onClick={explore}>Explore open music</button></div><div className="empty-art"><Art large/></div></section>}
  <Section title="Open music"><div className="open-promo"><div><span className="eyebrow">PUBLIC DOMAIN + CC0</span><h2>Discover something<br/><em>new to keep.</em></h2><p>Search a small rights-aware catalogue and save eligible recordings to your library.</p></div><button onClick={explore}>Explore <span>›</span></button></div></Section>
 </section>
}

function Library({tracks,allTracks,selected,playing,query,setQuery,toggle,fav,favorites:favIds,importMusic}:{tracks:StoredTrack[];allTracks:StoredTrack[];selected:StoredTrack|null;playing:boolean;query:string;setQuery:(s:string)=>void;toggle:()=>void;fav:(id:string)=>void;favorites:string[];importMusic:()=>void}){
 const [view,setView]=useState<"songs"|"albums"|"artists">("songs");
 const albums=useMemo(()=>{const seen=new Set<string>();return allTracks.filter(t=>{const k=(t.album||"Local music")+"|"+(t.artist||"");if(seen.has(k))return false;seen.add(k);return true})},[allTracks]);
 const artists=useMemo(()=>{const seen=new Set<string>();return allTracks.filter(t=>{const k=t.artist||"Unknown artist";if(seen.has(k))return false;seen.add(k);return true})},[allTracks]);
 return <section className="library-page"><div className="page-title"><div><span className="eyebrow">YOUR LIBRARY</span><h1>Your music.</h1></div><strong>{allTracks.length}<small>{allTracks.length===1?"track":"tracks"}</small></strong></div>
  <div className="library-toolbar"><div className="library-search"><Icon n="search"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search your library"/></div><div className="seg"><button className={view==="songs"?"on":""} onClick={()=>setView("songs")}>Songs</button><button className={view==="albums"?"on":""} onClick={()=>setView("albums")}>Albums</button><button className={view==="artists"?"on":""} onClick={()=>setView("artists")}>Artists</button></div></div>
  {selected&&<div className="library-player"><Art t={selected}/><div><span className="eyebrow">PLAYING NOW</span><b>{selected.title}</b><small>{selected.artist}</small></div><button className="play-main" onClick={toggle}><Icon n={playing?"pause":"play"} s={18}/></button><button className={"heart "+(favIds.includes(selected.id)?"on":"")} onClick={()=>fav(selected.id)}><Icon n="heart"/></button></div>}
  {view==="songs"&&<div className="song-list">{tracks.map((t,i)=><div className="song-row" key={t.id}><span className="index">{String(i+1).padStart(2,"0")}</span><button className="row-art" onClick={()=>play(t)}><Art t={t}/><i><Icon n={selected?.id===t.id&&playing?"pause":"play"} s={15}/></i></button><button className="row-info" onClick={()=>play(t)}><b>{t.title}</b><small>{t.artist} · {t.album}</small></button><button className={"heart "+(favIds.includes(t.id)?"on":"")} onClick={()=>fav(t.id)}><Icon n="heart" s={18}/></button><time>{fmt(t.duration)}</time></div>)}{!tracks.length&&<div className="no-results"><h2>{allTracks.length?"Nothing found.":"Your library is empty."}</h2><p>{allTracks.length?"Try another search.":"Import music to start building your collection."}</p><button onClick={importMusic}>Import music</button></div>}</div>}
  {view==="albums"&&<div className="album-grid">{albums.map(t=><button key={t.id} onClick={()=>play(t)}><Art t={t} large/><b>{t.album||"Local music"}</b><small>{t.artist}</small></button>)}</div>}
  {view==="artists"&&<div className="artist-grid">{artists.map(t=><button key={t.id} onClick={()=>play(t)}><Art t={t}/><b>{t.artist}</b><small>{allTracks.filter(x=>x.artist===t.artist).length} {allTracks.filter(x=>x.artist===t.artist).length===1?"track":"tracks"}</small></button>)}</div>}
 </section>
}

function Explore({query,setQuery,search,results,busy,keep}:{query:string;setQuery:(s:string)=>void;search:()=>void;results:Track[];busy:boolean;keep:(t:Track)=>void}){return <section className="search-page"><span className="eyebrow">SEARCH</span><h1>Find something<br/><em>worth hearing.</em></h1><p className="intro">Search open music and keep only recordings marked Public Domain or CC0.</p><form onSubmit={e=>{e.preventDefault();search()}}><Icon n="search"/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Artists, instruments, places, recordings..."/><button>Search</button></form>{results.length===0&&!busy?<div className="search-start"><span>SEARCH OPEN MUSIC</span><h2>From field recordings<br/>to forgotten rooms.</h2><p>Type something above. The catalogue is deliberately narrow: discovery can be broad, but saving stays rights-aware.</p></div>:<div className="result-grid">{results.map(t=><article key={t.id}><button className="result-art" onClick={()=>t.audioUrl&&window.open(t.audioUrl,"_blank")}><Art t={t}/><i><Icon n="play" s={18}/></i></button><div className="result-copy"><b>{t.title}</b><small>{t.artist}</small><span>{t.license==="cc0"?"CC0":"PUBLIC DOMAIN"} · {t.provider||"Openverse"}</span></div><button className="keep" onClick={()=>keep(t)}>Keep</button></article>)}</div>}</section>}

function Settings({tracks,importMusic}:{tracks:StoredTrack[];importMusic:()=>void}){return <section className="settings-page"><span className="eyebrow">SETTINGS</span><h1>Make it <em>yours.</em></h1><div className="settings-card"><div><b>{tracks.length}</b><span>{tracks.length===1?"track":"tracks"} in your library</span></div><button onClick={importMusic}><Icon n="plus"/><span>Import music</span></button></div><div className="settings-groups"><div><span>LIBRARY</span><b>Local first</b><p>Your audio stays in this browser's private storage.</p></div><div><span>OPEN MUSIC</span><b>Public Domain + CC0</b><p>Open discovery is separate from your private collection.</p></div><div><span>PRODUCT</span><b>Music For All v1.0</b><p>No account. No social feed. No subscription required.</p></div></div></section>}

function Mini({t,playing,toggle,open,queue}:{t:StoredTrack;playing:boolean;toggle:()=>void;open:()=>void;queue:()=>void}){return <div className="mini"><button className="mini-art" onClick={open}><Art t={t}/></button><button className="mini-info" onClick={open}><b>{t.title}</b><small>{t.artist}</small></button><button className="mini-play" onClick={toggle}><Icon n={playing?"pause":"play"} s={17}/></button><button className="mini-queue" onClick={queue}><Icon n="queue"/></button></div>}

function Queue({tracks,selected,play,close}:{tracks:StoredTrack[];selected:StoredTrack|null;play:(t:StoredTrack)=>void;close:()=>void}){return <div className="shade" onClick={close}><aside className="queue-panel" onClick={e=>e.stopPropagation()}><header><div><span className="eyebrow">PLAYING NEXT</span><h2>Queue</h2></div><button onClick={close}>Done</button></header>{tracks.map(t=><button className={t.id===selected?.id?"current":""} onClick={()=>{play(t);close()}} key={t.id}><Art t={t}/><span><b>{t.title}</b><small>{t.artist}</small></span><em>{t.id===selected?.id?"Playing":fmt(t.duration)}</em></button>)}</aside></div>}

function Player({t,playing,toggle,next,close,favorite,fav,audio,queue,openQueue,queueOpen,closeQueue,play}:{t:StoredTrack;playing:boolean;toggle:()=>void;next:(d?:number)=>void;close:()=>void;favorite:boolean;fav:()=>void;audio:HTMLAudioElement;queue:StoredTrack[];openQueue:()=>void;queueOpen:boolean;closeQueue:()=>void;play:(t:StoredTrack)=>void}){
 const [pos,setPos]=useState(0),[dur,setDur]=useState(t.duration||0);
 useEffect(()=>{const u=()=>{setPos(audio.currentTime);if(Number.isFinite(audio.duration))setDur(audio.duration)};audio.addEventListener("timeupdate",u);audio.addEventListener("loadedmetadata",u);return()=>{audio.removeEventListener("timeupdate",u);audio.removeEventListener("loadedmetadata",u)}},[audio,t]);
 return <div className="player"><header><button onClick={close}><Icon n="back"/></button><span>NOW PLAYING</span><button onClick={openQueue}><Icon n="queue"/></button></header><main><div className="player-art"><Art t={t} large/></div><div className="player-meta"><div><h1>{t.title}</h1><p>{t.artist}</p><small>{t.album}</small></div><button className={"heart "+(favorite?"on":"")} onClick={fav}><Icon n="heart" s={23}/></button></div><input className="range" type="range" min="0" max={dur||1} value={Math.min(pos,dur||1)} onChange={e=>{audio.currentTime=+e.target.value;setPos(+e.target.value)}}/><div className="times"><span>{fmt(pos)}</span><span>{fmt(Math.max(0,dur-pos))}</span></div><div className="transport"><button onClick={()=>next(-1)}><Icon n="prev"/></button><button className="big-play" onClick={toggle}><Icon n={playing?"pause":"play"} s={27}/></button><button onClick={()=>next(1)}><Icon n="next"/></button></div><div className="player-actions"><button><Icon n="shuffle"/></button><button onClick={openQueue}><Icon n="queue"/></button><button><Icon n="repeat"/></button></div></main>{queueOpen&&<Queue tracks={queue} selected={t} play={play} close={closeQueue}/>}</div>
}