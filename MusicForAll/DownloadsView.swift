import SwiftUI

struct DownloadsView: View {
    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 18) {
                Image(systemName: "arrow.down.circle").font(.system(size: 34, weight: .medium))
                Text("Downloads").font(.system(size: 34, weight: .bold, design: .rounded))
                Text("Music you chose to keep offline will live here.").foregroundStyle(MFATheme.secondary)
                Spacer()
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(20)
            .background(MFATheme.canvas.ignoresSafeArea())
            .toolbar(.hidden, for: .navigationBar)
        }
    }
}
