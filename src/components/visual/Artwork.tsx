import type {CSSProperties} from "react";
import type {StoredTrack} from "../../types";
const palettes=[["#4c0d3f","#9b35ff"],["#09245c","#19a8ff"],["#34115e","#f22e74"],["#0b536b","#2be0dc"],["#6b2415","#ffb72d"],["#15112d","#8d70ff"],["#211d31","#dc77a4"],["#302016","#ed9b5b"]];
export function Artwork({track,size="md",index=0}:{track?:Partial<StoredTrack>|null;size?:"sm"|"md"|"lg"|"hero";index?:number}){
 const p=palettes[index%palettes.length];
 const s=((track?.title||"")+" "+(track?.album||"")).toLowerCase();
 const cover=s.includes("starboy")?"cover-starboy":s.includes("utopia")?"cover-utopia":s.includes("midnight")?"cover-midnight":s.includes("harry")?"cover-harry":s.includes("sos")?"cover-sos":s.includes("call me")?"cover-callme":"";
 return <div className={"muse-artwork artwork-"+size+" "+cover} style={{"--a":p[0],"--b":p[1]} as CSSProperties}>
  {track?.artworkUrl?<img src={track.artworkUrl} alt=""/>:<><div className="art-glow"/><div className="cover-copy"><span>{track?.title?.slice(0,1)||"M"}</span><small>{track?.album||"MUSEFLIX"}</small></div></>}
 </div>;
}