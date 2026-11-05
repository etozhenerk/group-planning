import SwiftUI

struct MemoriesScreen: View {
    let owner: MemoriesOwner
    @State private var selection = 0
    @State private var grid = false
    @State private var adding = false
    @State private var fullscreen = false
    @State private var reloadID = UUID()
    @Environment(\.dismiss) private var dismiss
    @Environment(\.scenePhase) private var scenePhase
    var body: some View {
        GeometryReader { viewport in
            let height =
                viewport.size.height + viewport.safeAreaInsets.top + viewport.safeAreaInsets.bottom
            ScrollView {
                VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
                    VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
                        HStack {
                            PageBackButton { dismiss() }.accessibilityIdentifier("memories-back")
                            Spacer(minLength: DesignTokens.spaceS12)
                            if owner.current && !owner.photos.isEmpty {
                                AlbumViewControls(
                                    selection: selection, count: owner.photos.count, grid: $grid)
                            }
                        }.padding(.bottom, DesignTokens.componentMobileVibeNavBottomGap)
                        Text(
                            owner.current ? owner.meeting?.title ?? "Вайб встречи" : "Вайб встречи"
                        )
                        .designTokenFont(
                            DesignTokens.typographySizeHeading,
                            weight: DesignTokens.componentMobileVibeTitleWeight, relativeTo: .title
                        )
                        .tracking(-DesignTokens.componentMobileVibeTitleTracking).fixedSize(
                            horizontal: false, vertical: true
                        ).accessibilityAddTraits(.isHeader)
                        .padding(.bottom, DesignTokens.spaceS8)
                        if owner.current, let meeting = owner.meeting {
                            Text(
                                ExperienceDate.label(
                                    meeting.startsAt, day: meeting.startsOn,
                                    timezone: meeting.timezone, clock: false)
                                    + (meeting.place.map { " · " + $0 } ?? "")
                            )
                            .designFont(DesignTokens.typographySizeSmall).foregroundStyle(
                                DesignTokens.colorMuted
                            ).padding(.bottom, DesignTokens.spaceS24)
                        }
                        if owner.current {
                            AlbumActions(owner: owner.albumSave, hasPhotos: !owner.photos.isEmpty) {
                                adding = true
                            }
                        }
                    }.padding(.horizontal, DesignTokens.spaceS20)
                    if !owner.current {
                        VibeAlbumState(kind: .denied)
                    } else if owner.failed && owner.photos.isEmpty {
                        VibeAlbumState(kind: .error, retry: { reloadID = UUID() })
                    } else if !owner.loaded {
                        VibeAlbumState(kind: .loading)
                    } else if owner.photos.isEmpty {
                        VibeAlbumState(kind: .empty)
                    } else {
                        if grid {
                            LazyVGrid(
                                columns: [GridItem(.flexible()), GridItem(.flexible())],
                                spacing: DesignTokens.spaceS10
                            ) {
                                ForEach(Array(owner.photos.enumerated()), id: \.element.id) {
                                    index, photo in
                                    Button {
                                        selection = index
                                        fullscreen = true
                                    } label: {
                                        PrivatePhotoView(media: photo, session: owner.session)
                                            .aspectRatio(1, contentMode: .fit)
                                            .clipShape(
                                                RoundedRectangle(
                                                    cornerRadius: DesignTokens.radiusCover))
                                    }.accessibilityLabel("Открыть фото \(index + 1)")
                                }
                            }.padding(.horizontal, DesignTokens.spaceS20).padding(
                                .top, (DesignTokens.spaceS24 + DesignTokens.spaceS4))
                        } else {
                            MemoryPhotoStack(owner: owner, selection: $selection) {
                                fullscreen = true
                            }
                            .frame(height: deckHeight(height)).padding(
                                .horizontal, DesignTokens.spaceS12
                            ).padding(.top, DesignTokens.spaceS12)
                        }
                        if owner.failed {
                            Button("Повторить загрузку") { reloadID = UUID() }.frame(
                                minHeight: DesignTokens.targetIos
                            ).padding(.horizontal, DesignTokens.spaceS20)
                        }
                        if owner.nextCursor != nil {
                            Button("Загрузить ещё") { Task { await owner.load(more: true) } }
                                .disabled(owner.loading).padding(.top, DesignTokens.spaceS20)
                        }
                    }
                }.padding(.bottom, DesignTokens.spaceS32)
            }.background(DesignTokens.colorBackground).accessibilityIdentifier("memories-scroll")
        }
        .toolbar(.hidden, for: .navigationBar).task(id: reloadID) { await owner.load() }
        .task(id: "\(selection)-\(owner.photos.count)") { await owner.prefetch(around: selection) }
        .sheet(isPresented: $adding, onDismiss: { reloadID = UUID() }) {
            MemoryAlbumUploadPanel(owner: owner.transfer)
        }
        .fullScreenCover(isPresented: $fullscreen) {
            MemoryFullscreen(owner: owner, selection: $selection)
        }
        .onChange(of: owner.current) { _, current in
            if !current {
                owner.clear()
                fullscreen = false
                adding = false
            }
        }
        .onChange(of: owner.photos.count) { _, count in
            selection = min(selection, max(0, count - 1))
        }
        .onDisappear { owner.albumSave.suspend() }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active { owner.albumSave.permissionMayHaveChanged() }
        }
    }
    private func deckHeight(_ height: CGFloat) -> CGFloat {
        height < DesignTokens.componentMobileVibeCompactHeightBoundary
            ? DesignTokens.componentMobileVibeCompactDeckHeight
            : max(
                DesignTokens.componentMobileVibeDeckMinimumHeight,
                min(
                    DesignTokens.componentMobileVibeDeckHeightMaximum,
                    max(
                        DesignTokens.componentMobileVibeDeckHeightMinimum,
                        height * CGFloat(DesignTokens.componentMobileVibeDeckViewportRatio))))
    }
}
