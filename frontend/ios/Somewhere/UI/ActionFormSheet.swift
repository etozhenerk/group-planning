import SwiftUI
import UIKit

struct ActionFormSheet<Content: View>: View {
    let title: String
    var dismissDisabled = false
    var scrollIdentifier = "action-form-scroll"
    var closeIdentifier = "action-form-close"
    @ViewBuilder let content: () -> Content
    @Environment(\.dismiss) private var dismiss
    @State private var contentHeight = DesignTokens.targetIos
    @State private var headerHeight = DesignTokens.targetIos
    @State private var keyboardVisible = false
    @State private var keyboardToolbarHeight = DesignTokens.spaceS0

    var body: some View {
        NavigationStack {
            VStack(spacing: DesignTokens.spaceS0) {
                HStack(spacing: DesignTokens.spaceS16) {
                    Text(title)
                        .designFont(
                            DesignTokens.typographySizeMobileActionHeading, weight: .bold,
                            relativeTo: .title
                        )
                        .tracking(-DesignTokens.componentActionHeadingTrackingMobile)
                        .fixedSize(horizontal: false, vertical: true)
                        .accessibilityAddTraits(.isHeader)
                    Spacer(minLength: DesignTokens.spaceS8)
                    Button {
                        SystemKeyboard.dismiss()
                        dismiss()
                    } label: {
                        ExperienceIcon(kind: .close, size: DesignTokens.componentNavigationIcon)
                            .frame(width: DesignTokens.targetIos, height: DesignTokens.targetIos)
                            .contentShape(Rectangle())
                    }.buttonStyle(.plain).disabled(dismissDisabled)
                        .accessibilityLabel("Закрыть")
                        .accessibilityIdentifier(closeIdentifier)
                }.padding(.horizontal, DesignTokens.spaceS20)
                    .padding(.top, DesignTokens.spaceS20)
                    .padding(.bottom, DesignTokens.spaceS12)
                    .onGeometryChange(for: CGFloat.self) {
                        $0.size.height
                    } action: {
                        headerHeight = $0
                    }
                ScrollView {
                    VStack(
                        alignment: .leading, spacing: DesignTokens.componentActionFieldGap,
                        content: content
                    )
                    .designFont(DesignTokens.typographySizeSmall)
                    .padding(.horizontal, DesignTokens.spaceS20)
                    .padding(
                        .bottom,
                        DesignTokens.spaceS24
                            + (keyboardVisible ? keyboardToolbarHeight : DesignTokens.spaceS0)
                    )
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .onGeometryChange(for: CGFloat.self) {
                        $0.size.height
                    } action: {
                        contentHeight = $0
                    }
                }.scrollDismissesKeyboard(.interactively)
                    .scrollBounceBehavior(.basedOnSize)
                    .accessibilityIdentifier(scrollIdentifier)
            }.background(DesignTokens.colorSurface)
                .toolbar(.hidden, for: .navigationBar)
                .toolbar {
                    ToolbarItemGroup(placement: .keyboard) {
                        Spacer()
                        Button("Готово") { SystemKeyboard.dismiss() }
                            .accessibilityIdentifier("action-keyboard-done")
                            .onGeometryChange(for: CGFloat.self) {
                                $0.size.height
                            } action: {
                                keyboardToolbarHeight = $0
                            }
                    }
                }
                .onReceive(
                    NotificationCenter.default.publisher(
                        for: UIResponder.keyboardWillShowNotification)
                ) {
                    _ in keyboardVisible = true
                }
                .onReceive(
                    NotificationCenter.default.publisher(
                        for: UIResponder.keyboardWillHideNotification)
                ) {
                    _ in keyboardVisible = false
                }
        }.interactiveDismissDisabled(dismissDisabled)
            .presentationDetents([.height(contentHeight + headerHeight)])
            .presentationDragIndicator(.visible)
            .presentationCornerRadius(DesignTokens.radiusSheet)
            .presentationBackground(DesignTokens.colorSurface)
            .preferredColorScheme(.dark).foregroundStyle(DesignTokens.colorText)
            .tint(DesignTokens.colorAccent)
    }
}
