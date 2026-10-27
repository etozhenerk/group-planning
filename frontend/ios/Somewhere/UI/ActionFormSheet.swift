import SwiftUI

struct ActionFormSheet<Content: View, Footer: View>: View {
    let title: String
    var dismissDisabled = false
    var scrollIdentifier = "action-form-scroll"
    var closeIdentifier = "action-form-close"
    var scrollOffset: Binding<CGFloat>?
    @ViewBuilder let content: () -> Content
    @ViewBuilder let footer: () -> Footer
    @Environment(\.dismiss) private var dismiss
    @Environment(\.chatSheetClose) private var chatClose
    @State private var contentHeight = DesignTokens.targetIos
    @State private var headerHeight = DesignTokens.targetIos
    @State private var footerHeight = DesignTokens.spaceS0

    var body: some View {
        NavigationStack {
            sheetBody
                .toolbar(.hidden, for: .navigationBar)
                .toolbar {
                    ToolbarItemGroup(placement: .keyboard) {
                        Spacer()
                        Button("Готово") { SystemKeyboard.dismiss() }
                            .accessibilityIdentifier("action-keyboard-done")
                    }
                }
        }
        .interactiveDismissDisabled(dismissDisabled || chatClose?.hasParent == true)
        .presentationDetents([
            .height(
                max(
                    DesignTokens.componentMobileSheetMinimumHeight,
                    contentHeight + headerHeight + footerHeight))
        ])
        .presentationCompactAdaptation(.sheet)
        .presentationDragIndicator(.visible)
        .presentationCornerRadius(DesignTokens.componentMobileSheetRadius)
        .presentationBackground(DesignTokens.colorSurface)
        .preferredColorScheme(.dark).foregroundStyle(DesignTokens.colorText).tint(
            DesignTokens.colorAccent)
    }

    private var sheetBody: some View {
        VStack(spacing: DesignTokens.spaceS0) {
            header
            ScrollView {
                VStack(
                    alignment: .leading, spacing: DesignTokens.componentMobileFormGroupGap,
                    content: content
                )
                .designFont(DesignTokens.typographySizeSmall)
                .padding(.horizontal, DesignTokens.componentMobileSheetContentInsetInline)
                .padding(.top, DesignTokens.componentMobileSheetContentInsetTop)
                .padding(.bottom, DesignTokens.componentMobileSheetContentInsetBottom)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background {
                    if let scrollOffset { SheetScrollPosition(offset: scrollOffset) }
                }
                .onGeometryChange(for: CGFloat.self) {
                    $0.size.height
                } action: {
                    contentHeight = $0
                }
            }.scrollDismissesKeyboard(.interactively).scrollBounceBehavior(.basedOnSize)
                .accessibilityIdentifier(scrollIdentifier)
            footerView
        }.background(DesignTokens.colorSurface)
            .background(gesture)
            .onKeyPress(.escape) {
                close()
                return .handled
            }
    }

    private var gesture: SheetContextGesture {
        SheetContextGesture(
            blocked: dismissDisabled, closeParent: chatClose?.hasParent == true ? { close() } : nil)
    }

    private var header: some View {
        HStack(spacing: DesignTokens.spaceS8) {
            Text(title).designTokenFont(
                DesignTokens.typographySizeMobileSheetTitle,
                weight: DesignTokens.typographyWeightMobileSheetTitle, relativeTo: .title3
            )
            .fixedSize(horizontal: false, vertical: true).accessibilityAddTraits(.isHeader)
            Spacer(minLength: DesignTokens.spaceS8)
            Button(action: close) {
                ExperienceIcon(kind: .close, size: DesignTokens.componentNavigationIcon)
                    .frame(width: DesignTokens.targetIos, height: DesignTokens.targetIos)
                    .contentShape(Rectangle())
            }.buttonStyle(.plain).disabled(dismissDisabled).accessibilityLabel("Закрыть")
                .accessibilityIdentifier(closeIdentifier)
        }.frame(minHeight: DesignTokens.componentMobileSheetHeaderHeight)
            .padding(.horizontal, DesignTokens.componentMobileSheetGrabInsetInline)
            .padding(.top, DesignTokens.componentMobileSheetGrabInsetTop)
            .onGeometryChange(for: CGFloat.self) {
                $0.size.height
            } action: {
                headerHeight = $0
            }
    }

    @ViewBuilder private var footerView: some View {
        if Footer.self != EmptyView.self {
            footer()
                .padding(.horizontal, DesignTokens.componentMobileSheetContentInsetInline)
                .padding(.top, DesignTokens.componentMobileSheetFooterInsetBlock)
                .padding(.bottom, DesignTokens.componentMobileSheetFooterInsetBottom)
                .frame(maxWidth: .infinity).background(DesignTokens.colorSurface)
                .overlay(alignment: .top) {
                    Rectangle().fill(DesignTokens.colorLine).frame(height: DesignTokens.spaceS1)
                }
                .onGeometryChange(for: CGFloat.self) {
                    $0.size.height
                } action: {
                    footerHeight = $0
                }
        }
    }

    private func close() {
        guard !dismissDisabled else { return }
        SystemKeyboard.dismiss()
        if let chatClose { chatClose.perform() } else { dismiss() }
    }
}

extension ActionFormSheet where Footer == EmptyView {
    init(
        title: String, dismissDisabled: Bool = false,
        scrollIdentifier: String = "action-form-scroll",
        closeIdentifier: String = "action-form-close", scrollOffset: Binding<CGFloat>? = nil,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.title = title
        self.dismissDisabled = dismissDisabled
        self.scrollIdentifier = scrollIdentifier
        self.closeIdentifier = closeIdentifier
        self.scrollOffset = scrollOffset
        self.content = content
        footer = { EmptyView() }
    }
}
