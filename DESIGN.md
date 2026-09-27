# Music For All — Design Case Study

## The problem

Music player is an overloaded category. Users already understand play, pause, queue, albums and search. The design opportunity is not to invent another interaction language. It is to remove friction around where music comes from and what the user can do with it.

Central question:

Can one music player make ownership, open culture and paid services feel like one coherent library without lying about what the app controls?

## Competitive reading

Doppler is a strong local-first precedent: offline playback, local storage, metadata editing, search and a restrained library experience. citeturn1search0

Soor is a strong third-party Apple Music precedent: gesture-driven navigation, themes, widgets and library customisation while remaining recognisably iOS. citeturn1search1

Marvis Pro demonstrates how a library can become an exploration interface through sorting, grouping and personalisation. citeturn0search12

Amperfy and Finamp demonstrate the open-source/self-hosted model: users bring their own media and connect to servers such as Subsonic, Ampache and Jellyfin. citeturn0search10turn0search13

VOX and Evermusic demonstrate the demand for source aggregation, but also the danger of feature-surface overload. citeturn1search4turn1search11

## Visual thesis

Avoid faux-neumorphism, excessive glass, giant gradients, decorative equalizers, social-feed patterns, AI music tropes and Spotify imitation.

Use a warm paper-like canvas, near-black typography, one restrained burnt accent, large album art, small provenance labels, sparse rounded geometry, generous vertical rhythm, system typography and SF Symbols.

## Information architecture

Library is the user's collection.

Discover is the open catalogue. Its key interaction is not “free”; it is “what rights come with this recording?”

Downloads represents files actually stored for offline use.

Settings contains sources and playback configuration so integrations do not compete with the user's library.

## Player hierarchy

1. Artwork
2. Track identity
3. Progress
4. Primary playback
5. Queue and output
6. Secondary metadata

The player should feel like a quiet room around the music.

## Legal model

A source is not automatically a licence.

Every open-catalogue item should carry source, recording identifier, creator, recording artist, licence, licence URL, attribution text, download permission, modification permission, commercial-use permission and provenance timestamp.

The app must never convert “Creative Commons” into “free of restrictions”. Free Music Archive's own documentation shows why: CC BY requires attribution and CC BY-NC restricts commercial use. citeturn0search14

## Deliberately absent from v1

Social feed, comments, follower counts, lyrics scraping, piracy-oriented sources, generic “download anything”, forced sign-in, ads, subscription requirements for local playback, and engagement-first autoplay.

## Case-study framing

Build a player that respects music ownership instead of pretending every catalogue is one database.

The visual system is therefore a consequence of the product model, not decoration added after engineering.


## Research signals

Community discussions repeatedly surface the same friction: people want local/offline playback without ads or subscriptions, straightforward transfer from a computer, and a UI that feels better than utilitarian file-player interfaces. A recent iOS discussion specifically described VLC as functional but clunky and highlighted Wi-Fi transfer as an important workflow. citeturn3reddit61

More recent discussions continue to separate the market into two camps: clean local players such as Doppler, and broader cloud/server players such as Evermusic and Flacbox. That is useful evidence for keeping the first release visually focused rather than turning every connector into a navigation destination. citeturn3reddit63turn3reddit65

Third-party Apple Music discussions also show that users value alternative clients specifically for interface quality and library control, while complaints about boxiness, missing queue controls and over-dense layouts remain relevant. citeturn3reddit69

The visual-design side of the research is deliberately treated as inspiration rather than evidence of usability. Current Behance case studies heavily favour dark streaming concepts, oversized artwork, gradients and Spotify-like patterns. citeturn3search0turn3search4turn3search6

Music For All therefore takes a different visual position: light, editorial, native, tactile and quiet.

## Open-source catalogue strategy

Openverse is useful as a discovery layer because it indexes hundreds of millions of openly licensed images and audio works, but its own documentation explicitly warns that it does not verify the licensing status of individual works. citeturn2search0turn2search12

Internet Archive exposes item-level rights and licence metadata through its metadata systems, which makes it technically interesting for a future connector, but item rights must still be evaluated individually. citeturn2search2turn2search6

The product rule is therefore:

**Open discovery can be broad. Download eligibility must be narrow.**

The default one-tap download filter should initially admit only Public Domain and CC0 recordings. Other Creative Commons licences can be surfaced later with explicit licence and attribution UI.
