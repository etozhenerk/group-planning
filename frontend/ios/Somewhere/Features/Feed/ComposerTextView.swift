import SwiftUI
import UIKit

struct ComposerTextView: UIViewRepresentable {
    @Binding var text: String
    @Binding var selection: NSRange
    @Binding var focused: Bool
    func makeUIView(context: Context) -> UITextView {
        let view = UITextView()
        view.delegate = context.coordinator
        view.backgroundColor = .clear
        view.font = UIFontMetrics(forTextStyle: .body).scaledFont(
            for: UIFont.systemFont(ofSize: 15))
        view.adjustsFontForContentSizeCategory = true
        view.textColor = .label
        view.tintColor = .label
        view.textContainerInset = UIEdgeInsets(top: 12, left: 0, bottom: 12, right: 0)
        view.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
        view.accessibilityLabel = "Сообщение"
        view.accessibilityIdentifier = "message-input"
        view.isScrollEnabled = false
        return view
    }
    func updateUIView(_ view: UITextView, context: Context) {
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
    }
    func sizeThatFits(_ proposal: ProposedViewSize, uiView: UITextView, context: Context) -> CGSize?
    {
        guard let width = proposal.width else { return nil }
        let needed = uiView.sizeThatFits(CGSize(width: width, height: .greatestFiniteMagnitude))
            .height
        let maximum = max(
            130,
            UIFontMetrics(forTextStyle: .body).scaledFont(for: UIFont.systemFont(ofSize: 15))
                .lineHeight * 6)
        uiView.isScrollEnabled = needed > maximum
        return CGSize(width: width, height: min(max(44, needed), maximum))
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
        }
        func textViewDidChangeSelection(_ textView: UITextView) {
            guard !updating else { return }
            parent.selection = textView.selectedRange
        }
        func textViewDidBeginEditing(_ textView: UITextView) { parent.focused = true }
        func textViewDidEndEditing(_ textView: UITextView) { parent.focused = false }
    }
}
