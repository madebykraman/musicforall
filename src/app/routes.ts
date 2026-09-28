export type Route="home"|"search"|"library"|"playlists"|"albums"|"artists"|"folders"|"settings"|"equalizer"|"sleep"|"cross-platform";
export const routes:{id:Route;label:string;icon:string}[]=[
 {id:"home",label:"Home",icon:"home"},
 {id:"search",label:"Search",icon:"search"},
 {id:"library",label:"Library",icon:"library"}
];