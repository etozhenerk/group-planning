import PhotosUI
import SwiftUI
import UniformTypeIdentifiers

/// The system picker belongs to the source screen, before any preview sheet exists.
struct MediaSelectionPresenter: ViewModifier {
    let owner: MediaTransferOwner
    @Binding var kind: MediaPickerKind?
    let selected: () -> Void
    @State private var photos: [PhotosPickerItem] = []
    @State private var selectionReady = false
    @State private var selectionProblem: String?

    func body(content: Content) -> some View {
        content
            .photosPicker(
                isPresented: presented(.photos), selection: $photos,
                maxSelectionCount: owner.limits?.maxFiles ?? 10, matching: .images,
                preferredItemEncoding: .compatible
            )
            .fileImporter(
                isPresented: presented(.files), allowedContentTypes: [.data],
                allowsMultipleSelection: true
            ) { result in
                Task {
                    do {
                        let urls = try result.get()
                        guard !urls.isEmpty else { return }
                        let files = try await MediaFileReader.read(urls)
                        await accept(files)
                    } catch {
                        if (error as? CocoaError)?.code != .userCancelled {
                            selectionProblem =
                                "Не удалось открыть файл. Проверьте его размер и доступ."
                        }
                    }
                }
            }
            .task(id: photos) {
                guard !photos.isEmpty else { return }
                do {
                    var files: [PendingMedia] = []
                    for item in photos {
                        guard let data = try await item.loadTransferable(type: Data.self) else {
                            throw ClientFailure.invalidResponse
                        }
                        try Task.checkCancellation()
                        files.append(try MediaSelection.photo(data))
                    }
                    await accept(files)
                    photos = []
                } catch {
                    if !(error is CancellationError) {
                        selectionProblem = "Не удалось открыть фото. Выберите его ещё раз."
                    }
                }
            }
            .onChange(of: kind) { _, value in
                if value == nil { presentSelection() }
            }
            .alert(
                "Не удалось выбрать вложение",
                isPresented: Binding(
                    get: { selectionProblem != nil }, set: { if !$0 { selectionProblem = nil } }
                )
            ) {
                Button("Понятно", role: .cancel) { selectionProblem = nil }
            } message: {
                Text(selectionProblem ?? "")
            }
    }

    private func presented(_ value: MediaPickerKind) -> Binding<Bool> {
        Binding(get: { kind == value }, set: { if !$0, kind == value { kind = nil } })
    }

    private func accept(_ files: [PendingMedia]) async {
        owner.pending.removeAll { $0.stage == .published }
        let before = owner.pending.count
        await owner.add(files)
        guard owner.current, owner.pending.count > before else {
            selectionProblem = owner.problem
            return
        }
        selectionReady = true
        presentSelection()
    }

    private func presentSelection() {
        guard selectionReady, kind == nil, owner.current else { return }
        selectionReady = false
        selected()
    }
}
