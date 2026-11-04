import SwiftUI

struct RequiredFieldLabel: View {
    let title: LocalizedStringKey
    var required = false

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: DesignTokens.spaceS4) {
            Text(title)
            RequiredMark().opacity(required ? 1 : 0)
        }
    }
}
