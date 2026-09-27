# Music For All

A design-first, local-first music shelf for the web.

Music For All is a responsive web app rather than an App Store-only iOS project. The core experience is deliberately account-free: import music you already have, keep it on the device, and play it without sending the audio to Music For All.

## Product thesis

Music For All should feel like a beautiful personal music shelf, not “Spotify but free”.

- **Your Music** — audio you import and keep locally.
- **Open Music** — openly licensed catalogue discovery; default downloads are restricted to Public Domain and CC0 records.
- **Connected Music** — optional Apple Music / Spotify integrations, kept separate from owned files.

Openverse is a discovery layer, not a blanket rights guarantee. Licence information is checked per work, so Music For All intentionally narrows the default downloadable set.

## Current stack

Vite + React + TypeScript.

- Origin Private File System (OPFS) for local audio bytes.
- localStorage for small library metadata, favourites and recent-play markers.
- HTML audio for playback.
- Web App Manifest for install metadata.
- No service-worker dependency for the core player.
- No browser-side tag parser during import; filenames and audio metadata are used first for a fast, low-memory import path.

The storage split is intentional. Audio files are large and belong in file storage; catalogue metadata is small and should not require IndexedDB transactions. A legacy IndexedDB migration remains only to recover libraries created by older builds.

## Reliability model

Import is sequential. Each file is written to OPFS before its small metadata record is committed. If a metadata write fails, the newly written audio file is removed. A failed import does not replace the existing library.

The app also retires the old service-worker cache and unregisters existing registrations on load. The player does not depend on a cached application shell.

This is especially deliberate for iPhone/iPad browsers. WebKit has documented IndexedDB connection-loss and page-reload issues, while OPFS is a first-class origin-private file storage API on Safari. The application therefore minimizes new IndexedDB usage rather than making it the centre of the product.

## Interface direction

The interface is flat, editorial and content-first.

- Music content is the visual centre.
- Navigation and controls are simple functional surfaces.
- No Liquid Glass.
- No backdrop-filter.
- No ambient blur fields.
- No translucent floating navigation.
- No decorative equalizers or audio visualisation.
- Album artwork supplies colour; layout, borders and typography establish hierarchy.
- Mobile navigation is a fixed, opaque utility bar.
- The player is an opaque sheet with explicit controls and a visible queue.

## Information architecture

**Library** — owned/imported music.

**Discover** — open music and rights-aware search.

**Downloads** — files actually stored offline.

**Settings** — install guidance, storage information and future connectors.

## Player features

- local playback
- queue
- previous/next
- shuffle
- repeat
- seek
- favourites
- Media Session integration
- persistent local library metadata
- storage usage reporting where supported

## Connected services

Apple Music and Spotify remain adapters, not dependencies of the local player. Their authentication and playback requirements should never be allowed to destabilize the local library.

## Roadmap

1. Local import, persistence and playback.
2. Rights-aware open catalogue and verified download flow.
3. Queue, favourites, sorting and deeper offline behaviour.
4. Optional connected-service adapters.
5. Accessibility, performance and case-study documentation.

## License

MIT.
