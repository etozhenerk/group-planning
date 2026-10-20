import Foundation
import Observation

@MainActor @Observable
final class AppRuntime {
    let session: SessionStore?
    let drafts: DraftRepository
    let api: APIClient?
    let linkScheme: String
    var invitation: InvitationTarget?
    private(set) var linkWarning: String?
    @ObservationIgnored private let links: PendingInvitationStore
    @ObservationIgnored private var linkVersion = 0
    @ObservationIgnored private var linkTask: Task<Void, Never>?
    private(set) var ready = false
    var restoreID = UUID()
    @ObservationIgnored private let bootstrapCredential: StoredSession?

    init(
        session: SessionStore?, drafts: DraftRepository, credential: StoredSession? = nil,
        api: APIClient? = nil, links: PendingInvitationStore? = nil,
        linkScheme: String? = nil
    ) {
        self.session = session
        self.api = api ?? session?.api
        self.links =
            links
            ?? PendingInvitationStore(
                file: URL.applicationSupportDirectory
                    .appendingPathComponent("Links/pending-invitation"))
        self.linkScheme =
            linkScheme
            ?? (Bundle.main.object(
                forInfoDictionaryKey: "SomewhereLinkScheme") as? String ?? "group-planning-ios")
        self.drafts = drafts
        bootstrapCredential = credential
        ready = session == nil
    }

    func restore() async {
        ready = session == nil
        let version = linkVersion
        if invitation == nil, let token = try? await links.load(), version == linkVersion {
            invitation = .token(token)
        }
        if let credential = bootstrapCredential {
            await session?.establish(credential)
        } else {
            await session?.restore()
        }
        if !Task.isCancelled { ready = true }
    }

    func open(_ url: URL) {
        guard let token = InvitationURL.token(from: url, origin: api?.origin, scheme: linkScheme)
        else { return }
        invitation = .token(token)
        persist(token)
    }

    func closeInvitation() {
        invitation = nil
        persist(nil)
    }

    func invitationDidDismiss() {
        guard invitation == nil else { return }
        persist(nil)
    }

    private func persist(_ token: String?) {
        linkVersion += 1
        let version = linkVersion
        linkTask?.cancel()
        linkWarning = nil
        linkTask = Task {
            do { try await links.save(token, version: version) } catch {
                if !(error is CancellationError), version == linkVersion {
                    linkWarning = "Не удалось сохранить приглашение на устройстве."
                }
            }
        }
    }

    static func configured() -> AppRuntime {
        #if SOMEWHERE_UI_TEST_HOST
            return UITestBootstrap.runtime()
        #else
            let location = URL.applicationSupportDirectory.appendingPathComponent(
                "MeetingDrafts", isDirectory: true)
            let drafts = DraftRepository(storage: FileDraftStorage(directory: location))
            guard
                let value = Bundle.main.object(forInfoDictionaryKey: "SomewhereAPIOrigin")
                    as? String,
                let url = URL(string: value), let origin = try? APIOrigin(url)
            else { return AppRuntime(session: nil, drafts: drafts) }
            let api = APIClient(origin: origin)
            let credentials = CredentialStore(storage: KeychainCredentialStorage(origin: origin))
            return AppRuntime(
                session: SessionStore(
                    api: api, credentials: credentials, privateData: PrivateData()), drafts: drafts)
        #endif
    }
}
