import PhotosUI
import SwiftUI

struct CoverEditor: View {
    let value: CoverDraft?
    var original: URL?
    var meetingID: UUID?
    var session: SessionStore?
    let disabled: Bool
    let onBusy: (Bool) -> Void
    let onChange: (CoverDraft) -> Void
    @Environment(\.coverSelectionSource) private var source
    @State private var owner = CoverSelectionOwner()
    @State private var picker = false
    @State private var item: PhotosPickerItem?

    private var hasPhoto: Bool { value?.image != nil || (value == nil && original != nil) }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Обложка").font(.headline)
            if owner.busy {
                CoverSkeleton().aspectRatio(16.0 / 9.0, contentMode: .fit)
            } else if let image = value?.image {
                CoverImageView(source: .prepared(image))
            } else if value == nil, let original, let meetingID {
                CoverImageView(
                    source: .remote(original, meetingID), api: session?.api, session: session)
            }
            ViewThatFits(in: .horizontal) {
                HStack { controls }
                VStack(alignment: .leading) { controls }
            }
            if let problem = owner.problem {
                Text(problem).foregroundStyle(AppPalette.error).accessibilityIdentifier(
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

    @ViewBuilder private var controls: some View {
        Button(hasPhoto ? "Заменить" : "Добавить фото") {
            if let source {
                owner.start(load: { try await source.select() }, onBusy: onBusy, commit: onChange)
            } else {
                picker = true
            }
        }.accessibilityIdentifier("cover-select").disabled(disabled || owner.busy)
        if hasPhoto {
            Button("Убрать фото") {
                owner.remove()
                onChange(.removed)
            }
            .accessibilityIdentifier("cover-remove").disabled(disabled || owner.busy)
        }
    }
}
