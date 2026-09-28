import {useLibrary} from "../../library/LibraryContext";import {usePlayback} from "../../audio/PlaybackContext";import {Icon} from "../../components/ui/Icon";import type {StoredTrack} from "../../types";
type Demo={title:string;artist:string;album:string;kind:string;duration:string};
const demoTracks:Demo[]=[
 {title:"Die For You",artist:"The Weeknd",album:"Starboy",kind:"starboy",duration:"4:21"},
 {title:"Blinding Lights",artist:"The Weeknd",album:"After Hours",kind:"midnights",duration:"3:20"},
 {title:"Starboy",artist:"The Weeknd",album:"Starboy",kind:"starboy",duration:"3:50"},
 {title:"Sweater Weather",artist:"The Neighbourhood",album:"I Love You.",kind:"utopia",duration:"4:00"},
 {title:"Heartless",artist:"The Weeknd",album:"After Hours",kind:"sos",duration:"3:18"},
 {title:"I Ain't Worried",artist:"OneRepublic",album:"Top Gun",kind:"callme",duration:"2:28"},
 {title:"Harry's House",artist:"Harry Styles",album:"Harry's House",kind:"harrys",duration:"2:47"},
 {title:"Midnights",artist:"Taylor Swift",album:"Midnights",kind:"midnights",duration:"3:12"},
 {title:"UTOPIA",artist:"Travis Scott",album:"UTOPIA",kind:"utopia",duration:"4:12"},
 {title:"SOS",artist:"SZA",album:"SOS",kind:"sos",duration:"3:58"}
];
const demoAlbums=[["Starboy","The Weeknd","starboy"],["UTOPIA","Travis Scott","utopia"],["Midnights","Taylor Swift","midnights"],["Harry's House","Harry Styles","harrys"],["SOS","SZA","sos"]];
const demoArtists=[["The Weeknd","starboy"],["Taylor Swift","midnights"],["Travis Scott","utopia"],["SZA","sos"],["Harry Styles","harrys"]];
const Art=({t,kind}:{t?:StoredTrack;kind?:string})=>{const k=kind||((t?.title||"").toLowerCase().includes("starboy")?"starboy":(t?.title||"").toLowerCase().includes("utopia")?"utopia":(t?.title||"").toLowerCase().includes("midnight")?"midnights":(t?.title||"").toLowerCase().includes("harry")?"harrys":(t?.title||"").toLowerCase().includes("sos")?"sos":"starboy");return <div className={"muse-art "+k}>{t?.artworkUrl?<img src={t.artworkUrl} alt=""/>:<span>{t?.title?.slice(0,1)||"M"}</span>}</div>};
export function HomePage(){
 const l=useLibrary(),p=usePlayback();
 const recent=l.recent.map(id=>l.tracks.find(t=>t.id===id)).filter(Boolean) as StoredTrack[];
 const feature=p.current||l.ordered[0]; const hasLibrary=l.ordered.length>0;
 const picks=[...l.favoriteTracks,...recent,...l.ordered].filter((t,i,a)=>a.findIndex(x=>x.id===t.id)===i).slice(0,8);
 const shown=hasLibrary?picks:demoTracks;
 return <div className="page">
  <div className="page-intro"><div><small>YOUR MUSIC</small><h1>Good Evening,<br/><em>Aman.</em></h1><p>Your Music. Always With You.</p></div><button className="import-button" onClick={()=>document.getElementById("muse-import")?.click()}><Icon name="plus"/> Add music</button></div>
  <section className="feature-card"><div className="feature-art"><Art t={feature} kind={hasLibrary?undefined:"starboy"}/></div><div><small>CONTINUE LISTENING</small><h2>{feature?.title||"Die For You"}</h2><p>{feature?feature.artist+" · "+feature.album:"The Weeknd · Starboy"}</p><button onClick={()=>feature&&void p.play(feature)}><Icon name="play" size={14}/> {feature?"Resume":"Play"}</button></div></section>
  <div className="section-title"><div><small>QUICK PICKS</small><h2>Made for your moment</h2></div></div>
  <div className="shelf">{shown.slice(0,4).map((t:any,i:number)=><button className="track-card" key={t.id||t.title} onClick={()=>t.id&&void p.play(t)}><Art t={t.id?t:undefined} kind={t.kind}/><strong>{t.title}</strong><span>{t.artist}</span></button>)}</div>
  <div className="section-title"><div><small>RECENTLY ADDED</small><h2>Fresh to your library</h2></div><span className="eyebrow">SEE ALL</span></div>
  <div className="shelf">{shown.slice(0,6).map((t:any)=><button className="track-card" key={"r"+(t.id||t.title)} onClick={()=>t.id&&void p.play(t)}><Art t={t.id?t:undefined} kind={t.kind}/><strong>{t.title}</strong><span>{t.artist}</span></button>)}</div>
  <div className="section-title"><div><small>ALBUMS</small><h2>Your albums</h2></div><span className="eyebrow">SEE ALL</span></div>
  <div className="shelf">{demoAlbums.map(([title,artist,kind])=><button className="track-card" key={title}><Art kind={kind}/><strong>{title}</strong><span>{artist}</span></button>)}</div>
  <div className="section-title"><div><small>ARTISTS</small><h2>Artists</h2></div></div>
  <div className="shelf artist-shelf">{demoArtists.map(([name,kind])=><button className="entity-card" key={name}><Art kind={kind}/><strong>{name}</strong><span>Artist</span></button>)}</div>
  {!shown.length&&<div className="empty-state"><Icon name="library" size={28}/><h3>Your library is empty</h3><p>Import local audio to build your listening space.</p></div>}
 </div>
}