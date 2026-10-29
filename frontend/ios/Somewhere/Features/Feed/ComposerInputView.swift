import SwiftUI
import UIKit

/// Placeholder and editable text share TextKit's font, origin and baseline.
final class ComposerInputView: UITextView {
    private let placeholder = UILabel()
    private lazy var keyboardDismissal = ComposerKeyboardDismissal(input: self)

    override init(frame: CGRect, textContainer: NSTextContainer?) {
        super.init(frame: frame, textContainer: textContainer)
        placeholder.text = "Сообщение"
        placeholder.textColor = UIColor(DesignTokens.colorMuted)
        placeholder.isAccessibilityElement = false
        placeholder.isUserInteractionEnabled = false
        addSubview(placeholder)
    }

    required init?(coder: NSCoder) { nil }

    override func didMoveToWindow() {
        super.didMoveToWindow()
        keyboardDismissal.attach(to: window)
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        updatePlaceholder()
    }

    func updatePlaceholder() {
        placeholder.isHidden = !text.isEmpty
        placeholder.font = font
        let x = textContainerInset.left + textContainer.lineFragmentPadding
        placeholder.frame = CGRect(
            x: x, y: textContainerInset.top,
            width: max(0, bounds.width - x - textContainerInset.right),
            height: font?.lineHeight ?? 0)
    }
}
