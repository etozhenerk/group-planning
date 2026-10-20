import SwiftUI

struct InvitationShareButton: View {
    let url: URL
    let title: String
    var body: some View {
        ShareLink(item: url, preview: SharePreview(title)) {
            Label("Пригласить друзей", systemImage: "square.and.arrow.up")
                .font(.body.weight(.semibold)).lineLimit(1).minimumScaleFactor(0.6)
                .foregroundStyle(AppPalette.actionText)
                .frame(maxWidth: .infinity, minHeight: 24).padding(16)
                .background(AppPalette.action, in: RoundedRectangle(cornerRadius: 18))
        }.buttonStyle(OnboardingPressStyle()).accessibilityIdentifier("share-invitation")
    }
}
