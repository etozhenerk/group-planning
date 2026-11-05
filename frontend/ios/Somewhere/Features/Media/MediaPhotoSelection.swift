import SwiftUI

struct MediaPhotoSelection: View {
    let owner: MediaTransferOwner
    var width = DesignTokens.componentPhotoPreviewWidth
    var height = DesignTokens.componentPhotoPreviewHeight
    var cornerRadius = DesignTokens.componentButtonRadius
    var outset: CGFloat? = nil

    var body: some View {
        ScrollView(.horizontal) {
            LazyHStack(spacing: DesignTokens.spaceS12) {
                ForEach(owner.pending.filter { $0.stage != .published }) { file in
                    VStack(alignment: .leading, spacing: DesignTokens.spaceS8) {
                        if let image = UIImage(data: file.data) {
                            Image(uiImage: image).resizable().scaledToFill()
                                .frame(
                                    width: width,
                                    height: height
                                )
                                .clipped()
                                .clipShape(
                                    RoundedRectangle(
                                        cornerRadius: cornerRadius)
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
                                    width: width,
                                    alignment: .leading)
                        }
                    }
                }
            }.padding(.vertical, removeOffset).padding(.trailing, removeOffset)
        }.scrollIndicators(.hidden).accessibilityIdentifier("media-photo-carousel")
    }
    private var removeOffset: CGFloat {
        outset
            ?? ((DesignTokens.targetIos - DesignTokens.componentPhotoPreviewRemoveSize) / 2
                + DesignTokens.componentPhotoPreviewRemoveOutset)
    }
}
