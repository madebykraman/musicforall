export type SourceKind="local"|"open"|"apple-music"|"spotify";
export type LicenseKind="public-domain"|"cc0"|"attribution"|"other";
export interface Track{id:string;title:string;artist:string;album:string;duration?:number;source:SourceKind;license?:LicenseKind;licenseUrl?:string;sourceUrl?:string;audioUrl?:string;artworkUrl?:string;blobId?:string;creatorUrl?:string;provider?:string}
export interface StoredTrack extends Track{blobId:string;fileName?:string;fileSize?:number;addedAt:number;playCount?:number}
export type Tab="home"|"library"|"explore"|"settings";