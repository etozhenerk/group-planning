import SwiftUI

struct ServiceLinks: View {
    let api: APIClient
    var screen = "other"
    @State private var support: SupportKind?
    var body: some View {
        VStack(spacing: 0) {
            link(.help)
            action("Сообщить о проблеме") { support = .problem }
            action("Предложить идею") { support = .idea }
            link(.about)
            link(.privacy)
            link(.cookies, divider: false)
        }.background(AppPalette.surface, in: RoundedRectangle(cornerRadius: 20))
            .fullScreenCover(item: $support) { kind in
                SupportScreen(api: api, kind: kind, screen: screen)

            }
    }
    private func row(_ title: String, divider: Bool = true) -> some View {
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                Text(title).designFont(13).foregroundStyle(AppPalette.text)
                Spacer(minLength: 8)
                Image(systemName: "chevron.right").font(.system(size: 11))
                    .foregroundStyle(AppPalette.muted)
            }.frame(minHeight: 50).padding(.horizontal, 17).contentShape(Rectangle())
            if divider {
                Rectangle().fill(AppPalette.border).frame(height: 1).padding(.horizontal, 17)
            }
        }
    }
    private func action(_ title: String, perform: @escaping () -> Void) -> some View {
        Button(action: perform) { row(title) }.buttonStyle(.plain)
    }
    private func link(_ document: ServiceDocument, divider: Bool = true) -> some View {
        NavigationLink {
            ServiceInformationScreen(document: document, api: api)
        } label: {
            row(document.title, divider: divider)
        }.buttonStyle(.plain)
    }
}
