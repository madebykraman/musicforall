import SwiftUI

@main
struct MusicForAllApp: App {
    @State private var player = PlayerStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(player)
        }
    }
}
