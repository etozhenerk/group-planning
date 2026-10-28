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
                                .frame(
                                    width: DesignTokens.componentPhotoPreviewWidth,
                                    height: DesignTokens.componentPhotoPreviewHeight
                                )
                                .clipped()
                                .clipShape(
                                    RoundedRectangle(
                                        cornerRadius: DesignTokens.componentButtonRadius)
                                )
                                .accessibilityLabel("Выбранное фото")
                                .overlay(alignment: .topTrailing) {
                                    Button {
                                        owner.remove(file.id)
                                    } label: {
                                        ExperienceIcon(
                                            kind: .close,
                                            size: DesignTokens.componentMobileFieldIconSize
                                        )
                                        .frame(
                                            width: DesignTokens.componentPhotoPreviewRemoveSize,
                                            height: DesignTokens.componentPhotoPreviewRemoveSize
                                        )
                                        .foregroundStyle(DesignTokens.colorText)
                                        .background(DesignTokens.colorBackground, in: Circle())
                                        .overlay {
                                            Circle().stroke(
                                                DesignTokens.colorBorderStrong,
                                                lineWidth: DesignTokens.spaceS1)
                                        }
                                        .frame(
                                            width: DesignTokens.targetIos,
                                            height: DesignTokens.targetIos
                                        )
                                        .contentShape(Rectangle())
                                    }.accessibilityLabel("Убрать фото " + file.name)
                                        .disabled(owner.busy)
                                        .offset(x: removeOffset, y: -removeOffset)
                                }
                        }
                        if file.stage == .failed {
                            Text(file.problem ?? "Не удалось отправить фото.")
                                .designFont(DesignTokens.typographySizeCaption)
                                .foregroundStyle(DesignTokens.colorError)
                                .frame(
                                    width: DesignTokens.componentPhotoPreviewWidth,
                                    alignment: .leading)
                        }
                    }
                }
            }.padding(.vertical, removeOffset).padding(.trailing, removeOffset)
        }.scrollIndicators(.hidden).accessibilityIdentifier("media-photo-carousel")
    }
    private var removeOffset: CGFloat {
        (DesignTokens.targetIos - DesignTokens.componentPhotoPreviewRemoveSize) / 2
            + DesignTokens.componentPhotoPreviewRemoveOutset
    }
}
