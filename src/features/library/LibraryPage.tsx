import {useMemo,useState} from "react";
import {useLibrary} from "../../library/LibraryContext";
import {usePlayback} from "../../audio/PlaybackContext";
import {Icon} from "../../components/ui/Icon";import {Artwork} from "../../components/visual/Artwork";
import type {StoredTrack} from "../../types";
type MobileTab="playlists"|"artists"|"albums"|"folders";
type Playlist={id:string;name:string;trackIds:string[];createdAt:number};
const Art=({t}:{t:StoredTrack})=><Artwork track={t} size="sm" index={2}/>;
const readPlaylists=():Playlist[]=>{try{const x=JSON.parse(localStorage.getItem("mfa:playlists")||"[]");return Array.isArray(x)?x:[]}catch{return[]}};
export function LibraryPage(){
 const l=useLibrary(),p=usePlayback(),[tab,setTab]=useState<"songs"|"albums"|"artists"|"favorites">("songs"),[mobileTab,setMobileTab]=useState<MobileTab>("playlists"),[selected,setSelected]=useState<Playlist|null>(null);
 const rows=tab==="favorites"?l.favoriteTracks:l.ordered;
 const albums=useMemo(()=>Array.from(new Map(l.ordered.map(t=>[(t.album||"Local Music")+"|"+t.artist,t])).values()),[l.ordered]);
 const artists=useMemo(()=>Array.from(new Map(l.ordered.map(t=>[t.artist,t])).values()),[l.ordered]);
 const playlists=useMemo(()=>readPlaylists(),[l.tracks,l.favorites]);
 const mobileRows=selected?l.ordered.filter(t=>selected.trackIds.includes(t.id)):l.ordered;
 return <div className="page library-page">
  <div className="page-heading"><div><small>LIBRARY</small><h1>Your collection</h1><p>{l.tracks.length} tracks stored on this device.</p></div><button className="icon-button" onClick={()=>document.getElementById("muse-import")?.click()}><Icon name="plus"/></button></div>
  <div className="segmented">{(["songs","albums","artists","favorites"] as const).map(x=><button className={tab===x?"active":""} onClick={()=>setTab(x)} key={x}>{x}</button>)}</div>
  {tab==="songs"||tab==="favorites"?<div className="library-list">{rows.map(t=><button className={p.current?.id===t.id?"library-row playing":"library-row"} key={t.id} onClick={()=>void p.play(t)}><Art t={t}/><span><strong>{t.title}</strong><small>{t.artist} · {t.album}</small></span><i>{t.duration?Math.floor(t.duration/60)+":"+String(Math.floor(t.duration%60)).padStart(2,"0"):"—"}</i><span className="row-heart" onClick={e=>{e.stopPropagation();l.toggleFavorite(t.id)}}><Icon name="heart" size={17}/></span></button>)}</div>:<div className="entity-grid">{(tab==="albums"?albums:artists).map(t=><button key={t.id} onClick={()=>void p.play(t)}><Art t={t}/><strong>{tab==="albums"?t.album:t.artist}</strong><span>{tab==="albums"?t.artist:"Artist"}</span></button>)}</div>}
  <div className="mobile-library">
   <div className="mobile-library-head"><div><span className="micro-label">COLLECTION</span><h1>Your Library</h1><p>{l.tracks.length} tracks on this device</p></div><button onClick={()=>document.getElementById("muse-import")?.click()} aria-label="Add music"><Icon name="plus" size={17}/></button></div>
   {selected&&<button className="mobile-library-back" onClick={()=>setSelected(null)}><Icon name="back" size={13}/> Back to Playlists</button>}
   {!selected&&<div className="mobile-library-tabs">{(["playlists","artists","albums","folders"] as const).map(x=><button className={mobileTab===x?"active":""} onClick={()=>setMobileTab(x)} key={x}>{x}</button>)}</div>}
   {selected?<div className="mobile-library-list">{mobileRows.length?mobileRows.map(t=><button key={t.id} onClick={()=>void p.play(t)}><Art t={t}/><span><strong>{t.title}</strong><small>{t.artist}</small></span><span className="row-heart"><Icon name="play" size={14}/></span></button>):<div className="empty-state"><p>This playlist is empty.</p></div>}</div>:
    mobileTab==="playlists"?<div className="mobile-library-list">{playlists.length?playlists.map(x=><button key={x.id} onClick={()=>setSelected(x)}><span className="mobile-library-icon"><Icon name="playlist" size={17}/></span><span><strong>{x.name}</strong><small>{x.trackIds.length} tracks</small></span><Icon name="chevron" size={14}/></button>):<div className="empty-state"><p>No playlists yet. Create one from Playlists.</p></div>}</div>:
    mobileTab==="artists"?<div className="mobile-library-list">{artists.map(t=><button key={t.id} onClick={()=>void p.play(t)}><Art t={t}/><span><strong>{t.artist}</strong><small>Artist</small></span><Icon name="play" size={14}/></button>)}</div>:
    mobileTab==="albums"?<div className="mobile-library-list">{albums.map(t=><button key={t.id} onClick={()=>void p.play(t)}><Art t={t}/><span><strong>{t.album||"Local Music"}</strong><small>{t.artist}</small></span><Icon name="play" size={14}/></button>)}</div>:
    <div className="mobile-folder-grid"><button onClick={()=>document.getElementById("muse-import")?.click()}><Icon name="folder" size={18}/><strong>Imported Music</strong><small>{l.tracks.length} tracks · browser storage</small></button></div>}
  </div>
 </div>
}