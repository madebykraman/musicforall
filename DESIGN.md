# Music For All — Design System

## Reframe

The original implementation targeted a native iOS app. The distribution constraint changed the product vehicle: App Store distribution requires the paid Apple Developer Program. The new product is a responsive PWA that can live on an iPhone Home Screen without App Store publication.

## Visual thesis

Warm editorial canvas. Near-black typography. One restrained burnt accent. Oversized artwork. Native-feeling controls. Sparse geometry. Generous vertical rhythm.

Recognition comes from restraint rather than novelty through decoration.

Avoid:

- Spotify imitation
- giant neon gradients
- faux-neumorphism
- decorative equalizers
- permanent black UI
- excessive glassmorphism
- social/feed mechanics
- AI-music visual tropes

## Information architecture

**Library** — owned/imported music.

**Discover** — open music and rights-aware search.

**Downloads** — files actually stored offline.

**Settings** — installation, storage and future connectors.

The distinction between *available to play* and *owned/stored locally* is foundational.

## Player hierarchy

1. artwork
2. track identity
3. progress
4. primary playback
5. queue/output
6. secondary metadata

The player should feel like a quiet room around the music.

## Rights model

The default downloadable open tier is intentionally strict:

- Public Domain
- CC0

Other Creative Commons licences can be discoverable later, but they must carry their attribution/use requirements and must not be represented as unrestricted. Openverse documents CC0 and PDM as distinct licence slugs and explicitly warns that it cannot guarantee source licence accuracy.

## Connected services

Apple Music: web playback is available through MusicKit on the Web, subject to Apple's developer-token/authentication requirements.

Spotify: browser integrations should use OAuth PKCE; current 2026 developer changes make this a separately configured connector rather than something the core player should depend upon.

## Case-study standard

Every feature must answer at least one:

- Does it make music easier to keep?
- Does it make music easier to understand?
- Does it make the interface calmer?

If not, it does not belong in v1.
