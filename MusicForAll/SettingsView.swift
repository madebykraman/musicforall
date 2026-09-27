import SwiftUI

struct SettingsView: View {
    var body: some View {
        NavigationStack {
            List {
                Section("Sources") {
                    NavigationLink("On this iPhone", systemImage: "iphone") { SourceDetail(title: "On this iPhone", detail: "Local files") }
                    NavigationLink("Open music", systemImage: "globe") { SourceDetail(title: "Open music", detail: "Licence-aware public catalogues") }
                    NavigationLink("Apple Music", systemImage: "music.note") { SourceDetail(title: "Apple Music", detail: "MusicKit connection") }
                    NavigationLink("Spotify", systemImage: "waveform") { SourceDetail(title: "Spotify", detail: "Remote playback through Spotify") }
                }
                Section("Playback") {
                    Toggle("Gapless playback", isOn: .constant(true))
                    Toggle("Normalize volume", isOn: .constant(false))
                }
                Section("About") {
                    NavigationLink("Why Music For All") { AboutView() }
                    Link("Open source repository", destination: URL(string: "https://github.com/madebykraman/musicforall")!)
                }
            }
            .scrollContentBackground(.hidden)
            .background(MFATheme.canvas)
            .navigationTitle("Settings")
        }
    }
}

struct SourceDetail: View {
    let title: String
    let detail: String
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title).font(.largeTitle.bold())
            Text(detail).foregroundStyle(MFATheme.secondary)
            Spacer()
        }
        .padding(20)
        .background(MFATheme.canvas.ignoresSafeArea())
    }
}

struct AboutView: View {
    var body: some View {
        ScrollView {
            Text("Music For All is a design-first open-source music player. It treats music ownership, licensing and connected services as different things without making the user learn the legal model to press play.")
                .font(.title3)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(20)
        }
        .background(MFATheme.canvas.ignoresSafeArea())
        .navigationTitle("The idea")
    }
}
