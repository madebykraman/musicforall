import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState,type ChangeEvent,type ReactNode} from "react";
import type {StoredTrack} from "../types";import {deleteTrack,getBlob,listTracks,saveTrack,updateTrackMetadata} from "../lib/db";
const uid=()=>crypto.randomUUID?.()||String(Date.now()+Math.random());
const read=(k:string):string[]=>{try{const x=JSON.parse(localStorage.getItem(k)||"[]");return Array.isArray(x)?x:[]}catch{return[]}};
const parseName=(name:string)=>{const base=name.replace(/\.[^.]+$/,"").replace(/[_]+/g," ").replace(/\s+/g," ").trim();const p=base.split(/\s+-\s+/);return p.length>1?{artist:p[0].trim()||"Unknown Artist",title:p.slice(1).join(" - ").trim()||base}:{artist:"Unknown Artist",title:base||"Untitled"}};
type LibraryValue={tracks:StoredTrack[];favorites:string[];recent:string[];ordered:StoredTrack[];favoriteTracks:StoredTrack[];importFiles:(e:ChangeEvent<HTMLInputElement>)=>Promise<void>;toggleFavorite:(id:string)=>void;removeTrack:(t:StoredTrack)=>Promise<void>;clear:()=>Promise<void>;refresh:()=>Promise<void>;busy:boolean;importError:string|null;clearImportError:()=>void};
const C=createContext<LibraryValue|null>(null);
export function LibraryProvider({children}:{children:ReactNode}){
 const[tracks,setTracks]=useState<StoredTrack[]>([]),[favorites,setFavorites]=useState(read("mfa:favorites")),[recent,setRecent]=useState(read("mfa:recent")),[busy,setBusy]=useState(false),[importError,setImportError]=useState<string|null>(null),artworkBusy=useRef(false);
 const refresh=useCallback(async()=>setTracks(await listTracks()),[]);
 useEffect(()=>{void refresh()},[refresh]);
 useEffect(()=>localStorage.setItem("mfa:favorites",JSON.stringify(favorites)),[favorites]);
 useEffect(()=>localStorage.setItem("mfa:recent",JSON.stringify(recent)),[recent]);
 useEffect(()=>{if(artworkBusy.current||!tracks.length)return;artworkBusy.current=true;(async()=>{try{for(const t of tracks.filter(x=>!x.artworkUrl).slice(0,8)){try{const controller=new AbortController();const timer=window.setTimeout(()=>controller.abort(),5000);const r=await fetch("https://itunes.apple.com/search?term="+encodeURIComponent(t.title+" "+t.artist)+"&entity=song&limit=1",{signal:controller.signal});window.clearTimeout(timer);if(!r.ok)continue;const d=await r.json() as {results?:{artworkUrl100?:string}[]};const url=d.results?.[0]?.artworkUrl100?.replace("100x100","600x600");if(url)await updateTrackMetadata(t.id,{artworkUrl:url})}catch{}}await refresh()}finally{artworkBusy.current=false}})()},[tracks.length,refresh]);
 const importFiles=async(e:ChangeEvent<HTMLInputElement>)=>{
   const fs=Array.from(e.target.files||[]);if(!fs.length)return;setBusy(true);setImportError(null);let imported=0;let skipped=0;
   for(const f of fs){
     if(!f.type.startsWith("audio/")&&!/\.(mp3|flac|m4a|m4b|aac|wav|ogg|opus|aiff|aif|alac|mp2)$/i.test(f.name)){skipped++;continue}
     try{
       const meta=parseName(f.name),id=uid(),blobId=uid(),probe=URL.createObjectURL(f),audio=new Audio(probe);
       const duration=await new Promise<number|undefined>(resolve=>{let done=false;const finish=()=>{if(done)return;done=true;const d=Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:undefined;URL.revokeObjectURL(probe);audio.removeAttribute("src");resolve(d)};audio.onloadedmetadata=finish;audio.onerror=finish;window.setTimeout(finish,1500)});
       await saveTrack({id,blobId,title:meta.title,artist:meta.artist,album:"Local Music",source:"local",duration,addedAt:Date.now()+imported,playCount:0},f);imported++;
     }catch{skipped++}
   }
   await refresh();setBusy(false);e.target.value="";
   if(skipped)setImportError(imported?\`Imported ${imported} file${imported===1?"":"s"}; skipped ${skipped} unsupported or unreadable file${skipped===1?"":"s"}.`:"No supported audio files were imported.");
 };
 const toggleFavorite=(id:string)=>setFavorites(x=>x.includes(id)?x.filter(v=>v!==id):[...x,id]);
 const removeTrack=async(t:StoredTrack)=>{await deleteTrack(t.id,t.blobId);setFavorites(x=>x.filter(v=>v!==t.id));setRecent(x=>x.filter(v=>v!==t.id));await refresh()};
 const clear=async()=>{for(const t of tracks)await deleteTrack(t.id,t.blobId);setTracks([]);setFavorites([]);setRecent([])};
 const clearImportError=()=>setImportError(null);
 const value=useMemo(()=>({tracks,favorites,recent,ordered:[...tracks].sort((a,b)=>b.addedAt-a.addedAt),favoriteTracks:tracks.filter(t=>favorites.includes(t.id)),importFiles,toggleFavorite,removeTrack,clear,refresh,busy,importError,clearImportError}),[tracks,favorites,recent,busy,refresh,importError]);
 return <C.Provider value={value}>{children}</C.Provider>
}
export function useLibrary(){const v=useContext(C);if(!v)throw new Error("useLibrary must be used inside LibraryProvider");return v}
export {getBlob,updateTrackMetadata};
