import SwiftUI

struct MemoryPhotoStack: View {
    let owner: MemoriesOwner
    @Binding var selection: Int
    let open: () -> Void
    @State private var translation: CGFloat = 0
    @State private var aspects: [UUID: CGFloat] = [:]
    @State private var flight: Task<Void, Never>?
    @State private var motionID = UUID()
    @State private var reassembling = false
    @State private var failedTarget: Int?
    @State private var failedSide: CGFloat = -1
    @State private var failedPhotos: Set<UUID> = []
    @State private var retryID = UUID()
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                if owner.current, owner.photos.indices.contains(selection) {
                    if knownAspect(owner.photos[selection]) == nil {
                        if failedPhotos.contains(owner.photos[selection].id) {
                            StatusView(
                                title: "Не удалось загрузить фото",
                                retry: {
                                    failedPhotos.remove(owner.photos[selection].id)
                                    retryID = UUID()
                                })
                        } else {
                            ProgressView().accessibilityLabel("Загрузка фото")
                        }
                    }
                    ForEach(visiblePhotos.reversed()) { photo in
                        let rank =
                            (owner.photos.firstIndex { $0.id == photo.id } ?? selection) - selection
                        picture(photo)
                            .frame(
                                width: width(photo, in: geometry.size),
                                height: height(photo, in: geometry.size)
                            )
                            .overlay {
                                if rank == 0 {
                                    PhotoStackTouch(
                                        changed: { if flight == nil { translation = $0 } },
                                        ended: { distance in
                                            if abs(distance) > 60 {
                                                swipe(
                                                    side: distance < 0 ? -1 : 1,
                                                    width: geometry.size.width)
                                            } else {
                                                returnToRest()
                                            }
                                        }, open: { if flight == nil { open() } })
                                }
                            }
                            .rotationEffect(.degrees(angle(rank)))
                            .offset(x: rank == 0 && !reduceMotion ? translation : 0)
                            .opacity(
                                reassembling || knownAspect(photo) == nil
                                    || knownAspect(owner.photos[selection]) == nil
                                    ? 0 : rank == 0 ? 1 : rank == 1 ? 0.85 : 0.75
                            )
                            .allowsHitTesting(rank == 0 && knownAspect(photo) != nil)
                            .zIndex(Double(owner.photos.count - selection - rank))
                            .transition(.identity)
                            .accessibilityElement(children: .ignore)
                            .accessibilityLabel("Открыть фото \(selection + 1)")
                            .accessibilityAddTraits(.isButton)
                            .accessibilityHidden(rank != 0 || knownAspect(photo) == nil)
                            .accessibilityAction { if flight == nil { open() } }
                    }
                }
            }.frame(width: geometry.size.width, height: geometry.size.height)
                .contentShape(Rectangle()).focusable()
                .accessibilityValue("Фото \(selection + 1) из \(owner.photos.count)")
                .accessibilityAdjustableAction {
                    keyboardStep($0 == .increment ? 1 : -1, width: geometry.size.width)
                }
                .onKeyPress(.leftArrow) {
                    keyboardStep(-1, width: geometry.size.width)
                    return .handled
                }
                .onKeyPress(.rightArrow) {
                    keyboardStep(1, width: geometry.size.width)
                    return .handled
                }
                .overlay(alignment: .bottom) {
                    if let failedTarget {
                        StatusView(
                            title: "Не удалось загрузить фото",
                            retry: {
                                begin(
                                    target: failedTarget, side: failedSide,
                                    width: geometry.size.width)
                            }
                        )
                        .padding(DesignTokens.spaceS12)
                        .background(
                            AppPalette.background,
                            in: RoundedRectangle(cornerRadius: DesignTokens.radiusCard)
                        )
                        .padding(.horizontal, DesignTokens.spaceS20)
                    }
                }
        }.onDisappear {
            motionID = UUID()
            flight?.cancel()
            flight = nil
            translation = 0
            reassembling = false
        }
    }

    private var visiblePhotos: [MeetingMedia] {
        Array(owner.photos.dropFirst(max(0, selection)).prefix(3))
    }

    private func angle(_ rank: Int) -> Double {
        guard !reduceMotion, !reassembling else { return 0 }
        return rank == 0 ? -1.5 + Double(translation / 30) : rank == 1 ? 7 : -9
    }

    private func picture(_ photo: MeetingMedia) -> some View {
        PrivatePhotoView(
            media: photo, session: owner.session,
            onAspect: { aspect in
                if aspects[photo.id] == nil { aspects[photo.id] = aspect }
                failedPhotos.remove(photo.id)
            }, onFailure: { failedPhotos.insert(photo.id) }, retryID: retryID
        ).id(photo.id)
            .clipShape(RoundedRectangle(cornerRadius: 7)).padding(5)
            .background(Color(designHex: 0xe4ded4), in: RoundedRectangle(cornerRadius: 12))
            .shadow(color: .black.opacity(0.33), radius: 25, y: 20)
    }

    private func knownAspect(_ photo: MeetingMedia) -> CGFloat? {
        if let known = aspects[photo.id] { return known }
        if let size = owner.session.privateData.mediaCache.displaySize(photo.id), size.height > 0 {
            return size.width / size.height
        }
        return nil
    }

    private func width(_ photo: MeetingMedia, in size: CGSize) -> CGFloat {
        (knownAspect(photo) ?? 1.4) < 1
            ? min(size.width * 0.78, size.height * 0.88 * 2 / 3) : size.width * 0.88
    }

    private func height(_ photo: MeetingMedia, in size: CGSize) -> CGFloat {
        size.height * ((knownAspect(photo) ?? 1.4) < 1 ? 0.88 : 0.77)
    }

    private func returnToRest() {
        withAnimation(
            reduceMotion ? nil : .easeOut(duration: DesignTokens.motionDurationNavigation)
        ) {
            translation = 0
        }
    }

    private func swipe(side: CGFloat, width: CGFloat) {
        begin(
            target: MediaPhotoNavigation.nextInStack(from: selection, count: owner.photos.count),
            side: side, width: width)
    }

    private func keyboardStep(_ delta: Int, width: CGFloat) {
        begin(
            target: MediaPhotoNavigation.index(
                from: selection, delta: delta, count: owner.photos.count), side: delta > 0 ? -1 : 1,
            width: width)
    }

    private func begin(target: Int, side: CGFloat, width: CGFloat) {
        guard flight == nil else { return }
        guard owner.photos.count > 1, owner.photos.indices.contains(target), target != selection
        else {
            returnToRest()
            return
        }
        let version = UUID()
        motionID = version
        failedTarget = nil
        let restarting = selection == owner.photos.count - 1 && target == 0
        flight = Task { @MainActor in
            defer { if motionID == version { flight = nil } }
            let photo = owner.photos[target]
            let prepared = MediaContentOwner(media: photo, session: owner.session)
            if prepared.image == nil { returnToRest() }
            await prepared.load()
            guard !Task.isCancelled, owner.current, motionID == version else { return }
            guard let image = prepared.image, image.size.height > 0 else {
                failedTarget = target
                failedSide = side
                returnToRest()
                return
            }
            aspects[photo.id] = image.size.width / image.size.height
            if reduceMotion {
                selection = target
                translation = 0
                return
            }
            withAnimation(.easeOut(duration: DesignTokens.motionDurationPhoto)) {
                translation = side * width
            }
            do { try await Task.sleep(for: .seconds(DesignTokens.motionDurationPhoto)) } catch {
                return
            }
            guard owner.current, motionID == version else { return }
            if restarting {
                var transaction = Transaction()
                transaction.disablesAnimations = true
                withTransaction(transaction) {
                    reassembling = true
                    selection = target
                    translation = 0
                }
                // Present the collapsed deck before its existing card angles fan out.
                do { try await Task.sleep(for: .milliseconds(16)) } catch { return }
                withAnimation(.easeOut(duration: DesignTokens.motionDurationPhoto)) {
                    reassembling = false
                }
            } else {
                withAnimation(.easeOut(duration: DesignTokens.motionDurationPhoto)) {
                    selection = target
                    translation = 0
                }
            }
            do { try await Task.sleep(for: .seconds(DesignTokens.motionDurationPhoto)) } catch {
                return
            }
        }
    }
}
