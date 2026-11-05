import PhotosUI
import SwiftUI

struct CoverEditor: View {
    let value: CoverDraft?
    var original: URL?
    var meetingID: UUID?
    var session: SessionStore?
    var compact = false
    var creation = false
    let disabled: Bool
    let onBusy: (Bool) -> Void
    let onChange: (CoverDraft) -> Void
    @Environment(\.coverSelectionSource) private var source
    @State private var owner = CoverSelectionOwner()
    @State private var picker = false
    @State private var item: PhotosPickerItem?

    private var hasPhoto: Bool { value?.image != nil || (value == nil && original != nil) }

    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.componentMeetingSettingsCoverGap) {
            if creation {
                HStack(spacing: DesignTokens.spaceS16) {
                    preview.frame(
                        width: DesignTokens.componentMobileCreationCoverSize,
                        height: DesignTokens.componentMobileCreationCoverSize
                    )
                    .clipped().clipShape(RoundedRectangle(cornerRadius: DesignTokens.spaceS16))
                    .overlay {
                        RoundedRectangle(cornerRadius: DesignTokens.spaceS16)
                            .stroke(DesignTokens.colorBorderStrong, lineWidth: DesignTokens.spaceS1)
                    }
                    VStack(alignment: .leading, spacing: DesignTokens.spaceS3) {
                        Text("Обложка").designFont(DesignTokens.typographySizeSmall)
                        Text("необязательно").designFont(DesignTokens.typographySizeLabel)
                            .foregroundStyle(DesignTokens.colorMuted)
                        ViewThatFits(in: .horizontal) {
                            HStack(spacing: DesignTokens.spaceS8) { creationControls }
                            VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
                                creationControls
                            }
                        }
                    }.frame(maxWidth: .infinity, alignment: .leading)
                }
                .padding(DesignTokens.spaceS12 + DesignTokens.spaceS2)
                .background(
                    DesignTokens.colorSurface,
                    in: RoundedRectangle(cornerRadius: DesignTokens.radiusCard)
                )
                .overlay {
                    RoundedRectangle(cornerRadius: DesignTokens.radiusCard)
                        .stroke(DesignTokens.colorLine, lineWidth: DesignTokens.spaceS1)
                }
            } else if compact {
                HStack(spacing: DesignTokens.componentMeetingSettingsCoverGap) {
                    Group {
                        if hasPhoto {
                            Button(action: selectPhoto) { preview.contentShape(Rectangle()) }
                                .buttonStyle(.plain).accessibilityLabel("Заменить обложку")
                                .accessibilityIdentifier("cover-select")
                        } else {
                            preview
                        }
                    }.frame(
                        width: DesignTokens.componentMeetingSettingsCoverSize,
                        height: DesignTokens.componentMeetingSettingsCoverSize
                    )
                    .clipped().clipShape(
                        RoundedRectangle(
                            cornerRadius: DesignTokens.componentMeetingSettingsCoverRadius))
                    VStack(alignment: .leading, spacing: DesignTokens.spaceS2) {
                        Text("Обложка").designFont(
                            DesignTokens.typographySizeSmall, weight: .medium)
                        Text(hasPhoto ? "Фото встречи" : "Не добавлена").designFont(
                            DesignTokens.typographySizeLabel
                        )
                        .foregroundStyle(DesignTokens.colorMuted)
                    }
                    Spacer(minLength: DesignTokens.spaceS0)
                    if hasPhoto {
                        Button("Убрать") {
                            owner.remove()
                            onChange(.removed)
                        }.frame(minHeight: DesignTokens.targetIos).accessibilityIdentifier(
                            "cover-remove")
                    } else {
                        Button("Добавить", action: selectPhoto).frame(
                            minHeight: DesignTokens.targetIos
                        )
                        .accessibilityIdentifier("cover-select")
                    }
                }.designFont(DesignTokens.typographySizeSmall).disabled(disabled || owner.busy)
            } else {
                Text("Обложка").font(.headline)
                if owner.busy || hasPhoto { preview }
                ViewThatFits(in: .horizontal) {
                    HStack { controls }
                    VStack(alignment: .leading) { controls }
                }
            }
            if let problem = owner.problem {
                Text(problem).foregroundStyle(DesignTokens.colorError).accessibilityIdentifier(
                    "cover-error")
            }
        }
        .photosPicker(
            isPresented: $picker, selection: $item, matching: .images,
            preferredItemEncoding: .compatible
        )
        .onChange(of: item) { _, selected in
            guard let selected else { return }
            item = nil
            owner.start(
                load: { try await selected.loadTransferable(type: PickedCover.self)?.image },
                onBusy: onBusy, commit: onChange)
        }
        .onDisappear {
            owner.cancel()
            onBusy(false)
        }
    }

    @ViewBuilder private var preview: some View {
        if owner.busy {
            CoverSkeleton().aspectRatio(16.0 / 9.0, contentMode: .fit)
        } else if let image = value?.image {
            CoverImageView(
                source: .prepared(image), thumbnail: compact,
                thumbnailSize: creation
                    ? DesignTokens.componentMobileCreationCoverSize
                    : DesignTokens.componentMeetingSettingsCoverSize,
                settingsThumbnail: compact)
        } else if value == nil, let original, let meetingID {
            CoverImageView(
                source: .remote(original, meetingID), api: session?.api, session: session,
                thumbnail: compact,
                thumbnailSize: creation
                    ? DesignTokens.componentMobileCreationCoverSize
                    : DesignTokens.componentMeetingSettingsCoverSize,
                settingsThumbnail: compact)
        } else {
            Image(systemName: creation ? "photo.badge.plus" : "photo")
                .font(
                    .system(
                        size: creation
                            ? DesignTokens.componentMobileCreationCoverIconSize
                            : DesignTokens.componentMobileFieldIconSize)
                )
                .foregroundStyle(creation ? DesignTokens.colorAccent : DesignTokens.colorMuted)
                .frame(maxWidth: .infinity, maxHeight: .infinity).background(
                    DesignTokens.colorBackground)
        }
    }

    @ViewBuilder private var creationControls: some View {
        Button(action: selectPhoto) {
            Label(hasPhoto ? "Заменить" : "Добавить фото", systemImage: "photo.badge.plus")
                .designFont(DesignTokens.typographySizeCaption, weight: .medium)
                .frame(minHeight: DesignTokens.targetIos)
        }.accessibilityIdentifier("cover-select").disabled(disabled || owner.busy)
        if hasPhoto {
            Button("Убрать фото") {
                owner.remove()
                onChange(.removed)
            }
            .designFont(DesignTokens.typographySizeCaption, weight: .medium)
            .frame(minHeight: DesignTokens.targetIos)
            .accessibilityIdentifier("cover-remove").disabled(disabled || owner.busy)
        }
    }

    @ViewBuilder private var controls: some View {
        Button(action: selectPhoto) {
            Label(hasPhoto ? "Заменить фото" : "Добавить фото", systemImage: "photo.badge.plus")
                .designFont(DesignTokens.typographySizeButton, weight: .semibold)
                .frame(maxWidth: .infinity, minHeight: DesignTokens.componentButtonMinimumHeight)
                .foregroundStyle(DesignTokens.colorActionText)
                .background(
                    DesignTokens.colorAction,
                    in: RoundedRectangle(
                        cornerRadius: DesignTokens.componentButtonRadius))
        }.accessibilityIdentifier("cover-select").disabled(
            disabled || owner.busy)
        if hasPhoto {
            Button("Убрать фото") {
                owner.remove()
                onChange(.removed)
            }
            .frame(minHeight: DesignTokens.targetIos).accessibilityIdentifier("cover-remove")
            .disabled(disabled || owner.busy)
        }
    }

    private func selectPhoto() {
        if let source {
            owner.start(load: { try await source.select() }, onBusy: onBusy, commit: onChange)
        } else {
            picker = true
        }
    }
}
