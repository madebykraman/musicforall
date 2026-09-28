import type {StoredTrack} from "../types";

const META_KEY="music-for-all:tracks:v2";
const LEGACY_DB="music-for-all";
const LEGACY_TRACKS="tracks";
const LEGACY_BLOBS="blobs";

async function getOPFSRoot():Promise<FileSystemDirectoryHandle|null>{try{if(!navigator.storage?.getDirectory)return null;return await navigator.storage.getDirectory()}catch{return null}}
async function writeOPFS(id:string,blob:Blob){const root=await getOPFSRoot();if(!root)return false;try{const file=await root.getFileHandle("audio-"+id,{create:true});const writable=await file.createWritable();await writable.write(blob);await writable.close();return true}catch{return false}}
async function readOPFS(id:string):Promise<Blob|undefined>{const root=await getOPFSRoot();if(!root)return;try{return await(await root.getFileHandle("audio-"+id)).getFile()}catch{return}}
async function deleteOPFS(id:string){const root=await getOPFSRoot();if(!root)return;try{await root.removeEntry("audio-"+id)}catch{}}

function readMeta():StoredTrack[]{try{const raw=localStorage.getItem(META_KEY);if(!raw)return [];const parsed=JSON.parse(raw);return Array.isArray(parsed)?parsed as StoredTrack[]:[]}catch{return []}}
function writeMeta(tracks:StoredTrack[]){localStorage.setItem(META_KEY,JSON.stringify(tracks))}
function openLegacyDB():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{if(!indexedDB){reject(new Error("IndexedDB unavailable"));return}const request=indexedDB.open(LEGACY_DB,2);request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(LEGACY_TRACKS))db.createObjectStore(LEGACY_TRACKS,{keyPath:"id"});if(!db.objectStoreNames.contains(LEGACY_BLOBS))db.createObjectStore(LEGACY_BLOBS)};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error("IndexedDB unavailable"))})}
async function putBlob(id:string,blob:Blob){const db=await openLegacyDB();await new Promise<void>((resolve,reject)=>{const tx=db.transaction(LEGACY_BLOBS,"readwrite");tx.objectStore(LEGACY_BLOBS).put(blob,id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||new Error("Could not save audio"))});db.close()}
async function getLegacyBlob(id:string){try{const db=await openLegacyDB();const blob=await new Promise<Blob|undefined>((resolve,reject)=>{const r=db.transaction(LEGACY_BLOBS).objectStore(LEGACY_BLOBS).get(id);r.onsuccess=()=>resolve(r.result as Blob|undefined);r.onerror=()=>reject(r.error)});db.close();return blob}catch{return}}
async function deleteLegacyBlob(id:string){try{const db=await openLegacyDB();await new Promise<void>((resolve,reject)=>{const tx=db.transaction(LEGACY_BLOBS,"readwrite");tx.objectStore(LEGACY_BLOBS).delete(id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)});db.close()}catch{}}
async function migrateLegacyMetadata(){if(localStorage.getItem(META_KEY)!==null)return readMeta();try{const db=await openLegacyDB();const tracks=await new Promise<StoredTrack[]>((resolve,reject)=>{const r=db.transaction(LEGACY_TRACKS).objectStore(LEGACY_TRACKS).getAll();r.onsuccess=()=>resolve(r.result as StoredTrack[]);r.onerror=()=>reject(r.error)});db.close();writeMeta(tracks);return tracks}catch{try{localStorage.setItem(META_KEY,"[]")}catch{}return []}}

export async function saveTrack(track:StoredTrack,blob:Blob){const storedInOPFS=await writeOPFS(track.blobId,blob);if(!storedInOPFS)await putBlob(track.blobId,blob);try{const current=readMeta().filter(t=>t.id!==track.id);writeMeta([...current,track])}catch(error){if(storedInOPFS)await deleteOPFS(track.blobId);else await deleteLegacyBlob(track.blobId);throw error}}
export async function listTracks(){const local=readMeta();if(localStorage.getItem(META_KEY)!==null)return local.sort((a,b)=>b.addedAt-a.addedAt);return(await migrateLegacyMetadata()).sort((a,b)=>b.addedAt-a.addedAt)}
export async function getBlob(id:string){return(await readOPFS(id))||await getLegacyBlob(id)}
export async function deleteTrack(id:string,blobId:string){await deleteOPFS(blobId);await deleteLegacyBlob(blobId);writeMeta(readMeta().filter(t=>t.id!==id));try{const db=await openLegacyDB();await new Promise<void>((resolve,reject)=>{const tx=db.transaction(LEGACY_TRACKS,"readwrite");tx.objectStore(LEGACY_TRACKS).delete(id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)});db.close()}catch{}}
export async function updateTrackMetadata(id:string,patch:Partial<StoredTrack>){const next=readMeta().map(t=>t.id===id?{...t,...patch}:t);writeMeta(next);return next}
