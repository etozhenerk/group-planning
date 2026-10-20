import SwiftUI

struct BrandWordmark: View {
    var body: some View {
        HStack(spacing: 8) {
            Image("BrandMark")
                .resizable()
                .scaledToFit()
                .frame(width: 44, height: 44)
                .accessibilityHidden(true)
            Text("somewhere")
                .font(.largeTitle.weight(.bold))
                .accessibilityAddTraits(.isHeader)
        }
        .foregroundStyle(Color("PrimaryText"))
        .accessibilityElement(children: .combine)
    }
}
