# Music For All — Product & Interface

## Reset

This version intentionally does not preserve the previous Music For All interface.

The earlier prototype treated the product as a four-tab dashboard: Library, Discover, Downloads and Settings. That made the first screen feel like a utility console and forced storage implementation details into the primary navigation.

The new product model is:

**Home** — the personal listening room and first-run destination.

**Collection** — everything the user has kept, with songs/albums/artists and favourites.

**Explore** — the rights-aware open catalogue.

**Settings** — storage, installation and product information.

Offline storage is a property of the collection, not a destination.

## Product thesis

Music For All is a private music shelf for files a person already has.

The product should feel closer to opening a carefully kept record collection than opening a streaming service.

There is:
- no social feed
- no recommendation wall
- no account requirement
- no fake catalogue
- no algorithmic home feed
- no attempt to disguise local files as a streaming service

Open music is intentionally separate. Search can be broad, while the default keepable tier remains Public Domain and CC0.

## Research-derived decisions

Doppler demonstrates the value of making a local library first-class: local playback, recently added content, search, queue and album-oriented browsing are core rather than secondary features. citeturn1search4

Marvis demonstrates the usefulness of sections, grouping and sorting for people with substantial libraries, but also shows how configurability can become a product in itself. Music For All therefore exposes only the high-value organization primitives in v1: songs, albums, artists, favourites and sorting. citeturn1search0turn1search1

Modus's dual-mode concept is useful for the browse/listen transition: browsing should optimize scanning while now playing should become an immersive listening environment. Music For All adopts that principle without copying its visual treatment. citeturn1search3

Apple's current guidance emphasizes clear hierarchy and separation between content and navigation. Music For All therefore uses a deliberately custom content identity while keeping navigation simple and predictable. citeturn0search5turn0search15

## Visual language

The new visual system is an editorial archive rather than a generic “music app” dashboard.

Palette:
- warm paper background
- midnight navy listening environment
- electric blue as the primary interaction accent
- restrained coral for saved/favourite states
- charcoal typography
- thin structural rules

Typography:
- system sans for controls, metadata and utility
- serif display typography for major editorial statements and listening identity

Composition:
- large typographic statements
- asymmetrical editorial grids
- album artwork as content, not decoration
- thin rules instead of containers everywhere
- deliberate empty space
- numbered sections as an archival motif

There is no Liquid Glass, glassmorphism, backdrop blur, frosted navigation, translucent player, or floating capsule system.

## First-run experience

The first visit is an onboarding experience, not an empty library.

The onboarding explains three things:
1. Local first — imported audio stays on the device.
2. Open when useful — Public Domain and CC0 audio can be discovered separately.
3. No account — the core product requires no login.

The primary action is immediately importing music. A secondary action lets the person look around without importing anything.

Once music exists, onboarding disappears and Home becomes the listening room.

## Home

Home answers one question: “What can I listen to right now?”

Its hierarchy is:
1. product statement
2. continue listening
3. recently added
4. albums
5. import fallback when empty

This avoids the previous dashboard feeling. The screen is editorial and content-led.

## Collection

Collection answers: “What do I own here?”

The collection supports:
- all music
- favourites
- songs
- albums
- artists
- recently added/title/artist sorting
- local search
- direct playback
- direct favourite/remove actions

The row is intentionally dense. Album art, title and artist carry most of the information. Secondary metadata recedes.

## Explore

Explore answers: “What can I discover and legally keep?”

It makes the rights boundary explicit before the search results.

The UI distinguishes:
- Listen
- Keep

Searching does not mutate the local collection.

## Player

Now Playing is a different visual world.

Browse uses warm paper and blue accents. The player uses midnight navy and high-contrast artwork.

The player hierarchy is:
1. artwork
2. title
3. artist / album
4. progress
5. playback
6. shuffle / repeat
7. queue

This is a listening environment, not another catalogue page.

## Persistent mini-player

The mini-player is a utility bridge between browse and listening. It does not become a floating design object.

It exposes:
- artwork
- title
- artist
- play/pause
- queue
- progress

The full player remains one tap away.

## Storage

Audio bytes live in OPFS. Small metadata lives separately. IndexedDB is retained only for compatibility with older builds.

The import path is sequential and deliberately lightweight:
- native duration probing
- filename-derived metadata
- one file written at a time
- no embedded artwork extraction during import
- cleanup on failed writes

The storage architecture is not allowed to dictate the product's visual hierarchy.

## Non-goals

For this version:
- no social features
- no recommendation engine
- no account system
- no streaming-service imitation
- no decorative audio visualizers
- no settings maze
- no dashboard cards for the sake of having cards

The product earns complexity only when it makes keeping, finding or listening to music materially better.
