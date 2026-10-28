import SwiftUI

struct MediaPickerPanel: View {
    @Bindable var owner: MediaTransferOwner
    var photosOnly = false
    @State private var picker: MediaPickerKind?
    @Environment(\.dismiss) private var dismiss
    @Environment(\.chatSheetClose) private var close

    var body: some View {
        ActionFormSheet(
            title: photosOnly ? "Отправить фото" : "Отправить файл",
            dismissDisabled: owner.busy,
            scrollIdentifier: "media-picker-scroll", closeIdentifier: "media-picker-close"
        ) {
            if let problem = owner.problem {
                Text(problem).designFont(DesignTokens.typographySizeCaption)
                    .foregroundStyle(DesignTokens.colorError)
            }
            if photosOnly {
                MediaPhotoSelection(owner: owner)
            } else {
                ForEach(owner.pending.filter { $0.stage != .published }) { file in
                    MediaPreviewItem(file: file, owner: owner)
                }
            }
            Text("Видно участникам встречи").designFont(DesignTokens.typographySizeCaption)
                .foregroundStyle(DesignTokens.colorMuted)
            if owner.busy {
                ProgressView("Отправляем…").frame(maxWidth: .infinity)
                    .accessibilityIdentifier("media-batch-progress")
            }
            HStack(spacing: DesignTokens.spaceS12) {
                Button {
                    picker = photosOnly ? .photos : .files
                } label: {
                    Label("Выбрать ещё", systemImage: "plus")
                        .designFont(DesignTokens.typographySizeButton, weight: .semibold)
                        .padding(.horizontal, DesignTokens.componentButtonPaddingInline)
                        .frame(minHeight: DesignTokens.componentButtonMinimumHeight)
                        .overlay {
                            RoundedRectangle(cornerRadius: DesignTokens.componentButtonRadius)
                                .stroke(
                                    DesignTokens.colorBorderStrong, lineWidth: DesignTokens.spaceS1)
                        }
                }.accessibilityLabel(photosOnly ? "Выбрать фото" : "Выбрать файл")
                    .disabled(owner.busy)
                Spacer(minLength: DesignTokens.spaceS0)
                Button(action: owner.send) {
                    Text(owner.pending.contains { $0.stage == .failed } ? "Повторить" : "Отправить")
                        .designFont(DesignTokens.typographySizeButton, weight: .semibold)
                        .padding(.horizontal, DesignTokens.componentButtonPaddingInline)
                        .frame(minHeight: DesignTokens.componentButtonMinimumHeight)
                        .foregroundStyle(DesignTokens.colorActionText)
                        .background(
                            DesignTokens.colorAction,
                            in: RoundedRectangle(
                                cornerRadius: DesignTokens.componentButtonRadius))
                }.disabled(owner.busy || !owner.canSend)
                    .accessibilityIdentifier("media-batch-send")
            }
        }
        .interactiveDismissDisabled(owner.busy)
        .modifier(MediaSelectionPresenter(owner: owner, kind: $picker, selected: {}))
        .task { await owner.loadLimits() }
        .onChange(of: owner.completedBatch) { _, _ in
            if let close { close.perform() } else { dismiss() }
        }
        .opacity(owner.current ? 1 : 0).accessibilityHidden(!owner.current)
        .onChange(of: owner.current) { _, current in
            if !current {
                owner.suspend()
                dismiss()
            }
        }
    }
}
