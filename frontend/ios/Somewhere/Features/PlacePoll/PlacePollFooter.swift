import SwiftUI

struct PlacePollFooter: View {
    let poll: PlacePoll
    let meeting: Meeting
    var body: some View {
        Group {
            if poll.state == "open" {
                ViewThatFits(in: .horizontal) {
                    HStack(alignment: .top, spacing: DesignTokens.spaceS12) {
                        Text(PlacePollCopy.status(poll, timezone: meeting.timezone)).fixedSize()
                        Spacer(minLength: DesignTokens.spaceS0)
                        Text("Место пока прежнее").fixedSize()
                    }
                    VStack(alignment: .leading, spacing: DesignTokens.spaceS4) {
                        Text(PlacePollCopy.status(poll, timezone: meeting.timezone))
                        Text("Место пока прежнее")
                    }
                }
            } else {
                Text(
                    poll.state == "applied"
                        ? "Голосование завершено" : meeting.place ?? "Место пока прежнее")
            }
        }.designFont(DesignTokens.typographySizeLabel).foregroundStyle(DesignTokens.colorMuted)
            .padding(.top, DesignTokens.spaceS16)
    }
}
