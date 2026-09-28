import {useState} from "react";
import {Icon} from "../../components/ui/Icon";

const SERVICES=[
  ["Spotify","Your playlists and saved music","spotify"],
  ["YouTube Music","Playlists and library sources","youtube"],
  ["Apple Music","Library and playlist handoff","apple"],
  ["YouTube","Music you already keep there","youtube"],
] as const;

export function Onboarding({onComplete}:{onComplete:()=>void}){
  const[step,setStep]=useState<"intro"|"setup">("intro");
  const[name,setName]=useState(()=>localStorage.getItem("mfa:profile-name")||"");
  const[showConnectors,setShowConnectors]=useState(false);
  const[notice,setNotice]=useState("");
  const finish=()=>{
    const clean=name.trim().slice(0,32);
    if(clean)localStorage.setItem("mfa:profile-name",clean);else localStorage.removeItem("mfa:profile-name");
    localStorage.setItem("mfa:onboarding-complete","1");
    onComplete();
  };
  const importMusic=()=>document.getElementById("muse-import")?.click();
  return <div className="muse-onboarding">
    <div className="onboarding-glow onboarding-glow-a"/>
    <div className="onboarding-glow onboarding-glow-b"/>
    <div className="onboarding-shell">
      <div className="onboarding-brand"><span>M</span><b>Museflix</b></div>
      {step==="intro"?<section className="onboarding-hero">
        <small>YOUR MUSIC. YOUR RULES.</small>
        <h1>A music player<br/><em>that starts with you.</em></h1>
        <p>Local-first playback, a beautiful library, proper controls, and none of the imaginary catalogue nonsense.</p>
        <div className="onboarding-points">
          <span><Icon name="music"/>Your files stay yours.</span>
          <span><Icon name="library"/>One library, one place.</span>
          <span><Icon name="monitor"/>Desktop, mobile, installed app.</span>
        </div>
        <button className="onboarding-primary" onClick={()=>setStep("setup")}>Let's make it yours <Icon name="arrow" size={15}/></button>
        <button className="onboarding-secondary" onClick={finish}>Skip setup</button>
      </section>:<section className="onboarding-setup">
        <small>ONE LAST THING</small>
        <h1>What should we<br/><em>call you?</em></h1>
        <p className="onboarding-joke">Real name. Reddit name. A pseudonym. “Captain Bass.” Or absolutely nothing. We don't need your government name to play an MP3.</p>
        <label className="onboarding-name"><span>NAME <i>OPTIONAL</i></span><input autoFocus maxLength={32} value={name} onChange={e=>setName(e.target.value)} placeholder="Leave blank. We won't be offended."/></label>
        <div className="onboarding-actions">
          <button className="onboarding-primary" onClick={importMusic}><Icon name="plus" size={15}/> Import your music</button>
          <button className="onboarding-service-button" onClick={()=>setShowConnectors(v=>!v)}><Icon name="link" size={15}/> Connect a music service</button>
        </div>
        {showConnectors&&<div className="onboarding-connectors">
          {SERVICES.map(([title,sub])=><div className="connector-row" key={title}><span>{title}</span><small>{sub}</small><b>SETUP REQUIRED</b></div>)}
          <p>These services need their OAuth credentials and redirect configuration before Museflix can sign in to them. This panel is intentionally not pretending a connection exists.</p>
        </div>}
        
        <button className="onboarding-finish" onClick={finish}>Enter Museflix <Icon name="arrow" size={14}/></button>
        <button className="onboarding-secondary" onClick={finish}>I'll sort the music out later</button>
      </section>}
    </div>
  </div>
}
