import SwiftUI

struct ComposerMenu: View {
    let owner: FeedOwner
    let close: () -> Void
    var body: some View {
        VStack(spacing: DesignTokens.spaceS0) {
            item("Фото", icon: .photo) {
                owner.photoSelection = true
                owner.mediaSelection = owner.photoSelection ? .photos : .files
            }
            item("Файл", icon: .file) {
                owner.photoSelection = false
                owner.mediaSelection = owner.photoSelection ? .photos : .files
            }
            Rectangle().fill(AppPalette.border).frame(height: DesignTokens.spaceS1).padding(
                .horizontal, DesignTokens.spaceS10
            ).padding(
                .vertical, DesignTokens.spaceS6)
            item("Предложить дату", icon: .calendar) { owner.openSheet(.date) }
                .accessibilityIdentifier("new-date-poll")
            item("Предложить место", icon: .pin) { owner.openSheet(.place) }
                .accessibilityIdentifier("new-place-poll")
            item("Предложить задачу", icon: .task) { owner.openSheet(.preparation) }
                .accessibilityIdentifier("new-preparation-task")
        }.padding(DesignTokens.componentChatAddMenuInset).frame(
            width: DesignTokens.componentChatAddMenuWidth
        )
        .background(
            DesignTokens.colorSurface,
            in: RoundedRectangle(cornerRadius: DesignTokens.componentChatAddMenuRadius)
        )
        .overlay {
            RoundedRectangle(cornerRadius: DesignTokens.componentChatAddMenuRadius).stroke(
                DesignTokens.colorBorderStrong, lineWidth: DesignTokens.spaceS1)
        }

    }
    private func item(_ title: String, icon: ChatIcon.Kind, action: @escaping () -> Void)
        -> some View
    {
        Button {
            close()
            action()
        } label: {
            HStack(spacing: DesignTokens.spaceS12) {
                ChatIcon(kind: icon).foregroundStyle(AppPalette.accent)
                Text(title).designFont(DesignTokens.typographySizeButton)
                Spacer()
            }.padding(.horizontal, DesignTokens.spaceS12).frame(
                minHeight: DesignTokens.componentChatAddMenuRowHeight
            ).contentShape(Rectangle())
        }.buttonStyle(ChatPressStyle())
    }
}
