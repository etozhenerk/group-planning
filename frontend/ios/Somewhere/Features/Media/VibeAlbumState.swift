import SwiftUI

struct VibeAlbumState: View {
    enum Kind { case empty, error, loading, denied }
    let kind: Kind
    var retry: () -> Void = {}
    var body: some View {
        VStack(spacing: DesignTokens.spaceS0) {
            if kind == .loading {
                RoundedRectangle(cornerRadius: DesignTokens.radiusCover).fill(
                    DesignTokens.colorBackground
                )
                .aspectRatio(
                    CGFloat(DesignTokens.componentMobileVibeStateSkeletonRatio), contentMode: .fit
                )
                .padding(.bottom, DesignTokens.spaceS20).accessibilityLabel("Загружаем фото…")
            } else {
                Image(
                    systemName: kind == .denied
                        ? "lock"
                        : kind == .error
                            ? "photo.badge.exclamationmark" : "photo.on.rectangle.angled"
                )
                .font(.system(size: DesignTokens.componentMobileVibeStateIcon)).foregroundStyle(
                    DesignTokens.colorAccent
                )
                .frame(
                    width: DesignTokens.componentMobileVibeStateIconTile,
                    height: DesignTokens.componentMobileVibeStateIconTile
                )
                .background(
                    DesignTokens.colorBackground,
                    in: RoundedRectangle(cornerRadius: DesignTokens.radiusCard)
                ).padding(.bottom, DesignTokens.spaceS24)
                Text(
                    kind == .empty
                        ? "Как всё прошло?"
                        : kind == .denied ? "Доступ к фото закрыт" : "Альбом не загрузился"
                )
                .designFont(DesignTokens.componentMobileVibeStateTitle, weight: .bold).padding(
                    .bottom, DesignTokens.spaceS12)
            }
            Text(
                kind == .empty
                    ? "Добавьте фото встречи — их увидят участники."
                    : kind == .denied
                        ? "Фото доступны участникам встречи."
                        : kind == .error
                            ? "Не удалось получить фотографии. Попробуйте ещё раз."
                            : "Загружаем фото…"
            )
            .designFont(DesignTokens.typographySizeSmall).foregroundStyle(DesignTokens.colorMuted)
            .frame(maxWidth: DesignTokens.componentMobileVibeStateTextMaximumWidth)
            if kind == .error {
                ActionFormButton(
                    title: "Повторить загрузку",
                    minimumHeight: DesignTokens.componentMobileVibeActionMinimumHeight,
                    cornerRadius: DesignTokens.componentMobileVibeActionRadius, action: retry
                )
                .padding(.top, DesignTokens.spaceS24)
            }
        }.multilineTextAlignment(.center).frame(
            maxWidth: .infinity
        )
        .padding(.vertical, DesignTokens.spaceS32).padding(
            .horizontal, DesignTokens.spaceS20 + DesignTokens.spaceS2
        )
        .frame(minHeight: DesignTokens.componentMobileVibeStateMinimumHeight)
        .background(
            DesignTokens.colorSurface, in: RoundedRectangle(cornerRadius: DesignTokens.radiusSheet)
        )
        .overlay(
            RoundedRectangle(cornerRadius: DesignTokens.radiusSheet).stroke(
                DesignTokens.colorLine, lineWidth: DesignTokens.spaceS1)
        )
        .padding(.horizontal, DesignTokens.spaceS20).padding(.top, DesignTokens.spaceS40).padding(
            .bottom, DesignTokens.spaceS32)
    }
}
