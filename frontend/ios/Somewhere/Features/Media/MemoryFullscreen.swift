import SwiftUI

struct MemoryFullscreen: View {
    let owner: MemoriesOwner
    @Binding var selection: Int
    @Environment(\.dismiss) private var dismiss
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    var body: some View {
        ZStack {
            Color(designHex: 0x141518).ignoresSafeArea()
            if owner.current, owner.photos.indices.contains(selection) {
                PrivatePhotoView(
                    media: owner.photos[selection], session: owner.session, fitting: true
                )
                .id(owner.photos[selection].id)
                .transition(reduceMotion ? .identity : .opacity)
            }
        }.contentShape(Rectangle()).focusable()
            .simultaneousGesture(
                DragGesture(minimumDistance: 20).onEnded { value in
                    if abs(value.translation.width) > 60
                        && abs(value.translation.width) > abs(value.translation.height)
                    {
                        step(value.translation.width < 0 ? 1 : -1)
                    }
                }
            )
            .safeAreaInset(edge: .top, spacing: 0) {
                HStack(spacing: 12) {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(owner.current ? owner.meeting?.title ?? "Вайб встречи" : "").font(
                            .system(size: 16, weight: .bold)
                        ).lineLimit(2)
                        HStack(spacing: 3) {
                            if owner.current, let meeting = owner.meeting {
                                Text(
                                    ExperienceDate.label(
                                        meeting.startsAt, day: meeting.startsOn,
                                        timezone: meeting.timezone, clock: false) + " ·")
                            }
                            Text("\(selection + 1) / \(owner.photos.count)")
                                .accessibilityLabel("\(selection + 1) из \(owner.photos.count)")
                                .accessibilityAddTraits(.updatesFrequently)
                        }.font(.system(size: 12)).foregroundStyle(AppPalette.muted)
                    }
                    Spacer()
                    Button {
                        dismiss()
                    } label: {
                        ExperienceIcon(kind: .close).frame(width: 44, height: 44).contentShape(
                            Rectangle())
                    }.accessibilityLabel("Закрыть")
                }.padding(14).background(
                    Color(designHex: 0x141518))
            }
            .safeAreaInset(edge: .bottom, spacing: 0) {
                Color(designHex: 0x141518).frame(height: 38)
            }
            .accessibilityAdjustableAction { direction in step(direction == .increment ? 1 : -1) }
            .onKeyPress(.leftArrow) {
                step(-1)
                return .handled
            }
            .onKeyPress(.rightArrow) {
                step(1)
                return .handled
            }
            .onKeyPress(.escape) {
                dismiss()
                return .handled
            }
            .animation(reduceMotion ? nil : .easeInOut(duration: 0.2), value: selection)
            .onChange(of: owner.current) { _, current in if !current { dismiss() } }
    }
    private func step(_ delta: Int) {
        guard owner.photos.count > 1 else { return }
        selection = (selection + delta + owner.photos.count) % owner.photos.count
    }
}
