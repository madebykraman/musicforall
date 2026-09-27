# Music For All

A design-first, open-source iOS music player for music you own, music that is legally free to use, and services you already subscribe to.

> Free software. Open music. Your library.

Music For All is intentionally not a startup-shaped product. It is a design case study and a useful piece of software: no ads, no forced account, no engagement tricks, no fake “free music”, and no attempt to replace the services that own the catalogues.

## Product thesis

Most music players make one of two mistakes:

- beautiful streaming-service clones that assume a paid catalogue;
- technically capable local players that feel like file managers.

Music For All sits between those worlds.

Local music is first-class. Open music is discoverable and downloadable when its licence permits it. Connected services remain connected services.

## First principles

1. Player before platform.
2. Familiar, not derivative.
3. Local-first.
4. Legal by construction.
5. No dark-pattern discovery.
6. No account required for local playback.
7. Open source adapters.
8. Design is documented.

## Current design direction

Warm neutral canvas, dense but breathable typography, restrained accent colour, oversized album art, tactile controls, and a persistent mini-player.

Primary navigation:
- Library
- Discover
- Downloads
- Settings

Source labels stay small. A user should know where a track came from without the source becoming louder than the music.

## Sources

Local files are imported through the iOS Files picker and stored in the app sandbox.

The first intended open connector is Musopen. Its catalogue describes recordings as available to the public without copyright restrictions. Other sources will only be added when their individual licensing terms can be represented safely in metadata. citeturn0search2

Creative Commons is not synonymous with “free”. CC BY requires attribution and CC BY-NC restricts commercial use, so the app uses licence-aware source metadata rather than a generic free-download flag. citeturn0search14

Apple Music can be integrated with MusicKit for catalogue search and playback subject to Apple's authorisation and subscription model. Spotify's iOS SDK controls playback through the Spotify app and has platform restrictions. Neither source is treated as downloadable owned audio. citeturn0search1turn0search4

## Build

The repository uses XcodeGen so the Xcode project is generated rather than hand-maintained.

1. Install Xcode 26 or newer.
2. Install XcodeGen.
3. Run xcodegen generate.
4. Open MusicForAll.xcodeproj.
5. Select an iOS simulator or device.
6. Build and run.

The first milestone uses mocked catalogue data so the visual system can be evaluated without network dependencies.

## Roadmap

### M0 — visual prototype
- Design language
- Library shell
- Discover shell
- Mini-player
- Full player
- Source model
- Licence model

### M1 — real local player
- Files importer
- AVFoundation playback engine
- Metadata extraction
- Background audio
- Lock Screen / Control Center metadata
- Queue persistence

### M2 — open music
- Musopen connector
- Licence/provenance presentation
- Download manager
- Offline catalogue cache
- Attribution display where required

### M3 — connected libraries
- MusicKit
- Spotify App Remote
- Jellyfin/Subsonic
- Unified source search
- Source-aware queue

### M4 — product polish
- CarPlay
- Widgets
- Siri/App Intents
- Accessibility audit
- Haptics and motion pass
- App Store packaging

## Distribution reality

The app is free and open source. Apple App Store distribution is not currently free: Apple lists the Developer Program at US$99/year, with regional pricing and possible fee waivers. A free Apple developer account can test apps on personal devices but does not provide App Store distribution. citeturn0search5turn0search7

## License

MIT. See LICENSE.
