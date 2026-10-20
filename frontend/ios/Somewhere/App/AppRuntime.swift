import Foundation
import Observation

@MainActor @Observable
final class AppRuntime {
    let session: SessionStore?
    let drafts: DraftRepository
    private(set) var ready = false
    var restoreID = UUID()
    @ObservationIgnored private let bootstrapCredential: StoredSession?

    init(session: SessionStore?, drafts: DraftRepository, credential: StoredSession? = nil) {
        self.session = session
        self.drafts = drafts
        bootstrapCredential = credential
        ready = session == nil
    }

    func restore() async {
        ready = session == nil
        if let credential = bootstrapCredential {
            await session?.establish(credential)
        } else {
            await session?.restore()
        }
        if !Task.isCancelled { ready = true }
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
