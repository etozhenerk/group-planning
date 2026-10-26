import SwiftUI

struct MemoriesScreen: View {
    let owner: MemoriesOwner
    @State private var selection = 0
    @State private var grid = false
    @State private var adding = false
    @State private var fullscreen = false
    @State private var reloadID = UUID()
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        GeometryReader { viewport in
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Button {
                        dismiss()
                    } label: {
                        HStack(spacing: 7) {
                            ExperienceIcon(kind: .back, size: 18)
                            Text("Прошедшие встречи")
                        }
                        .designFont(13).foregroundStyle(AppPalette.accent).frame(
                            minHeight: 44)
                    }.accessibilityLabel("Готово")
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
                    Button {
                        adding = true
                    } label: {
                        HStack(spacing: 9) {
                            ExperienceIcon(kind: .plus)
                            Text("Добавить фото")
                        }
                        .designFont(13, weight: .semibold).padding(.horizontal, 13).frame(
                            minHeight: 44
                        )
                        .foregroundStyle(AppPalette.actionText).background(
                            AppPalette.action, in: RoundedRectangle(cornerRadius: 13))
                    }.padding(.top, 18)
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
            }.background(AppPalette.background)
        }.safeAreaInset(edge: .top, spacing: 0) { ServicePageHeader() }

            .toolbar(.hidden, for: .navigationBar)
            .task(id: reloadID) { await owner.load() }
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
    }
}
