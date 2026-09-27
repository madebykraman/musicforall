import SwiftUI

struct RootView: View {
    @Environment(PlayerStore.self) private var player
    @State private var showingPlayer = false

    var body: some View {
        ZStack(alignment: .bottom) {
            TabView(selection: Bindable(player).selectedTab) {
                LibraryView().tabItem { Label("Library", systemImage: "square.stack") }.tag(AppTab.library)
                DiscoverView().tabItem { Label("Discover", systemImage: "safari") }.tag(AppTab.discover)
                DownloadsView().tabItem { Label("Downloads", systemImage: "arrow.down.circle") }.tag(AppTab.downloads)
                SettingsView().tabItem { Label("Settings", systemImage: "slider.horizontal.3") }.tag(AppTab.settings)
            }
            .tint(MFATheme.ink)

            if player.currentTrack != nil {
                MiniPlayer { showingPlayer = true }
                    .padding(.horizontal, 12)
                    .padding(.bottom, 58)
            }
        }
        .sheet(isPresented: $showingPlayer) {
            NowPlayingView()
                .presentationDetents([.large])
                .presentationDragIndicator(.visible)
        }
        .preferredColorScheme(.light)
    }
}

struct MiniPlayer: View {
    @Environment(PlayerStore.self) private var player
    let open: () -> Void

    var body: some View {
        Button(action: open) {
            HStack(spacing: 12) {
                if let track = player.currentTrack {
                    Artwork(seed: track.colourSeed, cornerRadius: 10).frame(width: 44, height: 44)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(track.title).font(.subheadline.weight(.semibold)).foregroundStyle(MFATheme.ink).lineLimit(1)
                        Text(track.artist).font(.caption).foregroundStyle(MFATheme.secondary).lineLimit(1)
                    }
                    Spacer()
                    Button { player.togglePlayback() } label: {
                        Image(systemName: player.isPlaying ? "pause.fill" : "play.fill").frame(width: 38, height: 38)
                    }
                    .buttonStyle(.plain)
                    Image(systemName: "chevron.up").font(.caption.weight(.bold)).foregroundStyle(MFATheme.secondary)
                }
            }
            .padding(7)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 17, style: .continuous))
            .overlay { RoundedRectangle(cornerRadius: 17, style: .continuous).stroke(.black.opacity(0.06), lineWidth: 0.7) }
        }
        .buttonStyle(.plain)
    }
}
