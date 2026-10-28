import SwiftUI

struct MediaPreviewItem: View {
    let file: PendingMedia
    let owner: MediaTransferOwner
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            if file.contentType.hasPrefix("image/"), let image = UIImage(data: file.data) {
                GeometryReader { geometry in
                    Image(uiImage: image).resizable().scaledToFill().frame(
                        width: geometry.size.width, height: 145
                    ).clipped()
                }.frame(height: 145).clipShape(RoundedRectangle(cornerRadius: 12))
                    .accessibilityLabel("Выбранное фото")
            } else {
                HStack(spacing: 12) {
                    ExperienceIcon(kind: .file, size: 28)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(file.name).designFont(14, weight: .semibold)
                        Text(
                            MediaMetadata.label(type: file.contentType, bytes: file.data.count)
                        ).designFont(12).foregroundStyle(AppPalette.muted)
                    }
                }.padding(16).frame(maxWidth: .infinity, alignment: .leading)
                    .background(AppPalette.navigation, in: RoundedRectangle(cornerRadius: 12))
            }
            switch file.stage {
            case .ready:
                Button(file.contentType.hasPrefix("image/") ? "Убрать фото" : "Убрать файл") {
                    owner.remove(file.id)
                }
                .designFont(13).foregroundStyle(AppPalette.accent).frame(minHeight: 44)
                .disabled(owner.busy)
            case .uploading: EmptyView()
            case .published: EmptyView()
            case .failed:
                Text(file.problem ?? "Не удалось отправить файл.").designFont(12)
                    .foregroundStyle(AppPalette.error)
                HStack {
                    if file.problem == nil {
                        Button("Повторить") { owner.retry(file.id) }.disabled(owner.busy)
                    }
                    Button("Убрать") { owner.remove(file.id) }.disabled(owner.busy)
                }.designFont(12).frame(minHeight: 44)
            }
            if !file.contentType.hasPrefix("image/") {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Подпись").designFont(13).foregroundStyle(AppPalette.muted)
                    TextField(
                        "Добавьте пару слов",
                        text: Binding(
                            get: { file.caption },
                            set: { owner.setCaption($0, for: file.id) }), axis: .vertical
                    ).designFont(14).lineLimit(3...6).padding(14)
                        .frame(minHeight: 100, alignment: .topLeading)
                        .background(AppPalette.navigation, in: RoundedRectangle(cornerRadius: 13))
                        .disabled(file.stage != .ready || file.media != nil || owner.busy)
                        .accessibilityIdentifier("file-caption-" + file.id.uuidString.lowercased())
                }
            }
        }
    }
}
