import SwiftUI
import UIKit

struct ComposerTextView: UIViewRepresentable {
    @Binding var text: String
    @Binding var selection: NSRange
    @Binding var focused: Bool
    func makeUIView(context: Context) -> ComposerInputView {
        let view = ComposerInputView()
        view.delegate = context.coordinator
        view.backgroundColor = .clear
        view.font = UIFontMetrics(forTextStyle: .body).scaledFont(
            for: UIFont.systemFont(ofSize: DesignTokens.typographySizeBody))
        view.adjustsFontForContentSizeCategory = true
        view.textColor = UIColor(DesignTokens.colorText)
        view.tintColor = UIColor(DesignTokens.colorAccent)
        view.textContainerInset = UIEdgeInsets(
            top: DesignTokens.componentChatComposerInputInsetTop,
            left: DesignTokens.componentChatComposerInputInsetStart,
            bottom: DesignTokens.componentChatComposerInputInsetBottom, right: 0)
        view.textContainer.lineFragmentPadding = 0
        view.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
        view.accessibilityLabel = "Сообщение"
        view.accessibilityIdentifier = "message-input"
        view.isScrollEnabled = false
        return view
    }
    func updateUIView(_ view: ComposerInputView, context: Context) {
        context.coordinator.parent = self
        context.coordinator.updating = true
        defer { context.coordinator.updating = false }
        if view.text != text { view.text = text }
        if selection.location <= view.text.utf16.count,
            NSMaxRange(selection) <= view.text.utf16.count,
            view.selectedRange != selection
        {
            view.selectedRange = selection
        }
        if focused && !view.isFirstResponder { view.becomeFirstResponder() }
        if !focused && view.isFirstResponder { view.resignFirstResponder() }
        view.updatePlaceholder()
    }
    func sizeThatFits(_ proposal: ProposedViewSize, uiView: ComposerInputView, context: Context)
        -> CGSize?
    {
        guard let width = proposal.width else { return nil }
        let needed = uiView.sizeThatFits(CGSize(width: width, height: .greatestFiniteMagnitude))
            .height
        let maximum = max(
            DesignTokens.componentChatComposerInputMaxHeight,
            UIFontMetrics(forTextStyle: .body).scaledFont(
                for: UIFont.systemFont(ofSize: DesignTokens.typographySizeBody)
            )
            .lineHeight
                * (DesignTokens.componentChatComposerInputMaxHeight
                    / DesignTokens.componentChatComposerInputLineHeight))
        uiView.isScrollEnabled = needed > maximum
        return CGSize(
            width: width,
            height: min(max(DesignTokens.componentChatComposerInputMinHeight, needed), maximum))
    }
    func makeCoordinator() -> Coordinator { Coordinator(self) }
    @MainActor final class Coordinator: NSObject, UITextViewDelegate {
        var parent: ComposerTextView
        var updating = false
        init(_ parent: ComposerTextView) { self.parent = parent }
        func textViewDidChange(_ textView: UITextView) {
            guard !updating else { return }
            parent.text = textView.text
            parent.selection = textView.selectedRange
            (textView as? ComposerInputView)?.updatePlaceholder()
        }
        func textViewDidChangeSelection(_ textView: UITextView) {
            guard !updating else { return }
            parent.selection = textView.selectedRange
        }
        func textViewDidBeginEditing(_ textView: UITextView) { parent.focused = true }
        func textViewDidEndEditing(_ textView: UITextView) { parent.focused = false }
    }
}
