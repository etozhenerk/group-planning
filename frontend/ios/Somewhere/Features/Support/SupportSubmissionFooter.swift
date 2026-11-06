import SwiftUI

struct SupportSubmissionFooter: View {
    let owner: SupportOwner
    let pinned: Bool
    let reading: Bool
    let submit: () -> Void
    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS16) {
            if let problem = owner.problem {
                HStack(alignment: .top, spacing: DesignTokens.spaceS10) {
                    Image(systemName: "exclamationmark.triangle").foregroundStyle(
                        DesignTokens.colorError)
                    VStack(alignment: .leading, spacing: DesignTokens.spaceS4) {
                        Text(
                            owner.frozen
                                ? "Отправка не подтверждена" : "Не удалось отправить обращение"
                        )
                        .designFont(DesignTokens.typographySizeSmall, weight: .semibold)
                        Text(
                            problem.contains("Слишком много")
                                ? problem : "Текст и скриншот сохранены. Повторите отправку."
                        ).designFont(DesignTokens.typographySizeLabel).foregroundStyle(
                            DesignTokens.colorMuted)
                    }
                }.accessibilityIdentifier("support-submit-error")
            }
            Button {
                SystemKeyboard.dismiss()
                submit()
            } label: {
                HStack(spacing: DesignTokens.spaceS10) {
                    if owner.sending { ProgressView().tint(DesignTokens.colorActionText) }
                    Text(
                        owner.sending
                            ? "Отправляем…"
                            : owner.problem == nil ? "Отправить обращение" : "Повторить отправку")
                }.designFont(DesignTokens.typographySizeBody, weight: .semibold)
                    .frame(
                        maxWidth: .infinity,
                        minHeight: DesignTokens.componentMobileServiceActionHeight
                    )
                    .foregroundStyle(DesignTokens.colorActionText)
                    .background(
                        DesignTokens.colorAction,
                        in: RoundedRectangle(
                            cornerRadius: DesignTokens.componentMobileServiceActionRadius))
            }.buttonStyle(.plain).disabled(owner.sending || reading).accessibilityIdentifier(
                "support-submit")
        }.padding(.horizontal, DesignTokens.spaceS20).padding(.top, DesignTokens.spaceS16)
            .padding(.bottom, DesignTokens.spaceS24 + DesignTokens.spaceS4)
            .background {
                if pinned {
                    UnevenRoundedRectangle(
                        topLeadingRadius: DesignTokens.componentMobileStickyRadius,
                        topTrailingRadius: DesignTokens.componentMobileStickyRadius
                    )
                    .fill(DesignTokens.colorSurface).ignoresSafeArea(edges: .bottom)
                    .shadow(
                        color: DesignTokens.colorMobileStickyShadow,
                        radius: DesignTokens.componentMobileStickyShadowBlur,
                        y: -DesignTokens.componentMobileStickyShadowUpOffset)
                }
            }
    }
}
