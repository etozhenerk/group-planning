import SwiftUI

struct AlbumActions: View {
    let owner: AlbumSaveOwner
    let hasPhotos: Bool
    let add: () -> Void
    @Environment(\.openURL) private var openURL

    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS12) {
            HStack(spacing: DesignTokens.spaceS8) {
                AlbumActionButton(
                    title: "Добавить фото", accessibleTitle: "Добавить фото", icon: .plus,
                    primary: true, action: add
                )
                .accessibilityIdentifier("album-add")
                if hasPhotos {
                    AlbumActionButton(
                        title: title, accessibleTitle: accessibleTitle,
                        icon: owner.state == .permissionRequired ? nil : .download,
                        busy: owner.state == .preparing || owner.state == .saving,
                        disabled: owner.state == .saving || (owner.working && owner.state == .idle),
                        action: activate
                    ).accessibilityIdentifier("album-save")
                }
            }.fixedSize(horizontal: false, vertical: true)
            if let message {
                Text(message).designFont(DesignTokens.typographySizeSmall)
                    .foregroundStyle(isError ? DesignTokens.colorError : DesignTokens.colorMuted)
                    .accessibilityIdentifier("album-save-feedback")
            }
        }
    }

    private var title: String {
        switch owner.state {
        case .preparing: "Отменить"
        case .saving: "Сохраняем…"
        case .permissionRequired: "Настройки"
        case .preparationFailed, .saveFailed: "Повторить"
        case .idle, .saved: "Сохранить все"
        }
    }

    private var accessibleTitle: String {
        switch owner.state {
        case .idle, .saved: "Сохранить все фото"
        case .preparing: "Отменить подготовку фотографий"
        default: title
        }
    }

    private var message: String? {
        switch owner.state {
        case .permissionRequired: "Разрешите сохранять фото в настройках приложения."
        case .preparationFailed: "Не удалось подготовить фотографии. Попробуйте ещё раз."
        case .saveFailed: "Не удалось сохранить фотографии."
        case .saved: "Фотографии сохранены"
        default: nil
        }
    }

    private var isError: Bool {
        switch owner.state {
        case .permissionRequired, .preparationFailed, .saveFailed: true
        default: false
        }
    }

    private func activate() {
        if owner.state == .preparing {
            owner.cancel()
        } else if owner.state == .permissionRequired {
            if let url = URL(string: UIApplication.openSettingsURLString) { openURL(url) }
        } else {
            owner.start()
        }
    }
}
