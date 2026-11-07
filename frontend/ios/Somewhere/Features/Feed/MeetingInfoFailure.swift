import SwiftUI
import UIKit

struct MeetingInfoFailure: View {
    let retry: () -> Void
    @ScaledMetric private var titleSize = DesignTokens.typographySizeCardTitle
    @ScaledMetric private var titleLine = DesignTokens.componentMobileInfoErrorTitleLineHeight
    @ScaledMetric private var bodySize = DesignTokens.typographySizeButton
    @ScaledMetric private var bodyLine = DesignTokens.componentMobileInfoErrorBodyLineHeight

    var body: some View {
        VStack(spacing: DesignTokens.spaceS0) {
            Image(systemName: "calendar")
                .font(.system(size: DesignTokens.componentMobileInfoErrorGlyphSize))
                .frame(width: DesignTokens.spaceS64, height: DesignTokens.spaceS64)
                .foregroundStyle(DesignTokens.colorMuted)
                .background(
                    DesignTokens.colorSurface,
                    in: RoundedRectangle(cornerRadius: DesignTokens.spaceS20)
                ).accessibilityHidden(true).padding(.bottom, DesignTokens.spaceS24)
            Text("Встреча не загрузилась")
                .font(.system(size: titleSize, weight: .bold))
                .lineSpacing(
                    max(0, titleLine - UIFont.boldSystemFont(ofSize: titleSize).lineHeight)
                )
                .frame(minHeight: titleLine)
                .accessibilityAddTraits(.isHeader).padding(.bottom, DesignTokens.spaceS12)
            Text("Не удалось получить детали встречи. Попробуйте ещё раз.")
                .font(.system(size: bodySize))
                .lineSpacing(max(0, bodyLine - UIFont.systemFont(ofSize: bodySize).lineHeight))
                .frame(minHeight: bodyLine)
                .foregroundStyle(DesignTokens.colorMuted)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.bottom, DesignTokens.spaceS24)
            Button(action: retry) {
                HStack(spacing: DesignTokens.spaceS12) {
                    Text("Повторить загрузку")
                    Spacer(minLength: DesignTokens.spaceS0)
                    ChatIcon(
                        kind: .right, size: DesignTokens.componentMobileStateRefreshActionGlyphSize)
                }
                .designFont(DesignTokens.typographySizeButton)
                .padding(.horizontal, DesignTokens.spaceS16)
                .padding(.vertical, DesignTokens.componentMobileInfoErrorActionInsetBlock)
                .frame(maxWidth: .infinity, minHeight: DesignTokens.targetIos)
                .foregroundStyle(DesignTokens.colorActionText)
                .background(
                    DesignTokens.colorAction,
                    in: RoundedRectangle(cornerRadius: DesignTokens.spaceS12))
            }.buttonStyle(.plain)
        }
        .multilineTextAlignment(.center).frame(maxWidth: .infinity)
        .padding(.vertical, DesignTokens.componentMobileInfoErrorInsetBlock)
        .padding(.horizontal, DesignTokens.spaceS20)
        .background(
            DesignTokens.colorBackground,
            in: RoundedRectangle(cornerRadius: DesignTokens.spaceS20)
        ).overlay {
            RoundedRectangle(cornerRadius: DesignTokens.spaceS20)
                .stroke(DesignTokens.colorLine, lineWidth: DesignTokens.spaceS1)
        }.padding(.vertical, DesignTokens.spaceS20)
    }
}
