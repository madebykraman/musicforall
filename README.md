# Music For All

A private, local-first music shelf for the web.

Music For All is built around a simple idea: bring the music you already have into a place that feels like yours.

No account is required. Imported audio stays on the device. Open music discovery is separate and rights-aware.

## Product

The product has four spaces:

- **Home** — your listening room, continue listening, recent additions and album shelf.
- **Collection** — songs, albums, artists and favourites.
- **Explore** — public-domain and CC0 discovery.
- **Settings** — storage, installation and product information.

Offline files are part of the Collection rather than a separate destination.

## Design

The current interface is a zero-based redesign, not a restyle of the original prototype.

It uses an editorial archive language:
- warm paper content surfaces
- midnight navy player
- electric-blue interaction accent
- serif display typography
- large editorial composition
- thin structural rules
- artwork-led shelves
- dense catalogue rows
- a separate listening environment

There is no Liquid Glass, glassmorphism, backdrop blur, frosted navigation, translucent player or floating capsule system.

The first-run experience is a real onboarding flow explaining local storage, open music and the account-free model before inviting the person to import music.

See DESIGN.md for the product model and UX decisions.

## Storage

Audio files are stored in Origin Private File System (OPFS). Small library metadata is stored separately.

The architecture intentionally avoids putting audio Blobs into IndexedDB. A legacy IndexedDB reader remains only to recover libraries created by older builds.

Import is sequential and lightweight:
- native duration probing
- filename-derived title/artist metadata
- one file written at a time
- no cover-art extraction during import
- cleanup when a write fails

The application does not depend on a service-worker cache for playback.

## Features

- local MP3 / FLAC / M4A / WAV / AIFF import
- persistent local playback
- recently added
- songs / albums / artists
- favourites
- search and sorting
- queue
- shuffle and repeat
- seek
- Media Session compatibility
- rights-aware open catalogue
- Public Domain / CC0 download eligibility
- responsive mobile and desktop UI
- installable web app metadata

## Open catalogue

Openverse is used as a discovery layer.

Music For All narrows the default keepable tier to Public Domain and CC0. Other open licences may require attribution or have additional restrictions, so discovery should never be treated as blanket download permission.

## Connected services

Apple Music and Spotify are future adapters. They remain separate from local ownership and are not required for the core product.

## Stack

Vite · React · TypeScript · OPFS · localStorage · HTML Audio

## License

MIT
