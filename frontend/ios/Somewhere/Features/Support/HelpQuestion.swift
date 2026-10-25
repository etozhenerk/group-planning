import SwiftUI

struct HelpQuestion: View {
    let title: String
    let answer: String
    @State private var expanded: Bool
    init(title: String, answer: String, initiallyOpen: Bool) {
        self.title = title
        self.answer = answer
        _expanded = State(initialValue: initiallyOpen)
    }
    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Button {
                expanded.toggle()
            } label: {
                HStack(alignment: .top, spacing: 3) {
                    Text(expanded ? "▾" : "▸").padding(.vertical, 2.85)
                    Text(title).lineSpacing(5.7).padding(.vertical, 2.85)
                        .multilineTextAlignment(.leading).frame(
                            maxWidth: .infinity, alignment: .leading)
                }.designFont(14, weight: .semibold).contentShape(Rectangle())
            }.buttonStyle(.plain).accessibilityLabel(title).accessibilityValue(
                expanded ? "Развёрнуто" : "Свёрнуто")
            if expanded {
                Text(answer).designFont(13).lineSpacing(7.9).padding(.vertical, 3.95)
                    .foregroundStyle(
                        AppPalette.muted)
            }
        }.padding(18).frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(designHex: 0x2d2e35), in: RoundedRectangle(cornerRadius: 18))
    }
}
