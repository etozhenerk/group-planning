import SwiftUI

struct MessageReceiptBadge: View {
    let count: ServerCounter?
    let open: () -> Void
    private var read: Bool { count.map { $0 > .zero } ?? false }
    private var label: String {
        if let count, read { return "Прочитали " + count.rawValue + ". Открыть сведения" }
        return count == .zero
            ? "Отправлено. Пока никто не прочитал. Открыть сведения"
            : "Отправлено. Нет подтверждения прочтения. Открыть действия"
    }
    var body: some View {
        Button(action: open) {
            MessageReadMark(read: read)
                .stroke(
                    style: StrokeStyle(
                        lineWidth: (read
                            ? DesignTokens.componentMobileMessageReceiptReadStroke
                            : DesignTokens.componentMobileMessageReceiptSentStroke)
                            * DesignTokens.spaceS20 / 24, lineCap: .round, lineJoin: .round)
                )
                .frame(
                    width: DesignTokens.spaceS20,
                    height: DesignTokens.spaceS16 - DesignTokens.spaceS1
                )
                .foregroundStyle(DesignTokens.colorOwnText)
                .opacity(read ? 1 : DesignTokens.componentMobileMessageReceiptMutedOpacity)
                .frame(width: DesignTokens.targetIos, height: DesignTokens.targetIos)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .padding(
            .vertical,
            (DesignTokens.componentMobileMessageReceiptHeight - DesignTokens.targetIos) / 2
        )
        .padding(
            .horizontal,
            (DesignTokens.componentMobileMessageReceiptWidth - DesignTokens.targetIos) / 2
        )
        .accessibilityLabel(label)
    }
}

private struct MessageReadMark: Shape {
    let read: Bool
    func path(in rect: CGRect) -> Path {
        var path = Path()
        let x = rect.width / 24
        let y = rect.height / 18
        path.move(to: CGPoint(x: 2 * x, y: 9 * y))
        path.addLine(to: CGPoint(x: 6 * x, y: 13 * y))
        path.addLine(to: CGPoint(x: 16 * x, y: 3 * y))
        if read {
            path.move(to: CGPoint(x: 10 * x, y: 12 * y))
            path.addLine(to: CGPoint(x: 11 * x, y: 13 * y))
            path.addLine(to: CGPoint(x: 22 * x, y: 2 * y))
        }
        return path
    }
}
