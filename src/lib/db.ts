import type {StoredTrack} from "../types";

const DB_NAME="music-for-all";
const DB_VERSION=2;
const TRACKS="tracks";
const LEGACY_BLOBS="blobs";

function openDB():Promise<IDBDatabase>{
  return new Promise((resolve,reject)=>{
    const r=indexedDB.open(DB_NAME,DB_VERSION);
    r.onupgradeneeded=()=>{
      const db=r.result;
      if(!db.objectStoreNames.contains(TRACKS))db.createObjectStore(TRACKS,{keyPath:"id"});
      if(!db.objectStoreNames.contains(LEGACY_BLOBS))db.createObjectStore(LEGACY_BLOBS);
    };
    r.onsuccess=()=>resolve(r.result);
    r.onerror=()=>reject(r.error);
  });
}

async function getOPFSRoot():Promise<FileSystemDirectoryHandle|null>{
  try{
    if(!("storage" in navigator)||!("getDirectory" in navigator.storage))return null;
    return await navigator.storage.getDirectory();
  }catch{return null}
}

async function writeOPFS(id:string,blob:Blob){
  const root=await getOPFSRoot();
  if(!root)throw new Error("OPFS unavailable");
  const file=await root.getFileHandle("audio-"+id,{create:true});
  const writable=await file.createWritable();
  try{await writable.write(blob);await writable.close()}catch(error){try{await writable.abort()}catch{undefined}throw error}
}

async function readOPFS(id:string):Promise<Blob|undefined>{
  const root=await getOPFSRoot();
  if(!root)return undefined;
  try{
    const file=await root.getFileHandle("audio-"+id);
    return await file.getFile();
  }catch{return undefined}
}

async function deleteOPFS(id:string){
  const root=await getOPFSRoot();
  if(!root)return;
  try{await root.removeEntry("audio-"+id)}catch{undefined}
}

async function putTrack(track:StoredTrack){
  const db=await openDB();
  await new Promise<void>((resolve,reject)=>{
    const tx=db.transaction(TRACKS,"readwrite");
    tx.objectStore(TRACKS).put(track);
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error);
    tx.onabort=()=>reject(tx.error||new Error("IndexedDB transaction aborted"));
  });
  db.close();
}

export async function saveTrack(track:StoredTrack,blob:Blob){
  try{
    await writeOPFS(track.blobId,blob);
    try{await putTrack(track)}catch(error){await deleteOPFS(track.blobId);throw error}
    return;
  }catch(error){
    const root=await getOPFSRoot();
    if(root)throw error;
    const db=await openDB();
    await new Promise<void>((resolve,reject)=>{
      const tx=db.transaction([TRACKS,LEGACY_BLOBS],"readwrite");
      tx.objectStore(TRACKS).put(track);
      tx.objectStore(LEGACY_BLOBS).put(blob,track.blobId);
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error);
      tx.onabort=()=>reject(tx.error||new Error("IndexedDB transaction aborted"));
    });
    db.close();
  }
}

export async function listTracks():Promise<StoredTrack[]>{
  const db=await openDB();
  const out=await new Promise<StoredTrack[]>((resolve,reject)=>{
    const r=db.transaction(TRACKS).objectStore(TRACKS).getAll();
    r.onsuccess=()=>resolve(r.result as StoredTrack[]);
    r.onerror=()=>reject(r.error);
  });
  db.close();
  return out.sort((a,b)=>b.addedAt-a.addedAt);
}

async function getLegacyBlob(id:string):Promise<Blob|undefined>{
  const db=await openDB();
  const out=await new Promise<Blob|undefined>((resolve,reject)=>{
    const r=db.transaction(LEGACY_BLOBS).objectStore(LEGACY_BLOBS).get(id);
    r.onsuccess=()=>resolve(r.result as Blob|undefined);
    r.onerror=()=>reject(r.error);
  });
  db.close();
  return out;
}

export async function getBlob(id:string){
  return (await readOPFS(id))||await getLegacyBlob(id);
}

export async function deleteTrack(id:string,blobId:string){
  await deleteOPFS(blobId);
  const db=await openDB();
  await new Promise<void>((resolve,reject)=>{
    const tx=db.transaction([TRACKS,LEGACY_BLOBS],"readwrite");
    tx.objectStore(TRACKS).delete(id);
    tx.objectStore(LEGACY_BLOBS).delete(blobId);
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error);
    tx.onabort=()=>reject(tx.error||new Error("IndexedDB transaction aborted"));
  });
  db.close();
}
