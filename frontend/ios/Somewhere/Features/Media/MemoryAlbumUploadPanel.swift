import SwiftUI

struct MemoryAlbumUploadPanel: View {
    let owner: MediaTransferOwner
    @State private var picker: MediaPickerKind?
    @Environment(\.dismiss) private var dismiss
    private var selected: [PendingMedia] { owner.pending.filter { $0.stage != .published } }
    var body: some View {
        ActionFormSheet(
            title: "Добавить фото в альбом", dismissDisabled: owner.busy,
            scrollIdentifier: "media-picker-scroll", headerIdentifier: "media-picker-header"
        ) {
            VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
                if selected.isEmpty {
                    VStack(spacing: DesignTokens.componentMobileVibeNavBottomGap) {
                        Image(systemName: "photo.on.rectangle.angled").font(
                            .system(size: DesignTokens.componentMobileVibeUploadEmptyIcon)
                        ).foregroundStyle(DesignTokens.colorAccent)
                        Text("Фото с вашей встречи").designFont(
                            DesignTokens.componentMobileVibeUploadEmptyTitle, weight: .semibold)
                        Text("Выберите снимки — их увидят участники.").designFont(
                            DesignTokens.typographySizeSmall
                        ).foregroundStyle(DesignTokens.colorMuted).frame(
                            maxWidth: DesignTokens.componentMobileVibeUploadEmptyTextMaximumWidth)
                    }.multilineTextAlignment(.center).frame(maxWidth: .infinity).padding(
                        .top, DesignTokens.spaceS16
                    ).padding(.bottom, DesignTokens.spaceS24).padding(
                        .horizontal, DesignTokens.spaceS8)
                } else {
                    Text(
                        (owner.pending.contains { $0.stage == .published }
                            ? "Не добавлено фото: " : "Выбрано фото: ") + String(selected.count)
                    )
                    .designFont(DesignTokens.typographySizeSmall).foregroundStyle(
                        DesignTokens.colorMuted
                    ).padding(.bottom, DesignTokens.spaceS6)
                    MediaPhotoSelection(
                        owner: owner, width: DesignTokens.componentMobileVibeUploadPhotoWidth,
                        height: DesignTokens.componentMobileVibeUploadPhotoHeight,
                        cornerRadius: DesignTokens.componentMobileVibePhotoRadius,
                        outset: DesignTokens.spaceS10
                    )
                    .padding(.top, DesignTokens.spaceS2).padding(.bottom, DesignTokens.spaceS4)
                }
                Button {
                    picker = .photos
                } label: {
                    Label(selected.isEmpty ? "Выбрать фото" : "Выбрать ещё", systemImage: "plus")
                        .designFont(DesignTokens.typographySizeButton)
                        .frame(
                            maxWidth: .infinity,
                            minHeight: DesignTokens.componentMobileVibeActionMinimumHeight
                        )
                        .background(
                            DesignTokens.colorBackground,
                            in: RoundedRectangle(
                                cornerRadius: DesignTokens.componentMobileVibeActionRadius)
                        )
                        .overlay(
                            RoundedRectangle(
                                cornerRadius: DesignTokens.componentMobileVibeActionRadius
                            ).stroke(
                                DesignTokens.colorBorderStrong, lineWidth: DesignTokens.spaceS1))
                }.buttonStyle(.plain).disabled(owner.busy).padding(.top, DesignTokens.spaceS10)
                    .accessibilityLabel("Выбрать фото")
                if !selected.isEmpty {
                    Text("Видно участникам встречи").designFont(DesignTokens.typographySizeCaption)
                        .foregroundStyle(DesignTokens.colorMuted).padding(
                            .top, DesignTokens.spaceS16)
                }
                VStack(alignment: .leading, spacing: DesignTokens.componentMobileVibeNavBottomGap) {
                    if let problem = owner.problem {
                        HStack(alignment: .top, spacing: DesignTokens.spaceS10) {
                            Image(systemName: "exclamationmark.triangle").foregroundStyle(
                                DesignTokens.colorError)
                            Text(problem).designFont(DesignTokens.typographySizeCaption)
                                .foregroundStyle(DesignTokens.colorMuted)
                        }.accessibilityIdentifier("media-upload-error")
                        if owner.limits == nil {
                            Button("Попробовать снова") { Task { await owner.loadLimits() } }.frame(
                                minHeight: DesignTokens.targetIos)
                        }
                    }
                    ActionFormButton(
                        title: owner.problem != nil ? "Повторить отправку" : "Добавить в альбом",
                        busy: owner.busy,
                        minimumHeight: DesignTokens.componentMobileVibeActionMinimumHeight,
                        cornerRadius: DesignTokens.componentMobileVibeActionRadius,
                        action: owner.send
                    )
                    .disabled(
                        !owner.canSend
                            || selected.contains { $0.stage == .failed && $0.problem != nil }
                    ).accessibilityIdentifier("media-batch-send")
                }.padding(.top, DesignTokens.spaceS20)
            }
        }
        .modifier(MediaSelectionPresenter(owner: owner, kind: $picker, selected: {}))
        .task { await owner.loadLimits() }.onChange(of: owner.completedBatch) { _, _ in dismiss() }
        .onChange(of: owner.current) { _, current in
            if !current {
                owner.suspend()
                dismiss()
            }
        }
    }
}
