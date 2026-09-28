import {useMemo} from "react";
import {useLibrary} from "../../library/LibraryContext";
import {usePlayback} from "../../audio/PlaybackContext";
import {Icon} from "../../components/ui/Icon";
import {Artwork} from "../../components/visual/Artwork";
import {SpotlightCard} from "../../components/visual/SpotlightCard";
import {ArrowFillButton} from "../../components/obsidian/ArrowFillButton";
import type {StoredTrack} from "../../types";

const demo=[
{id:"demo-1",blobId:"",title:"Die For You",artist:"The Weeknd",album:"Starboy"},
{id:"demo-2",blobId:"",title:"Blinding Lights",artist:"The Weeknd",album:"After Hours"},
{id:"demo-3",blobId:"",title:"Starboy",artist:"The Weeknd",album:"Starboy"},
{id:"demo-4",blobId:"",title:"Sweater Weather",artist:"The Neighbourhood",album:"I Love You."},
{id:"demo-5",blobId:"",title:"Heat Waves",artist:"Glass Animals",album:"Dreamland"},
{id:"demo-6",blobId:"",title:"I Ain't Worried",artist:"OneRepublic",album:"Top Gun"}
] as StoredTrack[];

export function HomePage(){
 const l=useLibrary();
 const p=usePlayback();
 const tracks=l.ordered.length?l.ordered:demo;
 const recent=l.recent.map(id=>l.tracks.find(t=>t.id===id)).filter(Boolean) as StoredTrack[];
 const hero=p.current||tracks[0];
 const picks=useMemo(()=>[...recent,...tracks].filter((t,i,a)=>a.findIndex(x=>x.id===t.id)===i).slice(0,8),[recent,tracks]);
 return <div className="home-page">
  <section className="hero-grid">
   <SpotlightCard className="home-hero">
    <div className="hero-copy"><small>GOOD EVENING</small><h1>Aman</h1><p>Your music. Always with you.</p><button className="hero-play" onClick={()=>void p.play(hero)}><Icon name="play" size={14}/></button></div>
    <Artwork track={hero} size="hero" index={0}/>
   </SpotlightCard>
   <SpotlightCard className="continue-card">
    <div className="eyebrow">CONTINUE LISTENING</div>
    <button onClick={()=>void p.play(hero)}><Artwork track={hero} size="sm" index={1}/><span><b>{hero.title}</b><small>{hero.artist}</small></span><i><Icon name="play" size={12}/></i></button>
    <div className="continue-wave"/>
   </SpotlightCard>
  </section>
  <section className="mix-row">
   {["Chill Mix","Indie Faves","Workout","Late Night"].map((x,i)=><button className={"mix-card mix-"+i} key={x} onClick={()=>void p.play(tracks[i%tracks.length])}><div><b>{x}</b><small>{["A mix for your evening","Discover something new","Energy for the grind","Sounds after dark"][i]}</small></div></button>)}
  </section>
  <section className="shelf">
   <header><div><small>YOUR COLLECTION</small><h2>Recently Added</h2></div><button onClick={()=>document.getElementById("muse-import")?.click()}>See All</button></header>
   <div className="album-row">{tracks.slice(0,8).map((t,i)=><button className="album-card" key={t.id+"-"+i} onClick={()=>void p.play(t)}><Artwork track={t} index={i}/><b>{t.title}</b><small>{t.artist}</small></button>)}</div>
  </section>
  <section className="shelf">
   <header><div><small>KEEP LISTENING</small><h2>Your Rotation</h2></div></header>
   <div className="song-stack">{picks.map((t,i)=><button key={t.id+"r"} className="song-row" onClick={()=>void p.play(t)}><span className="num">{String(i+1).padStart(2,"0")}</span><Artwork track={t} size="sm" index={i}/><span className="song-meta"><b>{t.title}</b><small>{t.artist}</small></span><span className="song-time">{t.duration?Math.floor(t.duration/60)+":"+String(Math.floor(t.duration%60)).padStart(2,"0"):"3:42"}</span><Icon name="more" size={16}/></button>)}</div>
  </section>
  <section className="home-bottom-callout"><div><small>YOUR LIBRARY</small><h2>Keep everything<br/><em>close.</em></h2><p>Local-first playback, playlists, artwork and search.</p></div><ArrowFillButton onClick={()=>document.getElementById("muse-import")?.click()}>Add music</ArrowFillButton></section>
 </div>;
}