import SwiftUI

struct SavedInvitationsLoading: View {
    var body: some View {
        VStack(spacing: 16) {
            ForEach(0..<3) { _ in
                HStack(spacing: 16) {
                    RoundedRectangle(cornerRadius: 10).frame(width: 40, height: 56)
                    VStack(alignment: .leading, spacing: 12) {
                        RoundedRectangle(cornerRadius: 5).frame(height: 20)
                        RoundedRectangle(cornerRadius: 4).frame(width: 140, height: 12)
                        RoundedRectangle(cornerRadius: 4).frame(width: 100, height: 12)
                    }
                }.foregroundStyle(AppPalette.muted.opacity(0.15)).padding(16)
                    .background(AppPalette.surface, in: RoundedRectangle(cornerRadius: 19))
            }
        }.accessibilityElement(children: .ignore).accessibilityLabel("Загрузка приглашений")
    }
}
