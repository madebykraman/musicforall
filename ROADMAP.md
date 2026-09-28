# Museflix — 1.0 Roadmap & Audit

Last audited: 2026-09-29

This checklist reconciles the product brief/design documentation, the supplied Museflix concept board, the implementation that exists in `main`, and the mobile screenshots from the current build.

## Product rules

- [x] Local-first music player.
- [x] No fake catalogue presented as real user music.
- [x] No account required for local playback.
- [x] Optional local display name.
- [x] Single dark visual system; no appearance selector.
- [x] Empty states stay empty until the user imports/discovers something.
- [ ] Connected-service OAuth must be real before a service is shown as connected.

## First-run onboarding

- [x] Intro/showcase layer before the main product.
- [x] Optional name field.
- [x] Playful anonymous-name copy.
- [x] Import music from onboarding.
- [x] Skip setup.
- [x] Existing local libraries bypass first-run catalogue onboarding.
- [ ] Real service connection flow for Spotify / YouTube Music / Apple Music / YouTube.
- [ ] Persist a richer profile/preferences model instead of scattered localStorage keys.

## Home

- [x] Desktop and mobile compositions.
- [x] Real imported tracks drive artwork and shelves.
- [x] Recently added.
- [x] Recently played.
- [x] Liked songs.
- [x] Continue listening / current track.
- [x] Empty-library state.
- [x] Add-music CTA.
- [x] No demo tracks.
- [ ] Album/artist/genre/folder detail navigation.
- [ ] Better metadata ingestion so album/artist/genre are read from audio tags rather than inferred mainly from filenames.
- [ ] True artwork priority: embedded artwork -> trusted metadata provider -> generated fallback.

## Library

- [x] Songs.
- [x] Albums.
- [x] Artists.
- [x] Favourites.
- [x] Mobile Playlists tab.
- [x] Mobile Folders surface.
- [x] Delete individual tracks.
- [x] Clear library.
- [ ] Real folder browser / folder-level navigation.
- [ ] Folder import using directory selection where the browser supports it.
- [ ] Multi-select / batch actions.
- [ ] Sort and filter controls.
- [ ] Track metadata editing.

## Search

- [x] Global search.
- [x] Local library search.
- [x] Recent searches.
- [x] Open Music discovery.
- [x] Openverse audio workflow.
- [x] Keep/download into local storage.
- [ ] Better source/license verification UX.
- [ ] Search across metadata fields after proper tag ingestion.

## Playback / Now Playing

- [x] HTML audio playback.
- [x] Play / pause.
- [x] Previous / next.
- [x] Seek.
- [x] Real progress.
- [x] Queue.
- [x] Shuffle.
- [x] Repeat off / all / one.
- [x] Favourites.
- [x] Recently played.
- [x] Sleep timer.
- [x] Media Session metadata and transport actions.
- [x] Persistent mobile mini-player.
- [x] Immersive full player.
- [x] Lyrics / Queue / Details tabs.
- [ ] Real lyrics provider/integration.
- [ ] Queue editing/reordering/removal.
- [ ] Persist playback position across reloads.
- [ ] Crossfade / gapless playback.

## Equalizer

- [x] Six bands: 60 / 250 / 1K / 4K / 8K / 16K.
- [x] Presets.
- [x] Bass boost.
- [x] Virtualizer.
- [x] Loudness.
- [x] Persistent EQ state.
- [x] Web Audio processing path.
- [ ] Device QA on iOS Safari.
- [ ] Device QA on Android Chrome.
- [ ] Explicit bypass/engine status in UI.
- [ ] Reset-to-flat control.

## Playlists

- [x] Create.
- [x] Delete.
- [x] Add current track.
- [x] Persistent local storage.
- [ ] Rename.
- [ ] Remove track.
- [ ] Reorder.
- [ ] Add selected tracks.
- [ ] Playlist detail screen matching the supplied concept.

## Settings

- [x] Playback settings.
- [x] Autoplay preference.
- [x] Equalizer entry.
- [x] Sleep timer guidance.
- [x] Library/import/storage controls.
- [x] Optional personalisation.
- [x] Connected-service status surface.
- [x] About/privacy information.
- [x] No appearance selector.
- [ ] Download/storage management beyond clear-library.
- [ ] Export/import library metadata.
- [ ] Notification/media-control preferences.

## Supplied concept-board screens

- [x] Splash / onboarding direction.
- [x] Home.
- [x] Songs/library.
- [x] Albums surface.
- [x] Now Playing.
- [x] Lyrics surface.
- [x] Library.
- [x] Search.
- [x] Settings structure.
- [x] Equalizer structure.
- [x] Playlist structure.
- [ ] Folder / File Browser as a real navigable feature.
- [x] Sleep timer functionality.
- [ ] Cross-platform/device management beyond PWA installation.
- [ ] Exact final visual polish against the concept board after functional architecture stabilises.

## UX / visual audit

- [x] Removed personal-name hardcoding.
- [x] Removed fake demo catalogue.
- [x] Empty state is intentional.
- [x] Mobile bottom navigation is integrated with the viewport rather than floating over content.
- [x] Mobile mini-player artwork constrained.
- [x] Library artwork constrained.
- [x] Dark-only product language.
- [x] Search moved out of bottom navigation.
- [ ] Full touch-device regression pass.
- [ ] iOS Safari import-picker regression pass.
- [ ] Android Chrome regression pass.
- [ ] Desktop 1280/1440/1536 layout pass.
- [ ] Accessibility pass: focus, labels, reduced motion, keyboard navigation.
- [ ] Error-state pass for corrupt/unsupported audio and storage quota failures.

## Release gates

### 0.9.x — Release Candidate
- [x] Architecture rewrite.
- [x] Local storage/playback foundation.
- [x] Core player controls.
- [x] Reference-based visual system.
- [x] Mobile navigation.
- [x] Current UX correction pass.

### 0.9.5 — Functional UX lock
- [x] Onboarding.
- [x] No fake catalogue.
- [x] Optional personalisation.
- [x] Real settings surface.
- [x] Integrated mobile navigation.
- [x] Autoplay preference.
- [ ] Finish playlist management.
- [ ] Finish folder/file browser.
- [ ] Finish metadata ingestion.

### 0.9.8 — Device QA
- [ ] iOS Safari.
- [ ] Android Chrome.
- [ ] Desktop Chromium.
- [ ] Desktop Safari.
- [ ] PWA install/relaunch.
- [ ] Media Session.
- [ ] Equalizer audio path.
- [ ] Large-library performance.

### 1.0 — Launch candidate
All 0.9.8 gates green, production deployment verified, and no critical UX/functionality regressions against the supplied concept board.

## Explicit non-goals for 1.0

- No fabricated streaming catalogue.
- No fake recommendation engine.
- No pretending a connected service is authenticated when OAuth is not configured.
- No light/AMOLED theme selector.
- No account requirement for local playback.
