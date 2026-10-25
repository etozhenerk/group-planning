import SwiftUI

struct MeetingCardPeople: View {
    let meeting: MeetingSummary
    var body: some View {
        HStack(spacing: -8) {
            ForEach(
                Array((meeting.participantPreview ?? []).prefix(3).enumerated()), id: \.element.id
            ) { index, user in
                ParticipantAvatar(
                    user: user, size: 28,
                    color: Color(designHex: [0xd4bc9e, 0xc2b1d5, 0xa8c7b6][index])
                ).padding(2).background(
                    AppPalette.background, in: Circle())
            }
            if meeting.participantCount > 3 || meeting.participantPreview?.isEmpty != false {
                Text(
                    "+\(meeting.participantCount > 3 ? meeting.participantCount - 3 : meeting.participantCount)"
                )
                .font(.system(size: 10, weight: .semibold)).foregroundStyle(
                    Color(designHex: 0xe5e2ec)
                )
                .frame(width: 28, height: 28).background(Color(designHex: 0x474852), in: Circle())
                .padding(2).background(AppPalette.background, in: Circle())
            }
        }.shadow(color: .black.opacity(0.13), radius: 2, y: 2)
            .accessibilityElement(children: .ignore).accessibilityLabel(
                "Участников: \(meeting.participantCount)")
    }
}
