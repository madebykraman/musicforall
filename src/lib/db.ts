import type {StoredTrack} from "../types";

const META_KEY="music-for-all:tracks:v2";
const LEGACY_DB="music-for-all";
const LEGACY_TRACKS="tracks";
const LEGACY_BLOBS="blobs";

async function getOPFSRoot():Promise<FileSystemDirectoryHandle|null>{
  try{
    if(!navigator.storage?.getDirectory)return null;
    return await navigator.storage.getDirectory();
  }catch{return null}
}

async function writeOPFS(id:string,blob:Blob){
  const root=await getOPFSRoot();
  if(!root)throw new Error("Local file storage is unavailable in this browser.");
  const file=await root.getFileHandle("audio-"+id,{create:true});
  const writable=await file.createWritable();
  try{await writable.write(blob);await writable.close()}catch(error){try{await writable.abort()}catch{undefined}throw error}
}

async function readOPFS(id:string):Promise<Blob|undefined>{
  const root=await getOPFSRoot();
  if(!root)return undefined;
  try{return await (await root.getFileHandle("audio-"+id)).getFile()}catch{return undefined}
}

async function deleteOPFS(id:string){
  const root=await getOPFSRoot();
  if(!root)return;
  try{await root.removeEntry("audio-"+id)}catch{undefined}
}

function readMeta():StoredTrack[]{
  try{
    const raw=localStorage.getItem(META_KEY);
    if(!raw)return [];
    const parsed=JSON.parse(raw);
    return Array.isArray(parsed)?parsed as StoredTrack[]:[];
  }catch{return []}
}
function writeMeta(tracks:StoredTrack[]){localStorage.setItem(META_KEY,JSON.stringify(tracks))}

function openLegacyDB():Promise<IDBDatabase>{
  return new Promise((resolve,reject)=>{
    if(!indexedDB){reject(new Error("Legacy storage is unavailable."));return}
    const request=indexedDB.open(LEGACY_DB,2);
    request.onupgradeneeded=()=>{
      const db=request.result;
      if(!db.objectStoreNames.contains(LEGACY_TRACKS))db.createObjectStore(LEGACY_TRACKS,{keyPath:"id"});
      if(!db.objectStoreNames.contains(LEGACY_BLOBS))db.createObjectStore(LEGACY_BLOBS);
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error||new Error("Legacy storage could not be opened."));
  });
}

async function migrateLegacyMetadata():Promise<StoredTrack[]>{
  if(localStorage.getItem(META_KEY)!==null)return readMeta();
  try{
    const db=await openLegacyDB();
    const tracks=await new Promise<StoredTrack[]>((resolve,reject)=>{
      const request=db.transaction(LEGACY_TRACKS).objectStore(LEGACY_TRACKS).getAll();
      request.onsuccess=()=>resolve(request.result as StoredTrack[]);
      request.onerror=()=>reject(request.error);
    });
    db.close();
    if(tracks.length)writeMeta(tracks);
    else localStorage.setItem(META_KEY,"[]");
    return tracks;
  }catch{
    try{localStorage.setItem(META_KEY,"[]")}catch{undefined}
    return [];
  }
}

async function getLegacyBlob(id:string):Promise<Blob|undefined>{
  try{
    const db=await openLegacyDB();
    const blob=await new Promise<Blob|undefined>((resolve,reject)=>{
      const request=db.transaction(LEGACY_BLOBS).objectStore(LEGACY_BLOBS).get(id);
      request.onsuccess=()=>resolve(request.result as Blob|undefined);
      request.onerror=()=>reject(request.error);
    });
    db.close();
    return blob;
  }catch{return undefined}
}

export async function saveTrack(track:StoredTrack,blob:Blob){
  await writeOPFS(track.blobId,blob);
  try{
    const current=readMeta().filter(t=>t.id!==track.id);
    writeMeta([...current,track]);
  }catch(error){await deleteOPFS(track.blobId);throw error}
}

export async function listTracks(){
  const local=readMeta();
  try{if(localStorage.getItem(META_KEY)!==null)return local.sort((a,b)=>b.addedAt-a.addedAt)}catch{undefined}
  return (await migrateLegacyMetadata()).sort((a,b)=>b.addedAt-a.addedAt);
}

export async function getBlob(id:string){return (await readOPFS(id))||await getLegacyBlob(id)}

export async function deleteTrack(id:string,blobId:string){
  await deleteOPFS(blobId);
  const current=readMeta().filter(t=>t.id!==id);
  writeMeta(current);
  try{
    const db=await openLegacyDB();
    await new Promise<void>((resolve,reject)=>{
      const tx=db.transaction([LEGACY_TRACKS,LEGACY_BLOBS],"readwrite");
      tx.objectStore(LEGACY_TRACKS).delete(id);tx.objectStore(LEGACY_BLOBS).delete(blobId);
      tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error("Legacy cleanup failed"));
    });
    db.close();
  }catch{undefined}
}
