# Music For All

A local-first music player for people who already own their music.

Music For All keeps imported audio on the device and gives it a premium streaming-style interface without requiring an account or pretending local files are a streaming catalogue.

## Product

- **Home** — hero listening state, Quick Picks, recent music, albums, artists and dense song shelves.
- **Search** — searches the local library only.
- **Your Library** — songs, albums, artists, favourites, queue and destructive library controls.
- **Settings** — local storage, connected-service adapters and the separate open-music workflow.

The interface is intentionally inspired by the interaction grammar of premium streaming products: persistent navigation, horizontal shelves, artwork-led cards, a dedicated desktop player, a persistent mini-player and an immersive full-screen player. It does not use Spotify or Netflix branding, assets or catalogue data.

## Local playback

Imported audio is stored in Origin Private File System (OPFS), with metadata in localStorage. Legacy IndexedDB libraries can be recovered.

Supported browser audio formats depend on the browser's native decoder.

Playback includes:
- persistent local playback
- play / pause / previous / next
- seek
- queue
- shuffle
- repeat off / all / one
- favourites
- recently played
- Media Session controls
- responsive desktop and mobile player surfaces
- individual track deletion
- complete library deletion
- animated import/loading feedback

## Connected services

Settings contains clearly separated connector surfaces for:
- Apple Music
- Spotify
- YouTube Music
- YouTube

These are adapter entry points only until their respective authentication/API integrations are implemented. They never imply that connected catalogue content is locally owned or downloadable.

## Open music

Open music is intentionally isolated from Home, Search and Your Library. The rights-aware workflow remains available only from Settings, where Public Domain and CC0 are explicitly distinguished from the user's local collection.

## Design

The visual system uses Onest as the primary grotesque typeface, a dark graphite base, restrained violet/amber/mint gradients, dense content shelves, responsive motion, elevated artwork cards and an immersive player.

The design is deliberately not a generic dashboard, editorial landing page or translucent-glass clone.

## Stack

Vite · React · TypeScript · OPFS · localStorage · HTML Audio · Media Session API

## License

MIT
