import SwiftUI

struct InvitationLoadingView: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var bright = false

    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.componentInvitationStateLoadingGap) {
            line(
                width: DesignTokens.componentInvitationStateLoadingTitleWidth,
                height: DesignTokens.componentInvitationStateLoadingTitleHeight)
            VStack(alignment: .leading, spacing: DesignTokens.spaceS12) {
                line(width: DesignTokens.componentInvitationStateLoadingLineOneWidth)
                line(width: DesignTokens.componentInvitationStateLoadingLineTwoWidth)
            }
            VStack(alignment: .leading, spacing: DesignTokens.spaceS12) {
                line()
                line(width: DesignTokens.componentInvitationStateLoadingTitleWidth)
            }
            block.frame(
                maxWidth: DesignTokens.componentInvitationStateLoadingActionWidth,
                minHeight: DesignTokens.componentInvitationStateLoadingActionHeight,
                maxHeight: DesignTokens.componentInvitationStateLoadingActionHeight)
        }
        .padding(.vertical, DesignTokens.spaceS12)
        .opacity(
            reduceMotion
                ? 1
                : bright
                    ? DesignTokens.componentInvitationStateLoadingBrightOpacity
                    : DesignTokens.componentInvitationStateLoadingDimOpacity
        )
        .accessibilityElement(children: .ignore).accessibilityLabel("Загрузка приглашения")
        .accessibilityIdentifier("invitation-loading")
        .task(id: reduceMotion) {
            guard !reduceMotion else { return }
            withAnimation(
                .easeInOut(duration: DesignTokens.componentInvitationStateLoadingPulse)
                    .repeatForever(autoreverses: true)
            ) { bright = true }
        }
    }

    private var block: some View {
        RoundedRectangle(cornerRadius: DesignTokens.componentInvitationStateLoadingRadius)
            .fill(DesignTokens.colorLine)
    }

    private func line(
        width: CGFloat = 1,
        height: CGFloat = DesignTokens.componentInvitationStateLoadingLineHeight
    ) -> some View {
        GeometryReader { geometry in block.frame(width: geometry.size.width * width) }
            .frame(height: height)
    }
}
