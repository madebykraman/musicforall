import {useMemo} from "react";
import {useLibrary} from "../../library/LibraryContext";
import {usePlayback} from "../../audio/PlaybackContext";
import {Icon} from "../../components/ui/Icon";
import {Artwork} from "../../components/visual/Artwork";
import {SpotlightCard} from "../../components/visual/SpotlightCard";
import {ArrowFillButton} from "../../components/obsidian/ArrowFillButton";
import type {StoredTrack} from "../../types";

const demo:StoredTrack[]=[
{id:"demo-1",blobId:"",title:"Die For You",artist:"The Weeknd",album:"Starboy",source:"local",addedAt:1},
{id:"demo-2",blobId:"",title:"Blinding Lights",artist:"The Weeknd",album:"After Hours",source:"local",addedAt:2},
{id:"demo-3",blobId:"",title:"Starboy",artist:"The Weeknd",album:"Starboy",source:"local",addedAt:3},
{id:"demo-4",blobId:"",title:"Sweater Weather",artist:"The Neighbourhood",album:"I Love You.",source:"local",addedAt:4},
{id:"demo-5",blobId:"",title:"Heat Waves",artist:"Glass Animals",album:"Dreamland",source:"local",addedAt:5},
{id:"demo-6",blobId:"",title:"I Ain't Worried",artist:"OneRepublic",album:"Top Gun",source:"local",addedAt:6},
{id:"demo-7",blobId:"",title:"Midnight City",artist:"M83",album:"Hurry Up, We're Dreaming",source:"local",addedAt:7},
{id:"demo-8",blobId:"",title:"Harry's House",artist:"Harry Styles",album:"Harry's House",source:"local",addedAt:8}
];
const safePlay=(play:(t:StoredTrack)=>Promise<void>,t:StoredTrack)=>{if(t.blobId)void play(t)};
export function HomePage(){
 const l=useLibrary(),p=usePlayback(),tracks=l.ordered.length?l.ordered:demo;
 const recent=l.recent.map(id=>l.tracks.find(t=>t.id===id)).filter(Boolean) as StoredTrack[];
 const hero=p.current||tracks[0];
 const picks=useMemo(()=>[...recent,...tracks].filter((t,i,a)=>a.findIndex(x=>x.id===t.id)===i).slice(0,8),[recent,tracks]);
 return <div className="home-page">
  <section className="home-hero-grid">
   <SpotlightCard className="home-hero"><div className="hero-copy"><span className="micro-label">GOOD EVENING.</span><h1>Aman</h1><p>Your Music. Always With You.</p><button className="hero-play" onClick={()=>safePlay(p.play,hero)}><Icon name="play" size={13}/></button></div><Artwork track={hero} size="hero" index={0}/><div className="hero-noise"/></SpotlightCard>
   <SpotlightCard className="continue-card"><div className="card-kicker">CONTINUE LISTENING</div><button className="continue-track" onClick={()=>safePlay(p.play,hero)}><Artwork track={hero} size="sm" index={1}/><span><b>{hero.title}</b><small>{hero.artist}</small></span><i><Icon name="play" size={10}/></i></button><div className="continue-art"><Artwork track={hero} size="md" index={3}/></div></SpotlightCard>
  </section>
  <section className="mix-row">{[["Chill Mix","A mix for your evening",1],["Indie Faves","Discover something new",2],["Workout","Energy for the grind",4],["Late Night","Sounds after dark",5]].map(([title,sub,index],i)=><button className={"mix-card mix-"+i} key={String(title)} onClick={()=>safePlay(p.play,tracks[Number(index)%tracks.length])}><Artwork track={tracks[Number(index)%tracks.length]} index={Number(index)}/><span><b>{title}</b><small>{sub}</small></span></button>)}</section>
  <section className="shelf"><header><div><span className="micro-label">YOUR COLLECTION</span><h2>Recently Added</h2></div><button onClick={()=>document.getElementById("muse-import")?.click()}>See All <span>→</span></button></header><div className="album-row">{tracks.slice(0,8).map((t,i)=><button className="album-card" key={t.id+"-"+i} onClick={()=>safePlay(p.play,t)}><Artwork track={t} index={i}/><b>{t.title}</b><small>{t.artist}</small></button>)}</div></section>
  <section className="shelf rotation-shelf"><header><div><span className="micro-label">KEEP LISTENING</span><h2>Your Rotation</h2></div><button onClick={()=>document.getElementById("muse-import")?.click()}>Manage</button></header><div className="song-stack">{picks.map((t,i)=><button key={t.id+"r"} className="song-row" onClick={()=>safePlay(p.play,t)}><span className="num">{String(i+1).padStart(2,"0")}</span><Artwork track={t} size="sm" index={i}/><span className="song-meta"><b>{t.title}</b><small>{t.artist}</small></span><span className="song-album">{t.album}</span><span className="song-time">{t.duration?Math.floor(t.duration/60)+":"+String(Math.floor(t.duration%60)).padStart(2,"0"):"3:42"}</span><Icon name="more" size={15}/></button>)}</div></section>
  <section className="home-bottom-callout"><div><span className="micro-label">YOUR LIBRARY</span><h2>Keep everything<br/><em>close.</em></h2><p>Local-first playback, playlists, artwork and search.</p></div><ArrowFillButton onClick={()=>document.getElementById("muse-import")?.click()}>Add music</ArrowFillButton></section>
 </div>;
}