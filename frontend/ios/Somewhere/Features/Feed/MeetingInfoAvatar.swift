import SwiftUI
import UIKit

struct MeetingInfoAvatar: View {
    let user: UserProfile
    let weight: Int
    let color: Color
    let textColor: Color
    @ScaledMetric private var size: CGFloat
    @ScaledMetric private var textSize: CGFloat

    init(
        user: UserProfile, size: CGFloat, textSize: CGFloat, weight: Int, color: Color,
        textColor: Color
    ) {
        self.user = user
        self.weight = weight
        self.color = color
        self.textColor = textColor
        _size = ScaledMetric(wrappedValue: size, relativeTo: .body)
        _textSize = ScaledMetric(wrappedValue: textSize, relativeTo: .body)
    }

    var body: some View {
        Text(String(user.displayName.prefix(1)).uppercased())
            .font(font).foregroundStyle(textColor)
            .frame(width: size, height: size).background(color, in: Circle())
            .overlay {
                if let url = user.avatarURL, url.scheme == "https", url.user == nil,
                    url.password == nil
                {
                    AsyncImage(url: url) { image in
                        image.resizable().scaledToFill()
                    } placeholder: {
                        Color.clear
                    }.frame(width: size, height: size).clipShape(Circle())
                }
            }.accessibilityHidden(true)
    }

    private var font: Font {
        let fraction =
            CGFloat(weight - DesignTokens.typographyWeightSemibold)
            / CGFloat(DesignTokens.typographyWeightBold - DesignTokens.typographyWeightSemibold)
        let weight =
            UIFont.Weight.semibold.rawValue
            + fraction * (UIFont.Weight.bold.rawValue - UIFont.Weight.semibold.rawValue)
        return Font(UIFont.systemFont(ofSize: textSize, weight: UIFont.Weight(rawValue: weight)))
    }
}
