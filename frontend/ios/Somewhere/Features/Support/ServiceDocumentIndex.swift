import SwiftUI

struct ServiceDocumentIndex: View {
    let sections: [(String, String)]
    let choose: (Int) -> Void
    var body: some View {
        ActionFormSheet(title: "Содержание", scrollIdentifier: "document-index-scroll") {
            VStack(spacing: DesignTokens.spaceS0) {
                ForEach(Array(sections.enumerated()), id: \.offset) { index, section in
                    Button {
                        choose(index)
                    } label: {
                        VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
                            Text(section.0).designFont(DesignTokens.typographySizeButton)
                                .multilineTextAlignment(.leading)
                                .frame(
                                    maxWidth: .infinity,
                                    minHeight: DesignTokens.componentMobileAboutIndexRowHeight,
                                    alignment: .leading)
                            if index != sections.count - 1 {
                                Rectangle().fill(DesignTokens.colorLine).frame(
                                    height: DesignTokens.spaceS1)
                            }
                        }
                    }.buttonStyle(.plain)
                }
            }.padding(.bottom, DesignTokens.spaceS12)
        }
    }
}
