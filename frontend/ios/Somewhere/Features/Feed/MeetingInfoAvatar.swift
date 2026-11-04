import SwiftUI

struct MeetingInfoAvatar: View {
    let user: UserProfile
    let color: Color
    let foregroundColor: Color
    @ScaledMetric private var size: CGFloat

    init(user: UserProfile, size: CGFloat, color: Color, foregroundColor: Color) {
        self.user = user
        self.color = color
        self.foregroundColor = foregroundColor
        _size = ScaledMetric(wrappedValue: size, relativeTo: .body)
    }

    var body: some View {
        ParticipantAvatar(user: user, size: size, color: color, foregroundColor: foregroundColor)
    }
}
