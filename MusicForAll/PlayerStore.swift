import Foundation
import Observation

@Observable
final class PlayerStore {
    let library: [Track] = [
        Track(title: "Night Window", artist: "Asha Verma", album: "Soft Hours", duration: 214, source: .local, colourSeed: 1),
        Track(title: "Slow Motion", artist: "The Paper Rooms", album: "Almost Morning", duration: 248, source: .local, colourSeed: 2),
        Track(title: "Blue Room", artist: "Nolan Reed", album: "Interior Weather", duration: 187, source: .local, colourSeed: 3),
        Track(title: "Gymnopédie No. 1", artist: "Erik Satie", album: "Public Domain Classics", duration: 189, source: .open, license: .publicDomain, colourSeed: 4),
        Track(title: "Clair de Lune", artist: "Claude Debussy", album: "Open Classical", duration: 276, source: .open, license: .publicDomain, colourSeed: 5),
        Track(title: "Nocturne in E-flat", artist: "Frédéric Chopin", album: "Open Classical", duration: 258, source: .open, license: .publicDomain, colourSeed: 6)
    ]

    var currentTrack: Track?
    var isPlaying = false
    var progress: Double = 0
    var selectedTab: AppTab = .library

    func play(_ track: Track) {
        currentTrack = track
        progress = 0
        isPlaying = true
    }

    func togglePlayback() {
        guard currentTrack != nil else { return }
        isPlaying.toggle()
    }
}

enum AppTab: String {
    case library, discover, downloads, settings
}
