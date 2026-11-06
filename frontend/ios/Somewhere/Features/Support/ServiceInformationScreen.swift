import SwiftUI

struct ServiceInformationScreen: View {
    let document: ServiceDocument
    let api: APIClient
    @State private var support: SupportKind?
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        Group {
            if document == .privacy || document == .cookies {
                ServiceDocumentReader(document: document, api: api)
            } else {
                ScrollView {
                    VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
                        ServiceScreenHeader(title: document == .help ? "Помощь" : "О приложении") {
                            dismiss()
                        }
                        if document == .help {
                            HelpContent { support = .question }
                        } else {
                            AboutPanel()
                        }
                    }
                }.accessibilityIdentifier("service-information-scroll")
            }
        }.background(DesignTokens.colorBackground).toolbar(.hidden, for: .navigationBar)
            .fullScreenCover(item: $support) { kind in
                SupportScreen(api: api, kind: kind, screen: "other", accepted: { support = nil })
            }
    }
}
