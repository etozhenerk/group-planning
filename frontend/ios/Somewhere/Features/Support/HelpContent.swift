import SwiftUI

struct HelpContent: View {
    let question: () -> Void
    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
            VStack(spacing: DesignTokens.spaceS10) {
                ForEach(Array(ServiceDocument.help.sections.enumerated()), id: \.offset) {
                    index, section in
                    HelpQuestion(title: section.0, answer: section.1, initiallyOpen: index == 0)
                }
            }
            VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
                Rectangle().fill(DesignTokens.colorLine).frame(height: DesignTokens.spaceS1)
                    .padding(.bottom, DesignTokens.spaceS24)
                Image(systemName: "bubble").font(.system(size: DesignTokens.spaceS24))
                    .foregroundStyle(DesignTokens.colorAccent).padding(
                        .bottom, (DesignTokens.spaceS12 + DesignTokens.spaceS2))
                Text("Остался вопрос?").designFont(
                    DesignTokens.componentMobileServiceSectionTitleSize, weight: .semibold
                ).padding(.bottom, DesignTokens.spaceS16)
                Button(action: question) {
                    HStack(spacing: DesignTokens.spaceS10) {
                        Text("Написать в поддержку")
                        Image(systemName: "arrow.up.right")
                    }.designFont(DesignTokens.typographySizeButton, weight: .semibold)
                        .frame(
                            maxWidth: .infinity,
                            minHeight: DesignTokens.componentMobileServiceActionHeight
                        )
                        .foregroundStyle(DesignTokens.colorActionText)
                        .background(
                            DesignTokens.colorAction,
                            in: RoundedRectangle(
                                cornerRadius: DesignTokens.componentMobileServiceActionRadius))
                }.buttonStyle(.plain)
            }.padding(.top, DesignTokens.spaceS24 + DesignTokens.spaceS6)
        }.padding(.horizontal, DesignTokens.spaceS20).padding(.bottom, DesignTokens.spaceS40)
    }
}
