import SwiftUI

struct SavedInvitationsLoading: View {
    var body: some View {
        DeferredPlaceholder {
            VStack(spacing: DesignTokens.spaceS24) {
                ForEach(0..<3) { _ in
                    HStack(spacing: DesignTokens.spaceS16) {
                        VStack(spacing: DesignTokens.spaceS12) {
                            RoundedRectangle(cornerRadius: DesignTokens.spaceS4)
                                .frame(height: DesignTokens.spaceS16)
                            RoundedRectangle(cornerRadius: DesignTokens.spaceS4)
                                .frame(height: DesignTokens.spaceS12).padding(
                                    .trailing, DesignTokens.spaceS24)
                        }
                        RoundedRectangle(cornerRadius: DesignTokens.radiusControl)
                            .frame(
                                width: DesignTokens.componentCardCoverMobileWidth,
                                height: DesignTokens.componentCardCoverMobileHeight)
                    }
                    .foregroundStyle(DesignTokens.colorLine).padding(DesignTokens.spaceS20)
                    .frame(
                        maxWidth: .infinity,
                        minHeight: DesignTokens.componentCardMinimumHeightMobile
                    )
                    .background(
                        AppPalette.surface,
                        in: RoundedRectangle(cornerRadius: DesignTokens.radiusCard))
                }
            }
            .accessibilityElement(children: .ignore).accessibilityLabel("Загрузка приглашений")
        }
    }
}
