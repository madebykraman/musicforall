# Music For All — Product & Interface

Music For All is a local-first music player with the interaction grammar of a premium streaming product: persistent navigation, content shelves, artwork-led discovery, a desktop Now Playing rail, a persistent mini-player and an immersive full player.

## Product model

- Local music is first-class and stays in the browser.
- Home is a listening hub, not an editorial manifesto.
- Search has two explicit modes: Your Library and Open Music.
- Open Music is rights-aware and filtered to Public Domain / CC0 results before they can be kept.
- Connected services are clearly marked future adapters and never imply local ownership.
- No account is required.
- No fake catalogue, social feed or algorithmic recommendation claims.

## Information architecture

Desktop:
- Home
- Search
- Your Library
- Recently added
- Liked Songs
- Add local music
- Settings
- Right-side Now Playing surface

Mobile:
- Home
- Search
- Library
- Settings
- Persistent mini-player above navigation

## Home

The populated Home hierarchy is intentionally streaming-like:
1. Greeting and primary Add music action
2. Featured / Continue Listening hero
3. Quick Picks
4. Recently played
5. Recently added
6. Albums
7. Artists
8. All songs

Rows are horizontally scannable where appropriate. The desktop player rail remains available while browsing.

The empty state is a compact first-run import experience rather than a fake content catalogue.

## Library

Songs, Albums and Artists are separate views. Local search, favourites, queue, deletion and direct playback remain available. Song rows are intentionally dense so large personal libraries remain scannable.

## Search / Open Music

The global header search is the primary search control. Search switches between:
- Your Library — local-only search.
- Open Music — Openverse audio discovery restricted in the client to CC0 and Public Domain results.

Open Music separates discovery from keeping. A Keep action fetches the recording into local storage. Source attribution remains visible. Openverse itself notes that it does not verify license accuracy, so the UI does not describe external works as universally rights-cleared; it surfaces the returned license and source for user verification.

## Playback

- Play / pause
- Previous / next
- Seek
- Queue
- Shuffle
- Repeat off / all / one
- Favourites
- Recently played
- Media Session controls
- Responsive mini-player
- Immersive full-screen player
- Real playback progress

The player uses artwork as the primary visual surface and a restrained ambient background rather than decorative visualizers.

## Storage / PWA

Audio bytes are stored in OPFS with metadata in localStorage. Legacy IndexedDB data is still readable for migration compatibility.

The application is an installable PWA. The service worker caches the app shell while deliberately excluding audio and external API requests from the cache path.

## Visual system

Dark graphite surfaces, warm off-white controls, restrained amber accent, subtle violet/mint artwork fallbacks, dense shelves and high-contrast Sora typography. Motion is used for navigation, artwork entry, hover states, queue presentation, progress and loading feedback.

The design borrows interaction patterns from premium streaming products without using their branding, assets or catalogue data.
