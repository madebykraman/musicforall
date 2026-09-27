import SwiftUI

struct DiscoverView: View {
    @Environment(PlayerStore.self) private var player

    var openTracks: [Track] {
        player.library.filter { $0.source == .open }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 26) {
                    VStack(alignment: .leading, spacing: 7) {
                        Text("Open music").font(.system(size: 34, weight: .bold, design: .rounded))
                        Text("Music you can actually keep.").font(.subheadline).foregroundStyle(MFATheme.secondary)
                    }

                    VStack(alignment: .leading, spacing: 12) {
                        Text("LEGALLY CLEAR").font(.caption.weight(.bold)).tracking(1.3).foregroundStyle(MFATheme.secondary)
                        Text("Music from open catalogues, with the licence shown before you download.")
                            .font(.title3.weight(.medium))
                            .fixedSize(horizontal: false, vertical: true)
                    }

                    ForEach(openTracks) { track in OpenTrackCard(track: track) }

                    Text("The catalogue is intentionally conservative. If a source cannot tell us what rights the recording carries, we don't present it as free.")
                        .font(.footnote).foregroundStyle(MFATheme.secondary)
                }
                .padding(20).padding(.bottom, 140)
            }
            .background(MFATheme.canvas.ignoresSafeArea())
            .toolbar(.hidden, for: .navigationBar)
        }
    }
}

struct OpenTrackCard: View {
    @Environment(PlayerStore.self) private var player
    let track: Track

    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            HStack(spacing: 14) {
                Artwork(seed: track.colourSeed, cornerRadius: 14).frame(width: 72, height: 72)
                VStack(alignment: .leading, spacing: 4) {
                    Text(track.title).font(.headline)
                    Text(track.artist).font(.subheadline).foregroundStyle(MFATheme.secondary)
                    Text(track.license?.label ?? "Licence unknown").font(.caption.weight(.semibold)).foregroundStyle(MFATheme.accent)
                }
                Spacer()
            }

            HStack {
                Button("Play") { player.play(track) }.buttonStyle(.borderedProminent).tint(MFATheme.ink)
                Button { } label: { Label("Download", systemImage: "arrow.down") }.buttonStyle(.bordered)
            }
        }
        .padding(16)
        .background(.white.opacity(0.72), in: RoundedRectangle(cornerRadius: 22, style: .continuous))
    }
}
