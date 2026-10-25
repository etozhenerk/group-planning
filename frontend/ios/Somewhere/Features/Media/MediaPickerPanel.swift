import PhotosUI
import SwiftUI
import UniformTypeIdentifiers

struct MediaPickerPanel: View {
    @Bindable var owner: MediaTransferOwner
    var photosOnly = false
    @State private var photos: [PhotosPickerItem] = []
    @State private var importing = false
    @State private var choosingPhotos = false
    @State private var selecting = false
    @State private var selectionError: String?
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Button {
                    dismiss()
                } label: {
                    HStack(spacing: 7) {
                        ExperienceIcon(kind: .back, size: 18)
                        Text("Назад")
                    }
                    .designFont(13).frame(minHeight: 44)
                }.accessibilityLabel("Готово").disabled(owner.busy)
                Text(photosOnly ? "Отправить фото" : "Отправить файл")
                    .designFont(28, weight: .bold).tracking(-0.9).padding(.bottom, 24)
                VStack(alignment: .leading, spacing: 20) {
                    if selecting { ProgressView("Подготавливаем файлы…") }
                    if let problem = selectionError ?? owner.problem {
                        Text(problem).designFont(12).foregroundStyle(AppPalette.error)
                        Button("Повторить проверку") { Task { await owner.loadLimits() } }
                    }
                    if photosOnly {
                        LazyVGrid(
                            columns: [GridItem(.flexible()), GridItem(.flexible())],
                            alignment: .leading, spacing: 16
                        ) {
                            ForEach(owner.pending) { file in
                                MediaPreviewItem(file: file, owner: owner)
                            }
                        }
                    } else {
                        ForEach(owner.pending) { file in MediaPreviewItem(file: file, owner: owner)
                        }
                    }
                    Text("Видно участникам встречи").designFont(12).foregroundStyle(
                        AppPalette.muted)
                    HStack(spacing: 12) {
                        Button {
                            if photosOnly { choosingPhotos = true } else { importing = true }
                        } label: {
                            HStack(spacing: 9) {
                                ExperienceIcon(kind: .plus)
                                Text("Выбрать ещё")
                            }
                            .designFont(14, weight: .semibold).padding(.horizontal, 15)
                            .frame(minHeight: 47)
                            .overlay {
                                RoundedRectangle(cornerRadius: 13).stroke(
                                    .white.opacity(0.125), lineWidth: 1)
                            }
                        }.accessibilityLabel(photosOnly ? "Выбрать фото" : "Выбрать файл").disabled(
                            selecting || owner.busy)
                        Spacer(minLength: 0)
                        if owner.pending.contains(where: { $0.stage == .ready }) {
                            Button(action: owner.send) {
                                Group {
                                    if owner.busy { ProgressView() } else { Text("Отправить") }
                                }
                                .designFont(14, weight: .semibold).padding(.horizontal, 18)
                                .frame(minHeight: 47)
                                .foregroundStyle(AppPalette.actionText).background(
                                    AppPalette.action, in: RoundedRectangle(cornerRadius: 13))
                            }.disabled(owner.busy)
                        }
                    }
                }.padding(20).background(AppPalette.surface, in: RoundedRectangle(cornerRadius: 22))
                if let limits = owner.limits {
                    Text(
                        "До \(limits.maxFiles) файлов. Фото — до \(limits.maxPhotoBytes / 1024 / 1024) МБ, файлы — до \(limits.maxFileBytes / 1024 / 1024) МБ."
                    )
                    .designFont(11).foregroundStyle(AppPalette.muted).padding(.top, 24)
                }
            }.padding(.horizontal, 20).padding(.top, 28).padding(.bottom, 28)
        }.background(AppPalette.background).safeAreaInset(edge: .top, spacing: 0) {
            ServicePageHeader()
        }

        .interactiveDismissDisabled(owner.busy)
        .task {
            await owner.loadLimits()
            owner.pending.removeAll { $0.stage == .published }
            if owner.pending.isEmpty {
                if photosOnly { choosingPhotos = true } else { importing = true }
            }
        }
        .opacity(owner.current ? 1 : 0).accessibilityHidden(!owner.current)
        .onChange(of: owner.current) { _, current in
            if !current {
                owner.suspend()
                dismiss()
            }
        }
        .photosPicker(
            isPresented: $choosingPhotos, selection: $photos,
            maxSelectionCount: owner.limits?.maxFiles ?? 10, matching: .images
        )
        .task(id: photos) {
            guard !photos.isEmpty else { return }
            selecting = true
            selectionError = nil
            defer { selecting = false }
            var files: [PendingMedia] = []
            do {
                for item in photos {
                    guard let data = try await item.loadTransferable(type: Data.self) else {
                        throw ClientFailure.invalidResponse
                    }
                    try Task.checkCancellation()
                    files.append(try MediaSelection.photo(data))
                }
                await owner.add(files)
                photos = []
            } catch {
                if !(error is CancellationError) {
                    selectionError = "Не удалось открыть фото. Выберите его ещё раз."
                }
            }
        }
        .fileImporter(
            isPresented: $importing, allowedContentTypes: [.data], allowsMultipleSelection: true
        ) { result in
            do {
                let files = try result.get().map(MediaSelection.file)
                Task { await owner.add(files) }
            } catch {
                selectionError = "Не удалось открыть файл. Проверьте его размер и доступ."
            }
        }
    }
}
