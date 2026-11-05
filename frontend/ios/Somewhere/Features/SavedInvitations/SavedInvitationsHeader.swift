import SwiftUI

struct SavedInvitationsHeader: View {
    let count: Int?
    let hasMore: Bool

    var body: some View {
        HStack(spacing: DesignTokens.spaceS12) {
            Text("Приглашения")
                .designTokenFont(
                    DesignTokens.componentMobileMeetingsTitleMaximum,
                    weight: DesignTokens.componentMobileMeetingsTitleWeight, relativeTo: .title
                )
                .tracking(-DesignTokens.componentMobileMeetingsTitleTracking)
                .accessibilityAddTraits(.isHeader)
            if let count {
                Text(String(count) + (hasMore ? "+" : ""))
                    .designFont(DesignTokens.typographySizeSmall).monospacedDigit()
                    .foregroundStyle(AppPalette.muted).padding(.horizontal, DesignTokens.spaceS4)
                    .frame(
                        minWidth: DesignTokens.componentMobileInvitationsCounterSize,
                        minHeight: DesignTokens.componentMobileInvitationsCounterSize
                    )
                    .background(
                        AppPalette.surface,
                        in: RoundedRectangle(
                            cornerRadius: DesignTokens.componentMobileInvitationsCounterRadius)
                    )
                    .accessibilityLabel(
                        "Показано приглашений: \(count)" + (hasMore ? ", есть ещё" : ""))
            }
            Spacer(minLength: DesignTokens.spaceS0)
        }
        .padding(.top, DesignTokens.componentMobileMeetingsHeadingInsetTop)
        .padding(.bottom, DesignTokens.componentMobileMeetingsHeadingInsetBottom)
        .frame(minHeight: DesignTokens.componentMobileMeetingsHeadingMinimumHeight)
    }
}
