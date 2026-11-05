import SwiftUI

struct MemoryPhotoStack: View {
    let owner: MemoriesOwner
    @Binding var selection: Int
    let open: () -> Void
    @State private var translation = CGSize.zero
    @State private var flight: Task<Void, Never>?
    @State private var reassembling = false
    @State private var recycled: UUID?
    @State private var failed: Set<UUID> = []
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    var body: some View {
        GeometryReader { geometry in
            let cardWidth =
                geometry.size.width * CGFloat(DesignTokens.componentMobileVibeCardWidthRatio)
            let compact = geometry.size.height <= DesignTokens.componentMobileVibeCompactDeckHeight
            let cardHeight =
                geometry.size.height
                * (compact
                    ? DesignTokens.componentMobileVibeCompactCardHeightRatio
                    : DesignTokens.componentMobileVibeCardHeightRatio)
            ZStack {
                if owner.current, owner.photos.indices.contains(selection) {
                    ForEach(visiblePhotos.reversed()) { photo in
                        let rank =
                            ((owner.photos.firstIndex(where: { $0.id == photo.id }) ?? selection)
                                - selection
                                + owner.photos.count) % owner.photos.count
                        picture(photo).frame(width: cardWidth, height: cardHeight)
                            .overlay {
                                if rank == 0 && !failed.contains(photo.id) {
                                    PhotoStackTouch(
                                        changed: { if flight == nil { translation = $0 } },
                                        ended: { distance, velocity in
                                            guard flight == nil else { return }
                                            if owner.photos.count > 1
                                                && VibeMotion.accepts(
                                                    distance.width, velocity: velocity,
                                                    width: cardWidth)
                                            {
                                                begin(
                                                    target: MediaPhotoNavigation.nextInStack(
                                                        from: selection, count: owner.photos.count),
                                                    side: distance.width < 0 ? -1 : 1,
                                                    width: geometry.size.width,
                                                    cardWidth: cardWidth, velocity: velocity)
                                            } else {
                                                restore()
                                            }
                                        }, open: { if flight == nil { open() } })
                                }
                            }
                            .rotationEffect(
                                .degrees(reassembling ? 0 : angle(rank, width: geometry.size.width))
                            )
                            .offset(
                                x: rank == 0 ? translation.width : 0,
                                y: rank == 0
                                    ? max(
                                        -DesignTokens.componentMobileVibeVerticalDriftMaximum,
                                        min(
                                            DesignTokens.componentMobileVibeVerticalDriftMaximum,
                                            translation.height
                                                * DesignTokens.componentMobileVibeVerticalDriftRatio
                                        )) : 0
                            )
                            .opacity(reassembling || recycled == photo.id ? 0 : 1)
                            .allowsHitTesting(rank == 0).zIndex(Double(visiblePhotos.count - rank))
                            .transition(.identity)
                            .accessibilityElement(
                                children: failed.contains(photo.id) ? .contain : .ignore
                            )
                            .accessibilityLabel("Открыть фото \(selection + 1)")
                            .accessibilityAddTraits(.isButton).accessibilityHidden(rank != 0)
                            .accessibilityAction { if flight == nil { open() } }
                    }
                }
            }.frame(width: geometry.size.width, height: geometry.size.height).contentShape(
                Rectangle()
            ).focusable()
                .accessibilityIdentifier("photo-stack").accessibilityValue(
                    "Фото \(selection + 1) из \(owner.photos.count)"
                )
                .accessibilityAdjustableAction {
                    keyboardStep(
                        $0 == .increment ? 1 : -1, width: geometry.size.width, cardWidth: cardWidth)
                }
                .onKeyPress(.leftArrow) {
                    keyboardStep(-1, width: geometry.size.width, cardWidth: cardWidth)
                    return .handled
                }
                .onKeyPress(.rightArrow) {
                    keyboardStep(1, width: geometry.size.width, cardWidth: cardWidth)
                    return .handled
                }
        }.onDisappear {
            flight?.cancel()
            flight = nil
            translation = .zero
        }
    }
    private var visiblePhotos: [MeetingMedia] {
        guard !owner.photos.isEmpty else { return [] }
        return (0..<min(3, owner.photos.count)).map {
            owner.photos[(selection + $0) % owner.photos.count]
        }
    }
    private func picture(_ photo: MeetingMedia) -> some View {
        Group {
            if failed.contains(photo.id) {
                VibePhotoUnavailable { failed.remove(photo.id) }
            } else {
                PrivatePhotoView(
                    media: photo, session: owner.session, onFailure: { failed.insert(photo.id) })
            }
        }
        .clipShape(
            RoundedRectangle(
                cornerRadius: DesignTokens.componentMobileVibePhotoRadius
                    - DesignTokens.componentMobileVibePhotoBorder)
        )
        .padding(DesignTokens.componentMobileVibePhotoBorder)
        .background(
            DesignTokens.colorPhotoFrame,
            in: RoundedRectangle(cornerRadius: DesignTokens.componentMobileVibePhotoRadius)
        )
        .shadow(
            color: DesignTokens.colorMobileVibePhotoShadow,
            radius: DesignTokens.componentMobileVibeCardShadowBlur,
            y: DesignTokens.componentMobileVibeCardShadowDown)
    }
    private func angle(_ rank: Int, width: CGFloat) -> Double {
        if rank == 0 {
            return Double(DesignTokens.componentMobileVibeStackInitialAngle)
                + max(
                    -Double(DesignTokens.componentMobileVibeDragAngleMaximum),
                    min(
                        Double(DesignTokens.componentMobileVibeDragAngleMaximum),
                        Double(translation.width)
                            / Double(DesignTokens.componentMobileVibeDragAngleDivisor)
                    ))
        }
        let progress = min(
            1,
            abs(Double(translation.width))
                / max(1, Double(width) * DesignTokens.componentMobileVibeProgressViewportRatio))
        return Double(rank) * Double(DesignTokens.componentMobileVibeStackAngleStep)
            + Double(DesignTokens.componentMobileVibeStackInitialAngle) - progress
            * Double(DesignTokens.componentMobileVibeStackAngleStep)
    }
    private func restore() {
        guard flight == nil else { return }
        withAnimation(
            reduceMotion ? nil : VibeMotion.animation(DesignTokens.motionDurationVibeReturn)
        ) { translation = .zero }
        if !reduceMotion {
            flight = Task {
                try? await Task.sleep(for: .seconds(DesignTokens.motionDurationVibeReturn))
                flight = nil
            }
        }
    }
    private func keyboardStep(_ delta: Int, width: CGFloat, cardWidth: CGFloat) {
        begin(
            target: MediaPhotoNavigation.index(
                from: selection, delta: delta, count: owner.photos.count), side: delta > 0 ? -1 : 1,
            width: width, cardWidth: cardWidth, velocity: 0)
    }
    private func begin(
        target: Int, side: CGFloat, width: CGFloat, cardWidth: CGFloat, velocity: CGFloat
    ) {
        guard flight == nil else { return }
        guard owner.photos.count > 1, target != selection, owner.photos.indices.contains(target)
        else {
            restore()
            return
        }
        if reduceMotion {
            selection = target
            translation = .zero
            return
        }
        let old = owner.photos[selection].id
        let cycle = selection == owner.photos.count - 1 && target == 0
        let destination = side * (width + cardWidth)
        let milliseconds = min(
            DesignTokens.motionDurationVibeFlightMaximum * 1000,
            max(
                DesignTokens.motionDurationVibeFlightMinimum * 1000,
                Double(abs(destination - translation.width))
                    / (Double(abs(velocity)) / 1000
                        + Double(DesignTokens.componentMobileVibeFlightSpeedBias))))
        let duration = milliseconds / 1000
        flight = Task { @MainActor in
            defer { flight = nil }
            withAnimation(VibeMotion.animation(duration)) {
                translation = CGSize(width: destination, height: DesignTokens.spaceS0)
            }
            do { try await Task.sleep(for: .seconds(duration)) } catch { return }
            guard owner.current, !Task.isCancelled else { return }
            var transaction = Transaction()
            transaction.disablesAnimations = true
            withTransaction(transaction) {
                selection = target
                translation = .zero
                recycled = cycle ? nil : old
                reassembling = cycle
            }
            await Task.yield()
            withAnimation(
                VibeMotion.animation(
                    cycle
                        ? DesignTokens.motionDurationVibeAssembly
                        : DesignTokens.motionDurationVibeFade)
            ) {
                recycled = nil
                reassembling = false
            }
            try? await Task.sleep(
                for: .seconds(
                    cycle
                        ? DesignTokens.motionDurationVibeAssembly
                        : DesignTokens.motionDurationVibeFade))
        }
    }
}
