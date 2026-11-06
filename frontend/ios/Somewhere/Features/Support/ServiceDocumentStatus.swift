import SwiftUI

struct ServiceDocumentStatus: View {
    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS8) {
            HStack(spacing: DesignTokens.spaceS8) {
                Image(systemName: "doc.badge.ellipsis").font(.system(size: DesignTokens.spaceS16))
                Text("Проект документа").designFont(
                    DesignTokens.typographySizeCaption, weight: .semibold)
            }.foregroundStyle(DesignTokens.colorAccent)
            Text("Условия обработки и хранения уточним перед публикацией.")
                .designFont(DesignTokens.typographySizeCaption).foregroundStyle(
                    DesignTokens.colorMuted
                )
                .fixedSize(horizontal: false, vertical: true)
        }.padding(DesignTokens.spaceS16).frame(maxWidth: .infinity, alignment: .leading)
            .background(
                DesignTokens.colorSurface,
                in: RoundedRectangle(cornerRadius: DesignTokens.componentMobileServiceFieldRadius)
            )
            .padding(.top, DesignTokens.spaceS24).padding(
                .bottom, DesignTokens.spaceS24 + DesignTokens.spaceS6)
    }
}
