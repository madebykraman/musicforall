import type {ReactNode,CSSProperties} from "react";
import type {StoredTrack} from "../types";
import "./obsidian.css";

type Repeat = "off"|"all"|"one";

const iconPath:Record<string,string>={
 play:"M8 5v14l11-7z",pause:"M7 5h4v14H7zM13 5h4v14h-4z",
 prev:"M19 5v14l-9-7zM6 5v14",next:"M5 5v14l9-7zM18 5v14",
 heart:"M20.8 8.9c0 5.5-8.8 10.1-8.8 10.1S3.2 14.4 3.2 8.9A5 5 0 0 1 12 5.4a5 5 0 0 1 8.8 3.5",
 shuffle:"M4 7h3c4 0 5 10 10 10h3M4 17h3c1.5 0 2.5-1.2 3.3-2.5M17 4l3 3-3 3M17 14l3 3-3 3",
 repeat:"M17 2l3 3-3 3M4 5h16v6M7 22l-3-3 3-3M20 19H4v-6"
};
function I({name,size=20}:{name:string;size?:number}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={iconPath[name]}/></svg>}

export function ObsidianArrowButton({children,onClick}:{children:ReactNode;onClick?:()=>void}) {
 return <button type="button" className="obs-arrow-btn" onClick={onClick}>{children}<span className="obs-arrow-circle"><I name="next" size={13}/></span></button>;
}

export function ObsidianMusicCard({track,playing,time,onToggle,onPrev,onNext,favorite,onFavorite,shuffle,onShuffle,repeat,onRepeat,sleepTimer,onSleepTimer}:{track:StoredTrack;playing:boolean;time:number;onToggle:()=>void;onPrev:()=>void;onNext:()=>void;favorite:boolean;onFavorite:()=>void;shuffle:boolean;onShuffle:()=>void;repeat:Repeat;onRepeat:()=>void;sleepTimer:number|null;onSleepTimer:()=>void}) {
 const pct=Math.max(0,Math.min(100,(time/Math.max(track.duration||1,1))*100));
 return <section className="obs-music-card">
   <div className="obs-music-inner">
     <div className="obs-cover">{track.artworkUrl?<img src={track.artworkUrl} alt="" />:<span>M</span>}</div>
     <div className="obs-track-info"><div><h1>{track.title}</h1><p>{track.artist}</p></div><button className={favorite?"is-on":""} onClick={onFavorite} aria-label="Favorite"><I name="heart" size={20}/></button></div>
     <div className="obs-progress-wrap"><div className="obs-progress-meta"><span>{formatTime(time)}</span><span>{formatTime(track.duration||0)}</span></div><input aria-label="Seek" type="range" min="0" max={track.duration||1} value={Math.min(time,track.duration||1)} onChange={e=>{const el=document.querySelector(".mf-audio") as HTMLAudioElement|null;if(el)el.currentTime=Number(e.target.value)}} style={{"--progress":pct+"%"} as CSSProperties}/></div>
     <div className="obs-wave">{Array.from({length:56},(_,i)=><i key={i} style={{height:(20+((i*29)%65))+"%"}} className={i/56*100<pct?"lit":""}/>)}</div>
     <div className="obs-controls">
       <button className={shuffle?"is-on":""} onClick={onShuffle} aria-label="Shuffle"><I name="shuffle" size={18}/></button>
       <button onClick={onPrev} aria-label="Previous"><I name="prev" size={24}/></button>
       <button className="obs-play" onClick={onToggle} aria-label={playing?"Pause":"Play"}><I name={playing?"pause":"play"} size={27}/></button>
       <button onClick={onNext} aria-label="Next"><I name="next" size={24}/></button>
       <button className={repeat!=="off"?"is-on":""} onClick={onRepeat} aria-label="Repeat"><I name="repeat" size={18}/></button>
     </div>
     <div className="obs-actions"><button type="button">Lyrics</button><button type="button">Credits</button><button type="button" onClick={onSleepTimer}>Sleep {sleepTimer===null?"timer":sleepTimer<60?sleepTimer+"s":Math.ceil(sleepTimer/60)+"m"}</button></div>
   </div>
 </section>;
}
function formatTime(n:number){return Number.isFinite(n)&&n>=0?Math.floor(n/60)+":"+String(Math.floor(n%60)).padStart(2,"0"):"—"}
