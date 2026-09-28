# Museflix

A local-first music player for people who already own their music.

Museflix gives personal audio a premium streaming-style interface without requiring an account or pretending local files are part of a commercial catalogue.

## Product

- **Home** — featured listening state, Quick Picks, Recently Played, Recently Added, Albums, Artists and Songs.
- **Search** — local library search plus an explicit Public Domain / CC0 Open Music workflow.
- **Your Library** — songs, albums, artists, favourites, queue and library management.
- **Settings** — storage, PWA installation, future connected-service adapters and product information.

The interface is built around the ObsidianUI design language: near-black surfaces, restrained borders, editorial typography, tactile controls, subtle motion and a dedicated Now Playing surface. Adapted ObsidianUI source patterns are used under its MIT license.

## Local playback

Imported audio is stored in the browser's Origin Private File System (OPFS), with metadata in localStorage. Legacy IndexedDB libraries can be recovered.

Playback includes:
- persistent local playback
- play / pause / previous / next
- seek with real-time progress
- queue
- shuffle
- repeat off / all / one
- favourites
- recently played
- Media Session controls
- responsive mini-player
- immersive full-screen player
- individual track deletion
- complete library deletion
- animated import/loading feedback

## Open Music

Open Music uses the Openverse audio API for discovery. The client requests CC0 and Public Domain results and displays the returned license/provider/source information. A **Keep** action downloads a result into the local library; discovery itself does not modify the library.

Openverse's documentation states that it aggregates openly licensed media but does not make claims about the accuracy of individual license information, so users should verify the source/license before relying on a work.

## Connected services

Settings contains clearly separated future adapter surfaces for:
- Apple Music
- Spotify
- YouTube Music
- YouTube

These are not implemented authentication or catalogue integrations yet and never imply local ownership.

## PWA

Museflix is installable as a web app. The service worker caches the application shell while audio files and external API requests remain outside the shell cache.

On iPhone Safari, use Share → Add to Home Screen → Open as Web App.

## Stack

Vite · React · TypeScript · OPFS · localStorage · HTML Audio · Media Session API · Openverse API

## License

MIT
