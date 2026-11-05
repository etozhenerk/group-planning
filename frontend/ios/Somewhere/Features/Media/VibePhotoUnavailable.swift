import SwiftUI

struct VibePhotoUnavailable: View {
    let retry: () -> Void
    var body: some View {
        VStack(spacing: DesignTokens.spaceS12) {
            Image(systemName: "photo.badge.exclamationmark").font(
                .system(size: DesignTokens.componentMobileVibePhotoErrorIcon))
            Text("Фото недоступно").designFont(DesignTokens.typographySizeButton, weight: .semibold)
            Button("Повторить", action: retry).designFont(DesignTokens.typographySizeButton)
                .foregroundStyle(DesignTokens.colorAccent).frame(minHeight: DesignTokens.targetIos)
        }.foregroundStyle(DesignTokens.colorMuted).frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(DesignTokens.colorSurface)
    }
}
