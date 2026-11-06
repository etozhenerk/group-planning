import SwiftUI

struct MemoryFullscreen: View {
    let owner: MemoriesOwner
    @Binding var selection: Int
    @Environment(\.dismiss) private var dismiss
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var translation: CGFloat = 0
    @State private var flight: Task<Void, Never>?
    @State private var failed: Set<UUID> = []
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                DesignTokens.colorPhotoBackdrop
                if owner.current, owner.photos.indices.contains(selection) {
                    ForEach([-1, 0, 1], id: \.self) { step in
                        let target = MediaPhotoNavigation.index(
                            from: selection, delta: step, count: owner.photos.count)
                        if step == 0 || target != selection {
                            let photo = owner.photos[target]
                            PrivatePhotoView(
                                media: photo, session: owner.session, fitting: true,
                                onAspect: { _ in failed.remove(photo.id) },
                                onFailure: { failed.insert(photo.id) }
                            )
                            .id(photo.id.uuidString + String(step))
                            .frame(width: geometry.size.width, height: geometry.size.height)
                            .offset(x: CGFloat(step) * geometry.size.width + translation)
                            .accessibilityHidden(step != 0)
                        }
                    }
                    if !failed.contains(owner.photos[selection].id) {
                        PhotoStackTouch(
                            changed: { if flight == nil { translation = $0.width } },
                            ended: { distance, velocity in
                                guard flight == nil else { return }
                                if owner.photos.count > 1
                                    && VibeMotion.accepts(
                                        distance.width, velocity: velocity,
                                        width: geometry.size.width,
                                        viewer: true)
                                {
                                    move(distance.width < 0 ? 1 : -1, width: geometry.size.width)
                                } else {
                                    restore()
                                }
                            }, open: {})
                    }
                }
            }.frame(width: geometry.size.width, height: geometry.size.height).clipped()
                .contentShape(Rectangle()).focusable()
                .accessibilityIdentifier("memory-fullscreen").accessibilityValue(
                    "\(selection + 1) из \(owner.photos.count)"
                )
                .accessibilityAdjustableAction {
                    move($0 == .increment ? 1 : -1, width: geometry.size.width)
                }
                .onKeyPress(.leftArrow) {
                    move(-1, width: geometry.size.width)
                    return .handled
                }
                .onKeyPress(.rightArrow) {
                    move(1, width: geometry.size.width)
                    return .handled
                }
        }
        .background(DesignTokens.colorPhotoBackdrop.ignoresSafeArea())
        .safeAreaInset(edge: .top, spacing: 0) {
            HStack(spacing: DesignTokens.spaceS12) {
                VStack(alignment: .leading, spacing: DesignTokens.spaceS4) {
                    Text(owner.current ? owner.meeting?.title ?? "Вайб встречи" : "").designFont(
                        DesignTokens.componentMobileVibeViewerTitleSize, weight: .medium
                    ).lineLimit(2)
                    Text("\(selection + 1) / \(owner.photos.count)").designFont(
                        DesignTokens.typographySizeCaption
                    ).foregroundStyle(DesignTokens.colorMuted).accessibilityAddTraits(
                        .updatesFrequently)
                }
                Spacer(minLength: DesignTokens.spaceS12)
                Button {
                    dismiss()
                } label: {
                    ExperienceIcon(kind: .close, size: DesignTokens.componentMobileChatIconSize)
                        .frame(width: DesignTokens.targetIos, height: DesignTokens.targetIos)
                        .background(
                            DesignTokens.colorSurface,
                            in: RoundedRectangle(
                                cornerRadius: DesignTokens.componentMobileVibeActionRadius)
                        ).contentShape(Rectangle())
                }.buttonStyle(.plain).accessibilityLabel("Закрыть просмотр")
            }.padding(.leading, DesignTokens.spaceS20).padding(.trailing, DesignTokens.spaceS16)
                .padding(.top, DesignTokens.componentMobileVibeViewerTopInset).padding(
                    .bottom, DesignTokens.componentMobileVibeNavBottomGap
                ).background(DesignTokens.colorPhotoBackdrop)
        }
        .onKeyPress(.escape) {
            dismiss()
            return .handled
        }
        .task(id: selection) { await owner.prefetch(around: selection) }
        .onChange(of: owner.current) { _, current in if !current { dismiss() } }
        .onDisappear {
            flight?.cancel()
            flight = nil
        }
    }
    private func restore() {
        guard flight == nil else { return }
        withAnimation(
            reduceMotion ? nil : VibeMotion.animation(DesignTokens.motionDurationVibeReturn)
        ) { translation = 0 }
        if !reduceMotion {
            flight = Task { @MainActor in
                defer { flight = nil }
                try? await Task.sleep(for: .seconds(DesignTokens.motionDurationVibeReturn))
            }
        }
    }
    private func move(_ delta: Int, width: CGFloat) {
        guard flight == nil, owner.current else { return }
        let target = MediaPhotoNavigation.index(
            from: selection, delta: delta, count: owner.photos.count)
        guard owner.photos.count > 1, target != selection else {
            restore()
            return
        }
        if reduceMotion {
            selection = target
            translation = 0
            return
        }
        flight = Task { @MainActor in
            defer { flight = nil }
            withAnimation(VibeMotion.animation(DesignTokens.motionDurationVibeViewer)) {
                translation = CGFloat(-delta) * width
            }
            do { try await Task.sleep(for: .seconds(DesignTokens.motionDurationVibeViewer)) } catch
            { return }
            guard owner.current, !Task.isCancelled, owner.photos.indices.contains(target) else {
                return
            }
            var transaction = Transaction()
            transaction.disablesAnimations = true
            withTransaction(transaction) {
                selection = target
                translation = 0
            }
        }
    }
}
