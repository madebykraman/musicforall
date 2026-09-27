import SwiftUI

struct NowPlayingView: View {
    @Environment(PlayerStore.self) private var player
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ZStack {
            MFATheme.canvas.ignoresSafeArea()

            if let track = player.currentTrack {
                VStack(spacing: 0) {
                    HStack {
                        Button("Done") { dismiss() }
                            .font(.body.weight(.semibold))
                            .foregroundStyle(MFATheme.ink)
                        Spacer()
                        Image(systemName: "ellipsis").font(.body.weight(.bold))
                    }
                    .padding(.bottom, 24)

                    Artwork(seed: track.colourSeed, cornerRadius: 28)
                        .aspectRatio(1, contentMode: .fit)
                        .padding(.horizontal, 20)
                        .shadow(color: .black.opacity(0.08), radius: 24, y: 14)

                    VStack(alignment: .leading, spacing: 5) {
                        Text(track.title).font(.system(size: 28, weight: .bold, design: .rounded))
                        Text(track.artist).font(.title3).foregroundStyle(MFATheme.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.top, 24)

                    VStack(spacing: 7) {
                        Slider(value: Bindable(player).progress, in: 0...1).tint(MFATheme.ink)
                        HStack {
                            Text(format(track.duration * player.progress))
                            Spacer()
                            Text(format(track.duration))
                        }
                        .font(.caption2.monospacedDigit()).foregroundStyle(MFATheme.secondary)
                    }
                    .padding(.top, 24)

                    HStack(spacing: 42) {
                        Button { } label: { Image(systemName: "backward.end.fill") }
                        Button { player.togglePlayback() } label: {
                            Image(systemName: player.isPlaying ? "pause.fill" : "play.fill")
                                .font(.system(size: 26, weight: .bold))
                                .frame(width: 72, height: 72)
                                .background(MFATheme.ink, in: Circle())
                                .foregroundStyle(MFATheme.canvas)
                        }
                        Button { } label: { Image(systemName: "forward.end.fill") }
                    }
                    .font(.title3).foregroundStyle(MFATheme.ink).padding(.top, 24)

                    Spacer()
                }
                .padding(.horizontal, 20)
            } else {
                ContentUnavailableView("Nothing playing", systemImage: "music.note")
            }
        }
    }

    private func format(_ seconds: TimeInterval) -> String {
        let value = Int(seconds)
        return String(format: "%d:%02d", value / 60, value % 60)
    }
}
