import {useState} from "react";
import {useLibrary} from "../../library/LibraryContext";
import {usePlayback} from "../../audio/PlaybackContext";
import {Icon} from "../../components/ui/Icon";
import type {Route} from "../../app/routes";

const services=[
  ["Apple Music","apple"],["Spotify","music"],["YouTube Music","music"],["YouTube","monitor"]
] as const;

export function SettingsPage({navigate}:{navigate:(r:Route)=>void}){
 const l=useLibrary(),p=usePlayback();
 const[name,setName]=useState(()=>localStorage.getItem("mfa:profile-name")||"");
 const[savedName,setSavedName]=useState(()=>localStorage.getItem("mfa:profile-name")||"");
 const[servicesOpen,setServicesOpen]=useState(false);
 const saveName=()=>{const clean=name.trim().slice(0,32);if(clean)localStorage.setItem("mfa:profile-name",clean);else localStorage.removeItem("mfa:profile-name");setName(clean);setSavedName(clean)};
 return <div className="page settings-page">
   <div className="page-heading"><div><small>SYSTEM</small><h1>Settings</h1><p>Controls for how Museflix behaves on this device.</p></div></div>

   <section className="settings-group">
    <header>PLAYBACK</header>
    <div className="settings-control"><div><strong>Autoplay next</strong><small>Continue through the current queue when a track ends.</small></div><button className={"settings-switch "+(p.autoplay?"on":"")} onClick={()=>p.setAutoplay(!p.autoplay)} aria-label="Toggle autoplay"><i/></button></div>
    <button className="settings-row" onClick={()=>navigate("equalizer")}><Icon name="sliders"/><span><strong>Equalizer</strong><small>Six-band EQ, bass boost, virtualizer and loudness.</small></span><Icon name="chevron"/></button>
    <div className="settings-info-row"><Icon name="clock"/><span><strong>Sleep timer</strong><small>Set 10, 20, 30 or 60 minutes from Now Playing.</small></span></div>
   </section>

   <section className="settings-group">
    <header>LIBRARY</header>
    <button className="settings-row" onClick={()=>document.getElementById("muse-import")?.click()}><Icon name="plus"/><span><strong>Add music</strong><small>Import MP3, FLAC, M4A, WAV, OGG and other supported audio.</small></span><Icon name="chevron"/></button>
    <div className="settings-storage"><div><small>LOCAL STORAGE</small><strong>{l.tracks.length} tracks stored locally</strong></div><button onClick={()=>{if(confirm("Delete all local music?"))void l.clear()}}><Icon name="trash"/> Clear library</button></div>
   </section>

   <section className="settings-group">
    <header>PERSONALISATION</header>
    <div className="settings-name"><div><strong>What should Museflix call you?</strong><small>Optional. This only changes the local greeting.</small></div><div className="settings-name-edit"><input maxLength={32} value={name} onChange={e=>setName(e.target.value)} placeholder="Anonymous is fine"/><button onClick={saveName} disabled={name===savedName}>Save</button></div></div>
    <div className="settings-fixed"><span>Theme</span><b>Dark</b></div>
   </section>

   <section className="settings-group">
    <header>CONNECTED SERVICES</header>
    <button className="settings-row" onClick={()=>setServicesOpen(v=>!v)}><Icon name="link"/><span><strong>Music services</strong><small>Service connections are separate from your local library.</small></span><span className="settings-status">{servicesOpen?"HIDE":"VIEW"}</span></button>
    {servicesOpen&&<div className="service-list">{services.map(([name,icon])=><div className="service-row" key={name}><Icon name={icon}/><span><strong>{name}</strong><small>OAuth setup required</small></span><b>NOT CONNECTED</b></div>)}<p>These providers require their own developer credentials and OAuth redirect configuration. Museflix does not claim a connection until that handshake is implemented.</p></div>}
   </section>

   <section className="settings-group">
    <header>ABOUT</header>
    <div className="settings-info-row"><Icon name="monitor"/><span><strong>Museflix</strong><small>Local-first music player · v1.0 preparation</small></span></div>
    <div className="settings-info-row"><Icon name="library"/><span><strong>Privacy model</strong><small>No account required. Imported audio stays in this browser.</small></span></div>
   </section>
 </div>
}
