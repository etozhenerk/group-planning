import SwiftUI
import UIKit

struct PeopleLoadFailure: View {
    let retry: () -> Void
    @ScaledMetric private var size = DesignTokens.typographySizeSmall
    @ScaledMetric private var lineHeight = DesignTokens.componentMobileInfoPeopleErrorLineHeight

    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
            Text("Не удалось получить ответы.")
                .lineSpacing(max(0, lineHeight - UIFont.systemFont(ofSize: size).lineHeight))
                .frame(minHeight: lineHeight).foregroundStyle(DesignTokens.colorMuted)
                .fixedSize(horizontal: false, vertical: true)
            Button(action: retry) {
                Text("Повторить")
                    .padding(.top, DesignTokens.spaceS8)
                    .frame(
                        minWidth: DesignTokens.targetIos, minHeight: DesignTokens.targetIos,
                        alignment: .topLeading
                    ).contentShape(Rectangle())
            }.buttonStyle(.plain).foregroundStyle(DesignTokens.colorAccent)
        }
        .font(.system(size: size))
        .frame(maxWidth: .infinity, alignment: .leading).padding(DesignTokens.spaceS16)
        .background(
            DesignTokens.colorBackground,
            in: RoundedRectangle(cornerRadius: DesignTokens.componentMobileInfoPeopleErrorRadius))
    }
}
