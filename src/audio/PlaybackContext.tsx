import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState,type ReactNode} from "react";
import type {StoredTrack} from "../types";
import {getBlob,updateTrackMetadata,useLibrary} from "../library/LibraryContext";
import {MuseflixAudioEngine,DEFAULT_EQUALIZER,type EqualizerState} from "../lib/equalizer";

type Repeat="off"|"all"|"one";
type PlaybackValue={current:StoredTrack|null;playing:boolean;time:number;queue:StoredTrack[];shuffle:boolean;repeat:Repeat;sleepTimer:number|null;error:string|null;toggle:()=>Promise<void>;play:(t:StoredTrack,reset?:boolean)=>Promise<void>;next:()=>Promise<void>;previous:()=>Promise<void>;seek:(n:number)=>void;setShuffle:(v:boolean)=>void;cycleRepeat:()=>void;cycleSleepTimer:()=>void;setEqualizer:(state:EqualizerState)=>void;openQueue:()=>void;closeQueue:()=>void;queueOpen:boolean};

const C=createContext<PlaybackValue|null>(null);
const mediaSession=()=>("mediaSession" in navigator ? navigator.mediaSession : null);

export function PlaybackProvider({children}:{children:ReactNode}){
 const{ordered,refresh}=useLibrary();
 const[current,setCurrent]=useState<StoredTrack|null>(null),[playing,setPlaying]=useState(false),[time,setTime]=useState(0),[queue,setQueue]=useState<StoredTrack[]>([]),[shuffle,setShuffle]=useState(false),[repeat,setRepeat]=useState<Repeat>("off"),[sleepTimer,setSleepTimer]=useState<number|null>(null),[error,setError]=useState<string|null>(null),[queueOpen,setQueueOpen]=useState(false);
 const audio=useRef(new Audio());const engine=useRef(new MuseflixAudioEngine());const engineReady=useRef(false);const url=useRef<string|null>(null);const eq=useRef<EqualizerState>(DEFAULT_EQUALIZER);

 useEffect(()=>{const a=audio.current;a.preload="auto";a.setAttribute("playsinline","true");a.setAttribute("webkit-playsinline","true");try{const x=JSON.parse(localStorage.getItem("mfa:eq")||"null");if(x&&Array.isArray(x.bands))eq.current=x}catch{}return()=>{if(url.current)URL.revokeObjectURL(url.current);a.pause();a.removeAttribute("src");}},[]);
 const setRecent=(id:string)=>{try{const raw=JSON.parse(localStorage.getItem("mfa:recent")||"[]") as string[];localStorage.setItem("mfa:recent",JSON.stringify([id,...raw.filter(x=>x!==id)].slice(0,30)))}catch{}};

 const play=useCallback(async(t:StoredTrack,reset=true)=>{
   setError(null);
   if(!t.blobId){setError("This track has no local audio file.");return}
   try{
     const blob=await getBlob(t.blobId);if(!blob){setError("This track is no longer available on this device.");return}
     const a=audio.current;
     a.pause();
     if(url.current)URL.revokeObjectURL(url.current);
     url.current=URL.createObjectURL(blob);
     a.src=url.current;a.load();
     setCurrent(t);setTime(0);
     if(reset){const i=ordered.findIndex(x=>x.id===t.id);setQueue(i>=0?ordered.slice(i+1):[])}
     setQueue(q=>q.filter(x=>x.id!==t.id));setRecent(t.id);
     void updateTrackMetadata(t.id,{playCount:(t.playCount||0)+1}).then(()=>refresh()).catch(()=>{});
     try{if(!engineReady.current){engine.current.connect(a);engineReady.current=true}await engine.current.resume(a);engine.current.setState(eq.current)}catch{}
     await a.play();
   }catch(e){setPlaying(false);setError(e instanceof DOMException&&e.name==="NotAllowedError"?"Playback was blocked by the browser. Tap Play again.":"Museflix could not start this audio file.");}
 },[ordered,refresh]);

 const next=useCallback(async()=>{
   if(!current||!ordered.length)return;
   if(repeat==="one"){audio.current.currentTime=0;await audio.current.play().catch(()=>{});return}
   if(queue.length){const n=queue[0];setQueue(q=>q.slice(1));await play(n,false);return}
   let n:StoredTrack|undefined;
   if(shuffle){const pool=ordered.filter(t=>t.id!==current.id);n=pool[Math.floor(Math.random()*pool.length)]}
   else{const i=ordered.findIndex(t=>t.id===current.id);if(i<0)return;if(repeat==="off"&&i===ordered.length-1){setPlaying(false);return}n=ordered[(i+1+ordered.length)%ordered.length]}
   if(n)await play(n,false);
 },[current,ordered,repeat,queue,shuffle,play]);

 const previous=useCallback(async()=>{
   if(audio.current.currentTime>3){audio.current.currentTime=0;setTime(0);return}
   if(!current||!ordered.length)return;
   const i=ordered.findIndex(t=>t.id===current.id);const n=ordered[(i-1+ordered.length)%ordered.length];if(n)await play(n,false);
 },[current,ordered,play]);

 useEffect(()=>{
   const a=audio.current;
   const onPlay=()=>{setPlaying(true);const m=mediaSession();if(m)m.playbackState="playing"};
   const onPause=()=>{setPlaying(false);const m=mediaSession();if(m)m.playbackState="paused"};
   const onTime=()=>setTime(Number.isFinite(a.currentTime)?a.currentTime:0);
   const onEnd=()=>void next();
   const onError=()=>{setPlaying(false);setError("The audio file could not be decoded by this browser.")};
   a.addEventListener("play",onPlay);a.addEventListener("pause",onPause);a.addEventListener("timeupdate",onTime);a.addEventListener("ended",onEnd);a.addEventListener("error",onError);
   return()=>{a.removeEventListener("play",onPlay);a.removeEventListener("pause",onPause);a.removeEventListener("timeupdate",onTime);a.removeEventListener("ended",onEnd);a.removeEventListener("error",onError)};
 },[next]);

 useEffect(()=>{
   const m=mediaSession();if(!m)return;
   try{m.setActionHandler("play",()=>void audio.current.play());m.setActionHandler("pause",()=>audio.current.pause());m.setActionHandler("previoustrack",()=>void previous());m.setActionHandler("nexttrack",()=>void next());m.setActionHandler("seekbackward",e=>audio.current.currentTime=Math.max(0,audio.current.currentTime-(e.seekOffset||10)));m.setActionHandler("seekforward",e=>audio.current.currentTime=Math.min(audio.current.duration||Infinity,audio.current.currentTime+(e.seekOffset||10)));m.setActionHandler("seekto",e=>{if(typeof e.seekTime==="number")audio.current.currentTime=Math.max(0,e.seekTime)});}catch{}
   return()=>{try{m.setActionHandler("play",null);m.setActionHandler("pause",null);m.setActionHandler("previoustrack",null);m.setActionHandler("nexttrack",null);m.setActionHandler("seekbackward",null);m.setActionHandler("seekforward",null);m.setActionHandler("seekto",null)}catch{}};
 },[next,previous]);

 useEffect(()=>{const m=mediaSession();if(!m||!current)return;try{m.metadata=new MediaMetadata({title:current.title,artist:current.artist,album:current.album||"Museflix",artwork:current.artworkUrl?[{src:current.artworkUrl,sizes:"512x512"}]:[]})}catch{}},[current]);

 useEffect(()=>{const m=mediaSession();if(!m||!current||!Number.isFinite(current.duration)||!current.duration)return;try{m.setPositionState({duration:current.duration,position:Math.min(time,current.duration),playbackRate:audio.current.playbackRate})}catch{}},[current,time]);

 useEffect(()=>{if(sleepTimer===null)return;const id=window.setInterval(()=>setSleepTimer(v=>{if(v===null)return null;if(v<=1){audio.current.pause();return null}return v-1}),1000);return()=>window.clearInterval(id)},[sleepTimer]);

 const toggle=useCallback(async()=>{setError(null);if(!current){if(ordered[0])await play(ordered[0]);return}if(audio.current.paused){try{if(engineReady.current)await engine.current.resume(audio.current);await audio.current.play()}catch{setError("Playback was blocked by the browser. Tap Play again.")}}else audio.current.pause()},[current,ordered,play]);
 const seek=(n:number)=>{if(!Number.isFinite(n))return;const next=Math.max(0,n);audio.current.currentTime=next;setTime(next)};
 const cycleRepeat=()=>setRepeat(v=>v==="off"?"all":v==="all"?"one":"off");
 const cycleSleepTimer=()=>setSleepTimer(v=>v===null?600:v===600?1200:v===1200?1800:v===1800?3600:null);
 const setEqualizer=(state:EqualizerState)=>{eq.current=state;localStorage.setItem("mfa:eq",JSON.stringify(state));try{engine.current.setState(state)}catch{}};
 const value=useMemo(()=>({current,playing,time,queue,shuffle,repeat,sleepTimer,error,toggle,play,next,previous,seek,setShuffle,cycleRepeat,cycleSleepTimer,setEqualizer,openQueue:()=>setQueueOpen(true),closeQueue:()=>setQueueOpen(false),queueOpen}),[current,playing,time,queue,shuffle,repeat,sleepTimer,error,toggle,play,next,previous,queueOpen]);
 return <C.Provider value={value}>{children}</C.Provider>
}
export function usePlayback(){const v=useContext(C);if(!v)throw new Error("usePlayback must be used inside PlaybackProvider");return v}
