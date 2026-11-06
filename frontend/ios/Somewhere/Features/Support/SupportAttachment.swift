import PhotosUI
import SwiftUI

struct SupportAttachment: View {
    @Bindable var owner: SupportOwner
    @Binding var selection: PhotosPickerItem?
    let problem: String?
    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS10) {
            if let photo = owner.screenshot {
                HStack(spacing: DesignTokens.spaceS12) {
                    if let image = UIImage(data: photo.data) {
                        Image(uiImage: image).resizable().scaledToFill()
                            .frame(
                                width: DesignTokens.componentMobileSupportAttachmentWidth,
                                height: DesignTokens.componentMobileSupportAttachmentPreviewHeight
                            )
                            .clipShape(RoundedRectangle(cornerRadius: DesignTokens.spaceS8))
                    }
                    VStack(alignment: .leading, spacing: DesignTokens.spaceS4) {
                        Text(photo.name).designFont(
                            DesignTokens.typographySizeCaption, weight: .semibold)
                        Text("Скриншот прикреплён").designFont(DesignTokens.typographySizeLabel)
                            .foregroundStyle(DesignTokens.colorMuted)
                    }
                    Spacer(minLength: DesignTokens.spaceS0)
                    Button {
                        owner.screenshot = nil
                        selection = nil
                    } label: {
                        Image(systemName: "xmark").frame(
                            width: DesignTokens.targetIos, height: DesignTokens.targetIos)
                    }.buttonStyle(.plain).foregroundStyle(DesignTokens.colorMuted)
                        .accessibilityLabel("Убрать скриншот")
                }.padding(DesignTokens.spaceS12).background(
                    DesignTokens.colorSurface,
                    in: RoundedRectangle(
                        cornerRadius: DesignTokens.componentMobileServiceFieldRadius))
            } else {
                PhotosPicker(selection: $selection, matching: .images) {
                    HStack(spacing: DesignTokens.spaceS12) {
                        Image(systemName: "paperclip").font(
                            .system(size: DesignTokens.typographySizeCardTitle)
                        ).foregroundStyle(
                            DesignTokens.colorAccent)
                        VStack(alignment: .leading, spacing: DesignTokens.spaceS4) {
                            Text("Прикрепить скриншот").designFont(DesignTokens.typographySizeSmall)
                            Text("PNG, JPG или WebP, до 5 МБ").designFont(
                                DesignTokens.typographySizeLabel
                            ).foregroundStyle(DesignTokens.colorMuted)
                        }
                    }.padding(.horizontal, (DesignTokens.spaceS12 + DesignTokens.spaceS2))
                        .frame(
                            maxWidth: .infinity,
                            minHeight: DesignTokens.componentMobileSupportAttachmentHeight
                        )
                        .overlay {
                            RoundedRectangle(
                                cornerRadius: DesignTokens.componentMobileServiceFieldRadius
                            ).stroke(
                                DesignTokens.colorBorderStrong,
                                style: StrokeStyle(
                                    lineWidth: DesignTokens.spaceS1,
                                    dash: [DesignTokens.spaceS4, DesignTokens.spaceS4]))
                        }
                }.buttonStyle(.plain)
            }
            if let problem {
                Text(problem).designFont(DesignTokens.typographySizeCaption).foregroundStyle(
                    DesignTokens.colorError)
            }
        }
    }
}
