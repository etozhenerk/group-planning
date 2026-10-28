import SwiftUI

struct HelpQuestion: View {
    let title: String
    let answer: String
    @State private var expanded: Bool
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @ScaledMetric private var questionSize = DesignTokens.typographySizeHelpQuestion
    @ScaledMetric private var answerSize = DesignTokens.typographySizeHelpAnswer

    init(title: String, answer: String, initiallyOpen: Bool) {
        self.title = title
        self.answer = answer
        _expanded = State(initialValue: initiallyOpen)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
            Button {
                withAnimation(
                    ChatMotion.animation(
                        DesignTokens.motionDurationCard, reduceMotion: reduceMotion)
                ) {
                    expanded.toggle()
                }
            } label: {
                HStack(spacing: DesignTokens.spaceS24) {
                    Text(title).font(.system(size: questionSize, weight: .medium))
                        .lineSpacing(questionSpacing).padding(.vertical, questionSpacing / 2)
                        .multilineTextAlignment(.leading)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    HelpDisclosureSymbol(expanded: expanded)
                }.padding(DesignTokens.componentHelpDisclosureMobileInset)
                    .frame(minHeight: DesignTokens.targetIos)
                    .contentShape(Rectangle())
            }.buttonStyle(.plain).accessibilityLabel(title).accessibilityValue(
                expanded ? "Развёрнуто" : "Свёрнуто")
            Text(answer).font(.system(size: answerSize))
                .lineSpacing(answerSpacing).padding(.vertical, answerSpacing / 2)
                .foregroundStyle(DesignTokens.colorMuted)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, DesignTokens.componentHelpDisclosureMobileInset)
                .padding(.bottom, DesignTokens.componentHelpDisclosureMobileInset)
                .animation(
                    ChatMotion.animation(
                        DesignTokens.motionDurationFast, reduceMotion: reduceMotion)
                ) {
                    $0.opacity(expanded ? 1 : 0)
                }
                .frame(height: expanded ? nil : DesignTokens.spaceS0, alignment: .top)
                .clipped().accessibilityHidden(!expanded)
        }.frame(maxWidth: .infinity, alignment: .leading)
            .background(
                DesignTokens.colorSurface,
                in: RoundedRectangle(cornerRadius: DesignTokens.componentHelpDisclosureRadius))
    }

    private var questionSpacing: CGFloat {
        max(
            0,
            questionSize * DesignTokens.typographyLineHeightHelpQuestion
                - UIFont.systemFont(ofSize: questionSize, weight: .medium).lineHeight)
    }

    private var answerSpacing: CGFloat {
        max(
            0,
            answerSize * DesignTokens.typographyLineHeightHelpAnswer
                - UIFont.systemFont(ofSize: answerSize).lineHeight)
    }
}
