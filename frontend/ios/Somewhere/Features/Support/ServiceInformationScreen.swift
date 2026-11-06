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
        Group {
            if document == .help {
                ScrollView {
                    VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
                        ServiceScreenHeader(title: "Помощь") { dismiss() }
                        HelpContent { support = .question }
                    }
                }.accessibilityIdentifier("service-information-scroll")
            } else {
                legacyDocument
            }
        }.background(AppPalette.background).toolbar(.hidden, for: .navigationBar)
            .fullScreenCover(item: $support) { kind in
                SupportScreen(api: api, kind: kind, screen: "other", accepted: { support = nil })
            }
    }
    private var legacyDocument: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                PageBackButton { dismiss() }
                Text(heading).designFont(28, weight: .bold).tracking(-0.9).padding(
                    .top, 10
                )
                .accessibilityAddTraits(.isHeader)
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

    }
}
