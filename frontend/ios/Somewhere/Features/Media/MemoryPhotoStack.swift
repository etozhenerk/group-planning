import SwiftUI

struct MemoryPhotoStack: View {
    let owner: MemoriesOwner
    @Binding var selection: Int
    let open: () -> Void
    @State private var translation: CGFloat = 0
    @State private var aspects: [UUID: CGFloat] = [:]
    @State private var flight: Task<Void, Never>?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                if owner.current, owner.photos.indices.contains(selection) {
                    ForEach(
                        [2, 1].filter { owner.photos.indices.contains(selection + $0) }, id: \.self
                    ) { offset in
                        let photo = owner.photos[selection + offset]
                        picture(photo, report: true).frame(
                            width: width(photo, in: geometry.size),
                            height: height(photo, in: geometry.size)
                        )
                        .rotationEffect(.degrees(reduceMotion ? 0 : offset == 2 ? -9 : 7))
                        .opacity(offset == 2 ? 0.75 : 0.85).accessibilityHidden(true)
                    }
                    picture(owner.photos[selection], report: true)
                        .frame(
                            width: width(owner.photos[selection], in: geometry.size),
                            height: height(owner.photos[selection], in: geometry.size)
                        )
                        .overlay {
                            PhotoStackTouch(
                                changed: { if flight == nil { translation = $0 } },
                                ended: { distance in
                                    if abs(distance) > 60 {
                                        move(distance < 0 ? 1 : -1, width: geometry.size.width)
                                    } else {
                                        withAnimation(reduceMotion ? nil : .easeOut(duration: 0.26))
                                        { translation = 0 }
                                    }
                                }, open: { if flight == nil { open() } })
                        }
                        .rotationEffect(
                            .degrees(reduceMotion ? 0 : -1.5 + Double(translation / 30))
                        )
                        .offset(x: reduceMotion ? 0 : translation)
                        .accessibilityElement(children: .ignore)
                        .accessibilityLabel("Открыть фото \(selection + 1)")
                        .accessibilityAddTraits(.isButton)
                        .accessibilityAction { if flight == nil { open() } }

                }
            }.frame(width: geometry.size.width, height: geometry.size.height)
                .contentShape(Rectangle()).focusable()
                .accessibilityValue("Фото \(selection + 1) из \(owner.photos.count)")
                .accessibilityAdjustableAction { step($0 == .increment ? 1 : -1) }
                .onKeyPress(.leftArrow) {
                    step(-1)
                    return .handled
                }
                .onKeyPress(.rightArrow) {
                    step(1)
                    return .handled
                }
        }.onDisappear {
            flight?.cancel()
            flight = nil
            translation = 0
        }
    }
    private func picture(_ photo: MeetingMedia, report: Bool = false) -> some View {
        PrivatePhotoView(
            media: photo, session: owner.session,
            onAspect: report ? { aspects[photo.id] = $0 } : nil
        ).id(photo.id)
            .clipShape(RoundedRectangle(cornerRadius: 7)).padding(5)
            .background(Color(designHex: 0xe4ded4), in: RoundedRectangle(cornerRadius: 12))
            .shadow(color: .black.opacity(0.33), radius: 25, y: 20)
    }
    private static let fallbackAspect: CGFloat = 1.4
    private func width(_ photo: MeetingMedia, in size: CGSize) -> CGFloat {
        (aspects[photo.id] ?? Self.fallbackAspect) < 1
            ? min(size.width * 0.78, size.height * 0.88 * 2 / 3) : size.width * 0.88
    }
    private func height(_ photo: MeetingMedia, in size: CGSize) -> CGFloat {
        size.height * ((aspects[photo.id] ?? Self.fallbackAspect) < 1 ? 0.88 : 0.77)
    }
    private func move(_ delta: Int, width: CGFloat) {
        guard owner.photos.count > 1, flight == nil else {
            translation = 0
            return
        }
        guard
            MediaPhotoNavigation.index(from: selection, delta: delta, count: owner.photos.count)
                != selection
        else {
            withAnimation(reduceMotion ? nil : .easeOut(duration: 0.26)) { translation = 0 }
            return
        }
        guard !reduceMotion else {
            translation = 0
            step(delta)
            return
        }
        withAnimation(.easeOut(duration: 0.26)) { translation = delta > 0 ? -width : width }
        flight = Task { @MainActor in
            do { try await Task.sleep(for: .milliseconds(260)) } catch { return }
            guard owner.current else {
                flight = nil
                return
            }
            var transaction = Transaction()
            transaction.disablesAnimations = true
            withTransaction(transaction) {
                step(delta)
                translation = 0
            }
            flight = nil
        }
    }
    private func step(_ delta: Int) {
        guard owner.photos.count > 1 else { return }
        let next = MediaPhotoNavigation.index(
            from: selection, delta: delta, count: owner.photos.count)
        let photo = owner.photos[next]
        if let image = owner.session.privateData.mediaCache.value(photo.id)?.image,
            image.size.height > 0
        {
            aspects[photo.id] = image.size.width / image.size.height
        }
        selection = next
    }
}
