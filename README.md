# Music For All

A design-first, local-first music player for the web.

Music For All is now a Progressive Web App rather than an App Store-only iOS project. Apple currently charges US$99/year for the Developer Program; a free Apple Account can build and test, but App Store distribution requires membership.

The web route removes that recurring distribution cost. GitHub Pages supports static sites from public repositories on GitHub Free, and Safari on iPhone can add a website to the Home Screen as a web app.

## Product thesis

Music For All should feel like a beautiful personal music shelf, not “Spotify but free”.

- **Your Music** — audio you import and keep locally.
- **Open Music** — openly licensed catalogue discovery; default downloads are restricted to Public Domain and CC0 records.
- **Connected Music** — optional Apple Music / Spotify integrations, kept separate from owned files.

Openverse is a discovery layer, not a blanket rights guarantee. Its documentation explicitly says licence information should be verified per work, so Music For All intentionally narrows the default downloadable set.

## Current stack

Vite + React + TypeScript.

- IndexedDB for local audio and library metadata.
- HTML audio for playback.
- Service worker + Web App Manifest for installability/offline shell.
- GitHub Pages as the first public deployment target.
- Vercel remains an optional future host if a server-side connector is needed.

## Connected services

Apple Music can play through MusicKit on the Web, but Apple requires developer-token infrastructure for MusicKit integrations. Spotify supports browser authorization through OAuth 2.0 with PKCE; its 2026 developer changes also mean the connector needs explicit configuration and testing. These services are therefore adapters, not dependencies of the core player.

## Design principles

- editorial, quiet, tactile
- familiar interaction patterns
- artwork as the emotional centre
- provenance visible but subordinate
- no social feed
- no fake equalizers
- no subscription bait
- no catalogue content masquerading as owned audio
- progressive enhancement over feature accumulation

## Roadmap

1. Local import, persistence, playback, PWA install.
2. Rights-aware open catalogue and verified download flow.
3. Queue, playlists, Media Session and deeper offline behaviour.
4. Optional connected-service adapters.
5. Accessibility, performance, responsive polish and case-study documentation.

## License

MIT.
