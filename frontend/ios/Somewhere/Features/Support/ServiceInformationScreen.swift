import SwiftUI

struct ServiceInformationScreen: View {
    let document: ServiceDocument
    let api: APIClient
    @State private var support: SupportKind?
    @Environment(\.dismiss) private var dismiss
    private var heading: String {
        document == .help
            ? "Нужна подсказка?" : document == .about ? "О приложении" : document.title
    }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Button {
                    dismiss()
                } label: {
                    Text("← Назад").designFont(13).foregroundStyle(AppPalette.accent)
                        .frame(minHeight: 44)
                }.accessibilityLabel("Назад")
                Text(heading).designFont(28, weight: .bold).tracking(-0.9).padding(
                    .top, 10)
                Text(
                    document == .help
                        ? "Ответы на вопросы о встречах и приглашениях."
                        : document == .about
                            ? "Место для планов с друзьями." : "Как somewhere работает с данными."
                )
                .designFont(13).foregroundStyle(AppPalette.muted).lineSpacing(5).frame(
                    minHeight: 22, alignment: .leading
                ).padding(
                    .top, 12
                ).padding(.bottom, document == .help ? 29 : 32)
                if document == .about {
                    AboutPanel { support = .problem }
                } else if document == .help {
                    VStack(spacing: 12) {
                        ForEach(Array(document.sections.enumerated()), id: \.offset) {
                            index, section in
                            HelpQuestion(
                                title: section.0, answer: section.1, initiallyOpen: index == 0)
                        }
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Не нашли ответ?").designFont(20, weight: .bold)
                            Text("Напишите, с чем нужна помощь.").designFont(13)
                                .foregroundStyle(AppPalette.muted)
                            Button("Задать вопрос") { support = .question }.font(
                                .system(size: 14, weight: .semibold)
                            )
                            .frame(minHeight: 46).padding(.horizontal, 18).foregroundStyle(
                                AppPalette.actionText
                            )
                            .background(AppPalette.action, in: RoundedRectangle(cornerRadius: 13))
                            .padding(.top, 10)
                        }.padding(20).frame(maxWidth: .infinity, alignment: .leading)
                            .background(
                                Color(designHex: 0x38313d), in: RoundedRectangle(cornerRadius: 20)
                            ).padding(.top, 22)
                    }
                } else {
                    VStack(alignment: .leading, spacing: 26) {
                        ForEach(Array(document.sections.enumerated()), id: \.offset) {
                            index, section in
                            VStack(alignment: .leading, spacing: 10) {
                                Text(section.0).font(
                                    .system(size: index == 0 ? 14 : 20, weight: .bold)
                                ).accessibilityAddTraits(.isHeader)
                                Text(section.1).designFont(13).lineSpacing(7)
                                    .foregroundStyle(AppPalette.muted)
                                    .fixedSize(horizontal: false, vertical: true)
                            }.padding(index == 0 ? 17 : 0)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(
                                    index == 0 ? Color(designHex: 0x42363d) : .clear,
                                    in: RoundedRectangle(cornerRadius: 15))
                        }
                    }
                }
            }.padding(.horizontal, 20).padding(.top, 28).padding(.bottom, 28)
        }.accessibilityIdentifier("service-information-scroll").background(AppPalette.background)
            .toolbar(.hidden, for: .navigationBar)
            .safeAreaInset(edge: .top, spacing: DesignTokens.spaceS0) {
                ServicePageHeader(symbolOnly: document == .about)
            }

            .fullScreenCover(item: $support) { kind in
                SupportScreen(api: api, kind: kind, screen: "other")

            }
    }
}
