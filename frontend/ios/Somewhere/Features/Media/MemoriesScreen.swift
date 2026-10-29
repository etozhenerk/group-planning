import SwiftUI

struct MemoriesScreen: View {
    let owner: MemoriesOwner
    @State private var selection = 0
    @State private var grid = false
    @State private var adding = false
    @State private var picker: MediaPickerKind?
    @State private var fullscreen = false
    @State private var reloadID = UUID()
    @Environment(\.dismiss) private var dismiss
    @Environment(\.scenePhase) private var scenePhase
    var body: some View {
        GeometryReader { viewport in
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    PageBackButton { dismiss() }.accessibilityIdentifier("memories-back")
                    if owner.current, let meeting = owner.meeting {
                        Text(
                            ExperienceDate.label(
                                meeting.startsAt, day: meeting.startsOn, timezone: meeting.timezone)
                                + (meeting.place.map { " · " + $0 } ?? "")
                        )
                        .designFont(13).foregroundStyle(AppPalette.muted).frame(minHeight: 19.5)
                        .padding(.top, 8)
                        Text(meeting.title).designFont(29, weight: .bold).tracking(-0.9).frame(
                            minHeight: 36.25
                        )
                        .padding(.top, 8).accessibilityAddTraits(.isHeader)
                    }
                    AlbumActions(owner: owner.albumSave, hasPhotos: !owner.photos.isEmpty) {
                        picker = .photos
                    }.padding(.top, DesignTokens.spaceS16)
                    if owner.current {
                        if owner.failed {
                            StatusView(
                                title: "Не удалось загрузить вайб", retry: { reloadID = UUID() })
                        } else if !owner.loaded {
                            RoundedRectangle(cornerRadius: 20).fill(AppPalette.surface).frame(
                                height: 300
                            ).padding(.top, 32).accessibilityLabel("Загрузка фото")
                        }
                        if owner.loaded && owner.photos.isEmpty {
                            StatusView(
                                title: "Как всё прошло?", text: "Добавьте фотографии встречи."
                            ).padding(.vertical, 50)
                        }
                        if !owner.photos.isEmpty {
                            if grid {
                                LazyVGrid(columns: [GridItem(.adaptive(minimum: 100))], spacing: 10)
                                {
                                    ForEach(Array(owner.photos.enumerated()), id: \.element.id) {
                                        index, photo in
                                        Button {
                                            selection = index
                                            fullscreen = true
                                        } label: {
                                            PrivatePhotoView(media: photo, session: owner.session)
                                                .frame(height: 120)
                                                .clipShape(RoundedRectangle(cornerRadius: 12))
                                        }.accessibilityLabel("Открыть фото \(index + 1)")
                                    }
                                }.padding(.top, 28)
                            } else {
                                MemoryPhotoStack(owner: owner, selection: $selection) {
                                    fullscreen = true
                                }
                                .frame(
                                    height: min(500, max(340, (viewport.size.height + 51) * 0.51))
                                )
                                .padding(.horizontal, -8)
                            }
                            HStack(spacing: 12) {
                                Spacer()
                                Text(
                                    "\(min(selection + 1, owner.photos.count)) / \(owner.photos.count)"
                                )
                                .designFont(12).foregroundStyle(AppPalette.muted)
                                .accessibilityLabel(
                                    "\(min(selection + 1, owner.photos.count)) из \(owner.photos.count)"
                                )
                                Button {
                                    grid.toggle()
                                } label: {
                                    ExperienceIcon(kind: grid ? .photo : .grid, size: 18)
                                        .frame(width: 36, height: 36)
                                        .contentShape(Rectangle().inset(by: -4))
                                }.accessibilityLabel(grid ? "Показать стопкой" : "Показать сеткой")
                                Spacer()
                            }.padding(.top, grid ? 12 : -6)
                        }
                        if owner.nextCursor != nil {
                            Button("Загрузить ещё") { Task { await owner.load(more: true) } }
                                .disabled(owner.loading).padding(.top, 20)
                        }
                    }
                }.padding(.horizontal, 20).padding(.top, 28).padding(.bottom, 28)
            }.background(AppPalette.background).accessibilityIdentifier("memories-scroll")
        }

        .toolbar(.hidden, for: .navigationBar)
        .task(id: reloadID) { await owner.load() }
        .task(id: "\(selection)-\(owner.photos.count)") {
            await owner.prefetch(around: selection)
        }
        .modifier(
            MediaSelectionPresenter(
                owner: owner.transfer, kind: $picker, selected: { adding = true })
        )
        .sheet(isPresented: $adding, onDismiss: { reloadID = UUID() }) {
            MediaPickerPanel(owner: owner.transfer, photosOnly: true)

        }
        .fullScreenCover(isPresented: $fullscreen) {
            MemoryFullscreen(owner: owner, selection: $selection)
        }
        .onChange(of: owner.current) { _, current in
            if !current {
                owner.clear()
                dismiss()
            }
        }
        .onDisappear { owner.albumSave.suspend() }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active { owner.albumSave.permissionMayHaveChanged() }
        }
    }
}
