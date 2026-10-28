import SwiftUI

struct MeetingPickerSheet<Content: View>: View {
    let title: String
    let height: CGFloat
    let confirm: () -> Void
    @ViewBuilder let content: () -> Content
    @Environment(\.dismiss) private var dismiss
    @Environment(\.dynamicTypeSize) private var typeSize
    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 16) {
                Text(title).font(.title2.weight(.semibold))
                    .fixedSize(horizontal: false, vertical: true).layoutPriority(1)
                    .accessibilityAddTraits(.isHeader).accessibilityIdentifier(
                        "meeting-picker-header")
                Spacer(minLength: 8)
            }.frame(minHeight: DesignTokens.targetIos).padding(.horizontal, 24).padding(.top, 20)
                .padding(.bottom, 8)
            ScrollView {
                content().padding(.horizontal, 16).padding(.vertical, 8)
            }.scrollBounceBehavior(.basedOnSize).scrollIndicators(.hidden)
        }
        .safeAreaInset(edge: .bottom) {
            ActionButton(title: "Готово") {
                confirm()
                dismiss()
            }
            .accessibilityIdentifier("picker-done")
            .padding(.horizontal, 24).padding(.top, 12).padding(.bottom, 16)
            .background(AppPalette.surface)
        }
        .background(AppPalette.surface.ignoresSafeArea())
        .foregroundStyle(AppPalette.text).tint(AppPalette.accent).preferredColorScheme(.dark)
        .accessibilityAction(.escape) { dismiss() }
        .presentationBackground(AppPalette.surface)
        .presentationCornerRadius(30).presentationDragIndicator(.visible)
        .presentationDetents(typeSize.isAccessibilitySize ? [.large] : [.height(height), .large])
    }
}
