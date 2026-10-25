import SwiftUI

struct PhotoFullscreen: View {
    let media: MeetingMedia
    let session: SessionStore
    private let lease: PrivateData.Lease?
    @Environment(\.dismiss) private var dismiss
    init(media: MeetingMedia, session: SessionStore) {
        self.media = media
        self.session = session
        lease = try? session.privateData.lease(for: media.meetingID)
    }
    private var current: Bool {
        lease.map { session.privateData.isCurrent($0) } == true && session.status == .authenticated
    }
    var body: some View {
        PrivatePhotoView(media: media, session: session, fitting: true)
            .background(Color(designHex: 0x141518)).safeAreaInset(edge: .top) {
                HStack {
                    Text(current ? media.fileName : "").font(.system(size: 16, weight: .bold))
                        .lineLimit(1)
                    Spacer()
                    Button {
                        dismiss()
                    } label: {
                        ExperienceIcon(kind: .close).frame(width: 44, height: 44).contentShape(
                            Rectangle())
                    }.accessibilityLabel("Закрыть")
                }.padding(14).background(
                    Color(designHex: 0x141518))
            }.onChange(of: current) { _, value in if !value { dismiss() }
            }
    }
}
