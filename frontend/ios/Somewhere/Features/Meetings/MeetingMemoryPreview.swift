import SwiftUI

struct MeetingMemoryPreview: View {
    let meeting: MeetingSummary
    let session: SessionStore
    @State private var owner: MemoriesOwner?
    var body: some View {
        Button {
            owner = MemoriesOwner(id: meeting.id, session: session)
        } label: {
            HStack(spacing: 5) {
                ExperienceIcon(kind: .photo, size: 14)
                Text("Вайб встречи").font(.system(size: 11))
            }.padding(.horizontal, 10).frame(height: 27)
                .background(Color(designHex: 0x42414c), in: Capsule()).padding(2)
                .background(AppPalette.background, in: Capsule())
        }.buttonStyle(.plain).accessibilityLabel(
            "Вайб встречи · \(meeting.memoryPhotoCount ?? 0) фото"
        )
        .accessibilityIdentifier("meeting-memories-" + meeting.id.uuidString.lowercased())
        .fullScreenCover(item: $owner) { owner in MemoriesScreen(owner: owner) }
    }
}
