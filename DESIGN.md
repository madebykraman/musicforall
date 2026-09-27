# Music For All — Design System

## Design reset
The original interface was a library/table layout wrapped in increasingly decorative surfaces. That direction is retired.

The current product is designed as a personal listening workspace.

The core screen is not a settings dashboard and not a streaming-service clone. It is a shelf for music: one featured listening state, browsable shelves, then the complete collection.

## Composition

### Desktop
The application has three persistent structural zones:
1. top utility bar — identity, global search and local-storage status
2. narrow navigation rail — Library, Discover, Downloads and Settings
3. content workspace — each destination has its own composition

The Library workspace is ordered:
- library identity and import action
- Continue Listening feature
- Recently Played shelf
- Albums shelf
- complete collection

The player is promoted into a dedicated full-screen listening surface rather than being permanently treated as a modal card.

### Mobile
Mobile is not a scaled-down desktop table.

The composition becomes:
- compact header
- listening feature
- horizontally scrolling music shelves
- compact collection rows
- persistent opaque player dock
- persistent four-item navigation

The player dock is a utility, not a decorative floating material.

## Visual language
The product uses a warm editorial palette:
- warm paper background
- darker paper surfaces
- near-black typography
- thin structural rules
- one restrained burnt accent
- album artwork as the main source of colour

There is deliberately no Liquid Glass.

No backdrop-filter.
No translucent navigation.
No ambient blur.
No floating glass capsules.
No decorative equalizers.
No permanent dark streaming-app chrome.

The interface should look closer to a well-designed music archive or physical record catalogue than a generic SaaS dashboard.

## Library
The library starts with listening context rather than statistics.

“Continue Listening” is the primary visual object when music exists. This gives a single track a meaningful place in the interface without inventing fake recommendations.

Recently played and album shelves are horizontally browsable. The complete collection remains dense and information-rich underneath.

The collection uses artwork, title, artist, album, duration, favourite and removal actions. A row is a functional music object, not a generic data-table row.

## Discover
Discover has its own identity because open music is a different activity from managing owned files.

It is centred on a large search action and a result format that exposes artwork, title, creator, provenance, licence, listen and keep.

The downloadable open tier remains Public Domain and CC0.

## Downloads
Downloads is treated as a local-files view, not another generic library page.

Its hierarchy begins with the storage concept, then the files actually present in the browser.

## Player
The dedicated player follows: artwork → track identity → save/favourite → seek → playback controls → queue.

Shuffle and repeat are secondary controls. Queue is explicit and persistent enough to understand.

The mini player remains available while browsing, but its role is purely transport and navigation into the full player.

## Storage
Audio bytes live in OPFS.

Small metadata lives separately from the audio bytes. The new import path does not run a heavyweight browser tag parser or extract embedded cover art.

IndexedDB remains only as a compatibility path for older Music For All builds.

## Interaction principles
Every interface element should make one of these things easier:
- find music
- understand music
- keep music
- play music
- organize music

Anything that exists primarily to make the interface look “premium” is suspect.

## Mobile acceptance criteria
A mobile build is not accepted until:
- the primary task is understandable without scrolling
- artwork and track identity have clear hierarchy
- navigation never obscures the player
- controls remain comfortably tappable
- long titles do not break the layout
- shelves scroll horizontally without causing page-level horizontal overflow
- the player can be entered and exited without losing playback
- import does not require IndexedDB for new audio files
- a failed import leaves the existing library intact

## Product thesis
Music For All should feel like a beautiful personal music shelf, not “Spotify but free”.