import SwiftUI

struct MemoryPhotoStack: View {
    let owner: MemoriesOwner
    @Binding var selection: Int
    let open: () -> Void
    @State private var translation: CGFloat = 0
    @State private var aspect: CGFloat = 1.4
    @State private var flight: Task<Void, Never>?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                if owner.current, owner.photos.indices.contains(selection) {
                    ForEach([2, 1], id: \.self) { offset in
                        let photo = owner.photos[(selection + offset) % owner.photos.count]
                        picture(photo).frame(
                            width: geometry.size.width * 0.88, height: geometry.size.height * 0.77
                        )
                        .rotationEffect(.degrees(reduceMotion ? 0 : offset == 2 ? -9 : 7))
                        .opacity(offset == 2 ? 0.75 : 0.85).accessibilityHidden(true)
                    }
                    Button(action: open) {
                        picture(owner.photos[selection], report: true)
                            .frame(
                                width: aspect < 1
                                    ? min(
                                        geometry.size.width * 0.78,
                                        geometry.size.height * 0.88 * 2 / 3)
                                    : geometry.size.width * 0.88,
                                height: geometry.size.height * (aspect < 1 ? 0.88 : 0.77)
                            )
                            .rotationEffect(
                                .degrees(reduceMotion ? 0 : -1.5 + Double(translation / 30))
                            )
                            .offset(x: reduceMotion ? 0 : translation)
                    }.buttonStyle(.plain).accessibilityLabel("Открыть фото \(selection + 1)")
                }
            }.frame(width: geometry.size.width, height: geometry.size.height)
                .contentShape(Rectangle()).focusable()
                .simultaneousGesture(
                    DragGesture(minimumDistance: 20)
                        .onChanged { value in
                            if abs(value.translation.width) > abs(value.translation.height),
                                flight == nil
                            {
                                translation = value.translation.width
                            }
                        }.onEnded { value in
                            if abs(value.translation.width) > 60
                                && abs(value.translation.width) > abs(value.translation.height)
                            {
                                move(
                                    value.translation.width < 0 ? 1 : -1, width: geometry.size.width
                                )
                            } else {
                                withAnimation(reduceMotion ? nil : .easeOut(duration: 0.26)) {
                                    translation = 0
                                }
                            }
                        }
                )
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
            media: photo, session: owner.session, onAspect: report ? { aspect = $0 } : nil
        ).id(photo.id)
            .clipShape(RoundedRectangle(cornerRadius: 7)).padding(5)
            .background(Color(designHex: 0xe4ded4), in: RoundedRectangle(cornerRadius: 12))
            .shadow(color: .black.opacity(0.33), radius: 25, y: 20)
    }
    private func move(_ delta: Int, width: CGFloat) {
        guard owner.photos.count > 1, flight == nil else {
            translation = 0
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
            guard owner.current else { return }
            step(delta)
            translation = 0
            flight = nil
        }
    }
    private func step(_ delta: Int) {
        guard owner.photos.count > 1 else { return }
        selection = (selection + delta + owner.photos.count) % owner.photos.count
    }
}
