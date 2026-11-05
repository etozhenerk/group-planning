import SwiftUI

struct SavedInvitationsExplanation: View {
    var body: some View {
        Text(
            "Здесь встречи, на которые вы ответили «Возможно». Откройте приглашение, чтобы изменить ответ."
        )
        .designFont(DesignTokens.typographySizeSmall).lineSpacing(DesignTokens.spaceS4)
        .foregroundStyle(AppPalette.muted)
        .frame(
            maxWidth: DesignTokens.componentMobileInvitationsExplanationMaxWidth,
            alignment: .leading
        )
        .fixedSize(horizontal: false, vertical: true)
    }
}
