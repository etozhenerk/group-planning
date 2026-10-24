import SwiftUI

struct HomeTabs: View {
    @Binding var invitations: Bool

    var body: some View {
        Picker("Раздел встреч", selection: $invitations) {
            Text("Встречи").tag(false)
            Text("Приглашения").tag(true)
        }.pickerStyle(.segmented).accessibilityIdentifier("home-tabs")
    }
}
