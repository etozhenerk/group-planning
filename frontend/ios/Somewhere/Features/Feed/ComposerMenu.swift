import SwiftUI

struct ComposerMenu: View {
    let owner: FeedOwner
    let close: () -> Void
    var body: some View {
        VStack(spacing: 0) {
            item("Фото", icon: .photo) {
                owner.photoSelection = true
                owner.mediaPresented = true
            }
            item("Файл", icon: .file) {
                owner.photoSelection = false
                owner.mediaPresented = true
            }
            Rectangle().fill(AppPalette.border).frame(height: 1).padding(.horizontal, 10).padding(
                .vertical, 6)
            item("Предложить дату", icon: .calendar) { owner.pollPresented = true }
                .accessibilityIdentifier("new-date-poll")
            item("Предложить место", icon: .pin) { owner.placePollPresented = true }
                .accessibilityIdentifier("new-place-poll")
            item("Предложить задачу", icon: .list) { owner.preparationTaskPresented = true }
                .accessibilityIdentifier("new-preparation-task")
        }.padding(8).frame(width: 268)
            .background(Color(designHex: 0x36373f), in: RoundedRectangle(cornerRadius: 19))
            .overlay {
                RoundedRectangle(cornerRadius: 19).stroke(.white.opacity(0.078), lineWidth: 1)
            }
            .shadow(color: .black.opacity(0.33), radius: 30, y: 20)
    }
    private func item(_ title: String, icon: ExperienceIcon.Kind, action: @escaping () -> Void)
        -> some View
    {
        Button {
            close()
            action()
        } label: {
            HStack(spacing: 12) {
                ExperienceIcon(kind: icon).foregroundStyle(AppPalette.accent)
                Text(title).font(.system(size: 14))
                Spacer()
            }.padding(.horizontal, 12).frame(minHeight: 48).contentShape(Rectangle())
        }.buttonStyle(.plain)
    }
}
