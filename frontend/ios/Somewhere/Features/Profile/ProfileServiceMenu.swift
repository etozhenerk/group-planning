import SwiftUI

struct ProfileServiceMenu: View {
    let api: APIClient
    @State private var support = false
    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
            NavigationLink {
                ServiceInformationScreen(document: .help, api: api)
            } label: {
                ProfileServiceRow(title: "Помощь", symbol: "questionmark.circle")
            }
            Button {
                support = true
            } label: {
                ProfileServiceRow(title: "Сообщить о проблеме", symbol: "exclamationmark.bubble")
            }
            NavigationLink {
                ServiceInformationScreen(document: .about, api: api)
            } label: {
                ProfileServiceRow(title: "О приложении", symbol: "info.circle", divider: false)
            }
            ViewThatFits(in: .horizontal) {
                HStack(spacing: DesignTokens.spaceS20) { documents }
                VStack(alignment: .leading, spacing: DesignTokens.spaceS0) { documents }
            }.padding(.top, DesignTokens.spaceS16)
        }.buttonStyle(.plain).foregroundStyle(DesignTokens.colorText)
            .fullScreenCover(isPresented: $support) {
                SupportScreen(api: api, kind: .problem, screen: "profile")
            }
    }
    @ViewBuilder private var documents: some View {
        document(.privacy, title: "Конфиденциальность")
        document(.cookies, title: "Cookie")
    }
    private func document(_ value: ServiceDocument, title: String) -> some View {
        NavigationLink {
            ServiceInformationScreen(document: value, api: api)
        } label: {
            Text(title).designFont(DesignTokens.typographySizeCaption)
                .foregroundStyle(DesignTokens.colorMuted).frame(minHeight: DesignTokens.targetIos)
        }
    }
}
