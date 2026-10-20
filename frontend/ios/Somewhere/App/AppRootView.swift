import SwiftUI

struct AppRootView: View {
    var body: some View {
        Text("Somewhere")
            .font(.largeTitle.weight(.bold))
            .foregroundStyle(Color("PrimaryText"))
            .accessibilityAddTraits(.isHeader)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color("AppBackground").ignoresSafeArea())
    }
}
