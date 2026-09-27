# Music For All — Design System

## Reframe

Music For All is a responsive local-first web app. The product is not a streaming clone. The library is the product: the user brings music in, keeps it on the device and controls how it is organized and played.

## Visual thesis

The new interface is deliberately flat, editorial and utility-first.

The previous build experimented with Liquid Glass and translucent control surfaces. That direction is now retired completely. It made the interface look more like a visual effect than a music tool and became especially noisy on mobile.

The replacement system uses:
- opaque surfaces
- warm paper-like neutrals
- one restrained accent
- thin structural rules
- square or lightly rounded controls
- compact information typography
- generous but controlled spacing
- artwork as the primary source of colour

There is no glass layer in the design.

## Mobile composition

The screenshots exposed the important hierarchy:

1. compact brand/header
2. page title and task
3. library controls
4. music rows
5. player dock
6. primary navigation

The bottom navigation is now an opaque full-width utility bar rather than a floating glass capsule. The mini-player sits immediately above it as a flat row. This keeps the two persistent controls visually related without turning the whole app into a stack of floating cards.

## Content layer

Music catalogue content stays visually flat.

Rows use borders and alignment to create grouping. Artwork is square and quiet. Titles get the strongest text weight; artist and album metadata recede. Provenance labels are intentionally small.

Albums and artists use simple grids instead of decorative cards.

## Player

The player follows a strict hierarchy:

1. artwork
2. track identity
3. progress
4. primary playback
5. shuffle/repeat
6. queue
7. source/favourite metadata

The now-playing surface is opaque. The backdrop is a simple dimming layer, not a blur or material effect.

The mini-player is a functional dock, not a decorative floating object.

## Interaction

The product now has:
- persistent favourites
- recent-play markers
- queue
- shuffle
- repeat
- seek
- library sorting
- integrated download/remove actions
- Media Session controls

All persistent state is deliberately small. Audio is never serialized into localStorage or IndexedDB metadata.

## Storage architecture

Audio bytes are stored in Origin Private File System (OPFS). Small track metadata, favourites and recent-play markers use localStorage. A legacy IndexedDB reader remains only as a migration/compatibility path for older Music For All builds.

The import path no longer runs a heavyweight browser tag parser. It reads duration through the native audio element and derives a useful title/artist from common filename patterns. This is a stability-first decision: metadata enrichment can be added later as an explicit, user-invoked operation rather than being on the critical import path.

## Reliability principles

- never put audio Blobs into the metadata store
- never parse album artwork during import
- import one file at a time
- do not make service-worker caching a prerequisite for the player
- keep metadata operations small
- fail a single import without replacing the existing library
- revoke temporary playback object URLs
- expose storage usage where the browser provides it

## Information architecture

**Library** — owned/imported music.

**Discover** — open music and rights-aware search.

**Downloads** — files actually stored offline.

**Settings** — installation, storage and future connectors.

## Rights model

The default downloadable open tier is intentionally strict:

- Public Domain
- CC0

Other Creative Commons licences can be discoverable later, but they must carry their attribution/use requirements and must not be represented as unrestricted.

## Connected services

Apple Music and Spotify are adapters, not dependencies. A failure in a connected service must never compromise the local library or player.

## Case-study standard

Every feature must answer at least one:

- Does it make music easier to keep?
- Does it make music easier to understand?
- Does it make the interface calmer?

If not, it does not belong in v1.
