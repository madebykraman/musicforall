import {useMemo,useState} from "react";
import {usePlayback} from "../../audio/PlaybackContext";
import {DEFAULT_EQUALIZER,type EqualizerState} from "../../lib/equalizer";

const presets:Record<string,number[]>={Custom:DEFAULT_EQUALIZER.bands,Pop:[42,58,70,78,72,66],Rock:[58,54,68,76,70,60],"Hip Hop":[62,58,50,68,82,68],Jazz:[50,46,58,64,58,52]};

export function EqualizerPage(){
 const p=usePlayback();
 const[state,setState]=useState<EqualizerState>(()=>{try{const x=JSON.parse(localStorage.getItem("mfa:eq")||"null");return x&&Array.isArray(x.bands)?x:DEFAULT_EQUALIZER}catch{return DEFAULT_EQUALIZER}});
 const supported=useMemo(()=>typeof window!=="undefined"&&("AudioContext" in window||"webkitAudioContext" in (window as typeof window & {webkitAudioContext?:unknown})),[]);
 const patch=(x:Partial<EqualizerState>)=>{const next={...state,...x};setState(next);p.setEqualizer(next)};
 const reset=()=>patch({...DEFAULT_EQUALIZER,bands:[...DEFAULT_EQUALIZER.bands]});
 return <div className="page">
  <div className="page-heading"><div><small>PLAYBACK</small><h1>Equalizer</h1><p>Real Web Audio processing applied to local playback.</p></div></div>
  <div className="eq-panel">
   <div className="eq-status"><span><i className={supported?"ready":""}/>{supported?"Web Audio available":"Web Audio unavailable"}</span><button onClick={reset}>Reset</button></div>
   <div className="eq-presets">{Object.entries(presets).map(([name,bands])=><button className={bands.every((v,i)=>v===state.bands[i])?"active":""} onClick={()=>patch({bands:[...bands]})} key={name}>{name}</button>)}</div>
   <div className="eq-sliders">{["60","250","1K","4K","8K","16K"].map((label,i)=><label key={label}><input aria-label={label+" Hz"} type="range" min="0" max="100" value={state.bands[i]??50} onChange={e=>{const b=[...state.bands];b[i]=Number(e.target.value);patch({bands:b})}}/><span>{label}</span></label>)}</div>
   {(["bassBoost","virtualizer","loudness"] as const).map(k=><button className="toggle" key={k} onClick={()=>patch({[k]:!state[k]})}><span>{k==="bassBoost"?"Bass Boost":k==="virtualizer"?"Virtualizer":"Loudness"}</span><i className={state[k]?"on":""}/></button>)}
  </div>
 </div>
}
