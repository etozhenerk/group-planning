import SwiftUI
import UniformTypeIdentifiers

struct MessageAttachmentView: View {
    let media: MeetingMedia
    let session: SessionStore
    let width: CGFloat
    @State private var aspect: CGFloat = 1.5
    @State private var owner: MediaContentOwner
    @State private var fullScreen = false
    @State private var exporting = false
    @State private var download = false
    @State private var exportFailed = false
    init(media: MeetingMedia, session: SessionStore, width: CGFloat = 290) {
        self.media = media
        self.session = session
        self.width = width
        _owner = State(initialValue: MediaContentOwner(media: media, session: session))
    }
    var body: some View {
        Group {
            if media.kind == "photo" {
                Button {
                    fullScreen = true
                } label: {
                    PrivatePhotoView(media: media, session: session, onAspect: { aspect = $0 })
                        .frame(height: width / max(0.1, aspect))
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                }.buttonStyle(.plain).accessibilityLabel("Открыть фото")
            } else {
                Button {
                    download = true
                } label: {
                    HStack(spacing: 12) {
                        ExperienceIcon(kind: .file, size: 28)
                        VStack(alignment: .leading, spacing: 5) {
                            Text(media.fileName).designFont(14, weight: .semibold)
                            Text(
                                MediaMetadata.label(type: media.contentType, bytes: media.sizeBytes)
                            ).designFont(12)
                            if owner.loading {
                                ProgressView()
                            } else {
                                Text("Сохранить файл").designFont(12)
                            }
                        }
                    }.padding(13).frame(maxWidth: .infinity, alignment: .leading)
                }.disabled(owner.loading)
            }
            if owner.failed || exportFailed {
                Text("Не удалось сохранить файл. Попробуйте ещё раз.").font(.caption)
                    .foregroundStyle(AppPalette.error)
            }
        }.task(id: download) {
            if download {
                await owner.load()
                if owner.current, owner.data != nil { exporting = true }
                download = false
            }
        }.fileExporter(
            isPresented: $exporting,
            document: owner.current ? owner.data.map { MediaFileDocument(data: $0) } : nil,
            contentType: UTType(mimeType: media.contentType) ?? .data,
            defaultFilename: media.fileName
        ) { result in
            if case .failure = result { exportFailed = true }
        }
        .fullScreenCover(isPresented: $fullScreen) {
            PhotoFullscreen(media: media, session: session)
        }
        .onChange(of: owner.current) { _, current in
            if !current {
                exporting = false
                fullScreen = false
                owner.clear()
            }
        }
        .onDisappear { owner.clear() }
    }
}
