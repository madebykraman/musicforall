import {useMemo} from "react";
import {useLibrary} from "../../library/LibraryContext";
import {usePlayback} from "../../audio/PlaybackContext";
import {Icon} from "../../components/ui/Icon";
import {Artwork} from "../../components/visual/Artwork";
import {SpotlightCard} from "../../components/visual/SpotlightCard";
import {ArrowFillButton} from "../../components/obsidian/ArrowFillButton";
import type {StoredTrack} from "../../types";

const play=(fn:(t:StoredTrack)=>Promise<void>,t:StoredTrack)=>{if(t.blobId)void fn(t)};
const profileName=()=>{try{return localStorage.getItem("mfa:profile-name")?.trim()||""}catch{return""}};

export function HomePage(){
 const l=useLibrary(),p=usePlayback();
 const name=profileName();
 const tracks=l.ordered;
 const recent=l.recent.map(id=>l.tracks.find(t=>t.id===id)).filter(Boolean) as StoredTrack[];
 const favorites=l.favoriteTracks;
 const hero=p.current||recent[0]||tracks[0]||null;
 const picks=useMemo(()=>[...recent,...favorites,...tracks].filter((t,i,a)=>a.findIndex(x=>x.id===t.id)===i).slice(0,8),[recent,favorites,tracks]);

 if(!tracks.length)return <div className="home-empty">
   <section className="empty-hero">
     <span className="micro-label">MUSEFLIX</span>
     <h1>{name?"Hey, "+name+".":"Your music is waiting."}</h1>
     <p>Nothing gets invented here. Add the music you actually own, and Museflix will build the shelves around it.</p>
     <div className="empty-actions">
       <ArrowFillButton onClick={()=>document.getElementById("muse-import")?.click()}>Import music</ArrowFillButton>
       <button onClick={()=>window.location.hash="search"}>Explore Open Music <Icon name="arrow" size={14}/></button>
     </div>
   </section>
   <div className="empty-principles">
     <article><Icon name="music"/><b>Local first</b><small>Your audio stays in this browser.</small></article>
     <article><Icon name="library"/><b>No fake catalogue</b><small>Empty means empty until you add something.</small></article>
     <article><Icon name="sliders"/><b>Built to play</b><small>Queue, EQ, sleep timer and proper controls.</small></article>
   </div>
 </div>;

 return <div className="home-page">
  <div className="home-desktop">
   <section className="home-hero-grid">
    <SpotlightCard className="home-hero"><div className="hero-copy"><span className="micro-label">{name?"GOOD EVENING, "+name.toUpperCase()+".":"GOOD EVENING."}</span><h1>{hero?.title||"Your music"}</h1><p>{hero?.artist||"Local listening, without the catalogue theatre."}</p><button className="hero-play" disabled={!hero} aria-label="Play" onClick={()=>hero&&play(p.play,hero)}><Icon name="play" size={13}/></button></div>{hero&&<Artwork track={hero} size="hero" index={0}/>}</SpotlightCard>
    <SpotlightCard className="continue-card"><div className="card-kicker">{p.current?"NOW PLAYING":"CONTINUE LISTENING"}</div><button className="continue-track" disabled={!hero} onClick={()=>hero&&play(p.play,hero)}><Artwork track={hero!} size="sm" index={1}/><span><b>{hero?.title}</b><small>{hero?.artist}</small></span><i><Icon name="play" size={10}/></i></button><div className="continue-art"><Artwork track={hero!} size="md" index={3}/></div></SpotlightCard>
   </section>
   <section className="mix-row">{picks.slice(0,4).map((t,i)=><button className={"mix-card mix-"+i} key={t.id} onClick={()=>play(p.play,t)}><Artwork track={t} index={i}/><span><b>{t.title}</b><small>{t.artist}</small></span></button>)}</section>
   {recent.length>0&&<section className="shelf"><header><div><span className="micro-label">KEEP LISTENING</span><h2>Recently Played</h2></div></header><div className="album-row">{recent.slice(0,8).map((t,i)=><button className="album-card" key={t.id} onClick={()=>play(p.play,t)}><Artwork track={t} index={i}/><b>{t.title}</b><small>{t.artist}</small></button>)}</div></section>}
   <section className="shelf"><header><div><span className="micro-label">YOUR COLLECTION</span><h2>Recently Added</h2></div><button onClick={()=>document.getElementById("muse-import")?.click()}>Add music <span>+</span></button></header><div className="album-row">{tracks.slice(0,8).map((t,i)=><button className="album-card" key={t.id} onClick={()=>play(p.play,t)}><Artwork track={t} index={i}/><b>{t.title}</b><small>{t.artist}</small></button>)}</div></section>
   {favorites.length>0&&<section className="shelf rotation-shelf"><header><div><span className="micro-label">YOUR PICKS</span><h2>Liked Songs</h2></div></header><div className="song-stack">{favorites.slice(0,8).map((t,i)=><button key={t.id} className="song-row" onClick={()=>play(p.play,t)}><span className="num">{String(i+1).padStart(2,"0")}</span><Artwork track={t} size="sm" index={i}/><span className="song-meta"><b>{t.title}</b><small>{t.artist}</small></span><span className="song-album">{t.album}</span><span className="song-time">{t.duration?Math.floor(t.duration/60)+":"+String(Math.floor(t.duration%60)).padStart(2,"0"):"—"}</span><Icon name="heart" size={15}/></button>)}</div></section>}
   <section className="home-bottom-callout"><div><span className="micro-label">YOUR LIBRARY</span><h2>Keep everything<br/><em>close.</em></h2><p>Local-first playback, playlists, artwork and search.</p></div><ArrowFillButton onClick={()=>document.getElementById("muse-import")?.click()}>Add music</ArrowFillButton></section>
  </div>
  <div className="home-mobile">
   <div className="mobile-home-heading"><div><span className="micro-label">{name?"YOUR MUSIC":"YOUR LIBRARY"}</span><h1>{name?"Hi, "+name:"Your music"}</h1></div><button onClick={()=>document.getElementById("muse-import")?.click()} aria-label="Add music"><Icon name="plus" size={18}/></button></div>
   <div className="mobile-filter-row">{["All","Albums","Artists","Folders"].map((x,i)=><button className={i===0?"active":""} key={x}>{x}</button>)}</div>
   <section className="mobile-home-section"><header>Continue Listening</header>{hero?<button className="mobile-continue" onClick={()=>play(p.play,hero)}><Artwork track={hero} size="md" index={0}/><span><b>{hero.title}</b><small>{hero.artist}</small></span><Icon name="play" size={16}/></button>:<div className="mobile-empty-copy">Add a track and this space becomes your player.</div>}</section>
   <section className="mobile-home-section"><header><span>Recently Added</span><button onClick={()=>document.getElementById("muse-import")?.click()}>Add music</button></header><div className="mobile-two-grid">{tracks.slice(0,4).map((t,i)=><button key={t.id} onClick={()=>play(p.play,t)}><Artwork track={t} index={i}/><b>{t.album||t.title}</b><small>{t.artist}</small></button>)}</div></section>
   {recent.length>0&&<section className="mobile-home-section"><header>Recently Played</header><div className="mobile-song-list">{recent.slice(0,5).map(t=><button key={t.id} onClick={()=>play(p.play,t)}><Artwork track={t} size="sm" index={1}/><span><b>{t.title}</b><small>{t.artist}</small></span><Icon name="play" size={13}/></button>)}</div></section>}
   {favorites.length>0&&<section className="mobile-home-section"><header>Liked Songs</header><div className="mobile-song-list">{favorites.slice(0,5).map(t=><button key={t.id} onClick={()=>play(p.play,t)}><Artwork track={t} size="sm" index={2}/><span><b>{t.title}</b><small>{t.artist}</small></span><Icon name="heart" size={13}/></button>)}</div></section>}
  </div>
 </div>
}
