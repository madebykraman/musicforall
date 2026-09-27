import Foundation

enum SourceKind: String, CaseIterable, Identifiable {
    case local, open, appleMusic, spotify, jellyfin

    var id: String { rawValue }

    var title: String {
        switch self {
        case .local: "On this iPhone"
        case .open: "Open music"
        case .appleMusic: "Apple Music"
        case .spotify: "Spotify"
        case .jellyfin: "Jellyfin"
        }
    }

    var shortTitle: String {
        switch self {
        case .local: "Local"
        case .open: "Open"
        case .appleMusic: "Apple Music"
        case .spotify: "Spotify"
        case .jellyfin: "Jellyfin"
        }
    }
}

enum LicenseKind: String, Codable {
    case publicDomain, cc0, attribution, attributionShareAlike
    case attributionNoDerivatives, attributionNonCommercial, unknown

    var label: String {
        switch self {
        case .publicDomain: "Public domain"
        case .cc0: "CC0"
        case .attribution: "CC BY"
        case .attributionShareAlike: "CC BY-SA"
        case .attributionNoDerivatives: "CC BY-ND"
        case .attributionNonCommercial: "CC BY-NC"
        case .unknown: "Licence unknown"
        }
    }

    var allowsDownload: Bool { self == .publicDomain || self == .cc0 }

    var needsAttribution: Bool {
        switch self {
        case .publicDomain, .cc0: false
        default: true
        }
    }
}

struct Track: Identifiable, Hashable {
    let id: UUID
    let title: String
    let artist: String
    let album: String
    let duration: TimeInterval
    let source: SourceKind
    let license: LicenseKind?
    let colourSeed: Int

    init(
        id: UUID = UUID(),
        title: String,
        artist: String,
        album: String,
        duration: TimeInterval,
        source: SourceKind,
        license: LicenseKind? = nil,
        colourSeed: Int = 0
    ) {
        self.id = id
        self.title = title
        self.artist = artist
        self.album = album
        self.duration = duration
        self.source = source
        self.license = license
        self.colourSeed = colourSeed
    }
}

protocol MusicSource {
    var kind: SourceKind { get }
    var displayName: String { get }
    func search(_ query: String) async throws -> [Track]
}
