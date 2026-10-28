import SwiftUI

struct MediaPhotoSelection: View {
    let owner: MediaTransferOwner

    var body: some View {
        ScrollView(.horizontal) {
            LazyHStack(spacing: DesignTokens.spaceS12) {
                ForEach(owner.pending.filter { $0.stage != .published }) { file in
                    VStack(alignment: .leading, spacing: DesignTokens.spaceS8) {
                        if let image = UIImage(data: file.data) {
                            Image(uiImage: image).resizable().scaledToFill()
                                .containerRelativeFrame(.horizontal)
                                .aspectRatio(1, contentMode: .fit)
                                .clipped().clipShape(
                                    RoundedRectangle(
                                        cornerRadius: DesignTokens.componentButtonRadius)
                                )
                                .accessibilityLabel("Выбранное фото")
                                .overlay(alignment: .topTrailing) {
                                    Button {
                                        owner.remove(file.id)
                                    } label: {
                                        ExperienceIcon(kind: .close)
                                            .frame(
                                                width: DesignTokens.targetIos,
                                                height: DesignTokens.targetIos
                                            )
                                            .foregroundStyle(DesignTokens.colorText)
                                            .background(DesignTokens.colorBackground, in: Circle())
                                    }.accessibilityLabel("Убрать фото " + file.name).disabled(
                                        owner.busy)
                                }
                        }
                        if file.stage == .failed {
                            Text(file.problem ?? "Не удалось отправить фото.")
                                .designFont(DesignTokens.typographySizeCaption)
                                .foregroundStyle(DesignTokens.colorError)
                                .containerRelativeFrame(.horizontal)
                        }
                    }
                }
            }
        }.scrollIndicators(.hidden).accessibilityIdentifier("media-photo-carousel")
    }
}
