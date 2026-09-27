import SwiftUI

enum MFATheme {
    static let ink = Color(red: 0.075, green: 0.073, blue: 0.068)
    static let canvas = Color(red: 0.965, green: 0.952, blue: 0.925)
    static let accent = Color(red: 0.78, green: 0.32, blue: 0.16)
    static let secondary = Color(red: 0.39, green: 0.37, blue: 0.33)
}

struct Artwork: View {
    let seed: Int
    var cornerRadius: CGFloat = 18

    var body: some View {
        ZStack {
            LinearGradient(colors: palette, startPoint: .topLeading, endPoint: .bottomTrailing)
            Circle().fill(.white.opacity(0.16)).frame(width: 100).offset(x: CGFloat(seed * 7 - 18), y: -22)
            RoundedRectangle(cornerRadius: 44).stroke(.white.opacity(0.18), lineWidth: 1).rotationEffect(.degrees(Double(seed * 13))).padding(16)
            Text("MFA").font(.system(size: 13, weight: .bold, design: .rounded)).tracking(2).foregroundStyle(.white.opacity(0.82))
        }
        .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
    }

    private var palette: [Color] {
        switch seed % 6 {
        case 0: [.black, .gray]
        case 1: [Color(red: 0.12, green: 0.18, blue: 0.24), Color(red: 0.62, green: 0.44, blue: 0.31)]
        case 2: [Color(red: 0.08, green: 0.24, blue: 0.25), Color(red: 0.80, green: 0.62, blue: 0.34)]
        case 3: [Color(red: 0.25, green: 0.16, blue: 0.24), Color(red: 0.74, green: 0.42, blue: 0.32)]
        case 4: [Color(red: 0.22, green: 0.29, blue: 0.38), Color(red: 0.72, green: 0.67, blue: 0.54)]
        default: [Color(red: 0.19, green: 0.20, blue: 0.16), Color(red: 0.68, green: 0.43, blue: 0.25)]
        }
    }
}
