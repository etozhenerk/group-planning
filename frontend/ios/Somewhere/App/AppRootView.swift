import SwiftUI

struct AppRootView: View {
    var body: some View {
        BrandWordmark()
            .padding(24)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color("AppBackground").ignoresSafeArea())
    }
}
