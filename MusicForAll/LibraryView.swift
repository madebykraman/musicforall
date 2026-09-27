import SwiftUI

struct LibraryView: View {
    @Environment(PlayerStore.self) private var player
    @State private var query = ""

    private var filtered: [Track] {
        guard !query.isEmpty else { return player.library }
        return player.library.filter {
            $0.title.localizedCaseInsensitiveContains(query) ||
            $0.artist.localizedCaseInsensitiveContains(query) ||
            $0.album.localizedCaseInsensitiveContains(query)
        }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 28) {
                    VStack(alignment: .leading, spacing: 7) {
                        Text("Your library").font(.system(size: 34, weight: .bold, design: .rounded))
                        Text("Everything you keep. Nothing you don't.").font(.subheadline).foregroundStyle(MFATheme.secondary)
                    }

                    HStack(spacing: 10) {
                        ActionPill(title: "Import", icon: "plus") { }
                        ActionPill(title: "Shuffle", icon: "shuffle") {
                            if let track = player.library.randomElement() { player.play(track) }
                        }
                    }

                    VStack(alignment: .leading, spacing: 10) {
                        Text("RECENTLY ADDED").font(.caption.weight(.bold)).tracking(1.3).foregroundStyle(MFATheme.secondary)
                        LazyVStack(spacing: 0) {
                            ForEach(filtered.prefix(6)) { track in TrackRow(track: track) }
                        }
                    }

                    VStack(alignment: .leading, spacing: 10) {
                        Text("YOUR SHELVES").font(.caption.weight(.bold)).tracking(1.3).foregroundStyle(MFATheme.secondary)
                        HStack(spacing: 12) {
                            ShelfCard(title: "Albums", subtitle: "12", icon: "square.stack.3d.up")
                            ShelfCard(title: "Artists", subtitle: "28", icon: "person.2")
                        }
                    }
                }
                .padding(.horizontal, 20).padding(.top, 12).padding(.bottom, 150)
            }
            .background(MFATheme.canvas.ignoresSafeArea())
            .searchable(text: $query, placement: .navigationBarDrawer(displayMode: .always), prompt: "Songs, artists, albums")
            .toolbar(.hidden, for: .navigationBar)
        }
    }
}

struct TrackRow: View {
    @Environment(PlayerStore.self) private var player
    let track: Track

    var body: some View {
        Button { player.play(track) } label: {
            HStack(spacing: 13) {
                Artwork(seed: track.colourSeed, cornerRadius: 10).frame(width: 54, height: 54)
                VStack(alignment: .leading, spacing: 3) {
                    Text(track.title).font(.body.weight(.semibold)).foregroundStyle(MFATheme.ink).lineLimit(1)
                    Text(track.artist).font(.subheadline).foregroundStyle(MFATheme.secondary).lineLimit(1)
                }
                Spacer()
                SourceBadge(kind: track.source)
                Image(systemName: "ellipsis").font(.caption.weight(.bold)).foregroundStyle(MFATheme.secondary)
            }
            .padding(.vertical, 8)
        }
        .buttonStyle(.plain)
    }
}

struct ActionPill: View {
    let title: String
    let icon: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Label(title, systemImage: icon)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(MFATheme.ink)
                .padding(.horizontal, 15).padding(.vertical, 10)
                .background(.white.opacity(0.75), in: Capsule())
                .overlay { Capsule().stroke(.black.opacity(0.06), lineWidth: 0.7) }
        }
        .buttonStyle(.plain)
    }
}

struct ShelfCard: View {
    let title: String
    let subtitle: String
    let icon: String

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Image(systemName: icon).font(.title2)
            Spacer()
            Text(title).font(.headline)
            Text("\(subtitle) saved").font(.caption).foregroundStyle(MFATheme.secondary)
        }
        .foregroundStyle(MFATheme.ink)
        .frame(maxWidth: .infinity, minHeight: 130, alignment: .leading)
        .padding(16)
        .background(.white.opacity(0.65), in: RoundedRectangle(cornerRadius: 20, style: .continuous))
    }
}

struct SourceBadge: View {
    let kind: SourceKind
    var body: some View {
        Text(kind.shortTitle)
            .font(.caption2.weight(.medium))
            .foregroundStyle(MFATheme.secondary)
            .padding(.horizontal, 7).padding(.vertical, 4)
            .background(.black.opacity(0.045), in: Capsule())
    }
}
