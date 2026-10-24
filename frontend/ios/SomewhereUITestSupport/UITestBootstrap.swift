import Foundation

@MainActor
enum UITestBootstrap {
    private struct Config: Decodable {
        let origin: URL
        let certificate: Data
        let cases: [String: Credential]
    }
    private struct Credential: Decodable {
        let token: String
        let expiresAt: APIInstant
    }
    static func runtime() -> AppRuntime {
        let scenario = ProcessInfo.processInfo.environment["SOMEWHERE_UI_SCENARIO"] ?? "onboarding"
        let directory = URL.applicationSupportDirectory.appendingPathComponent(
            "UITestDrafts/" + scenario)
        let drafts = DraftRepository(storage: FileDraftStorage(directory: directory))
        do {
            let file = URL.temporaryDirectory.appendingPathComponent("ui-fixture.json")
            let config = try JSONDecoder().decode(Config.self, from: Data(contentsOf: file))
            guard config.origin.scheme == "https", config.origin.host == "127.0.0.1",
                config.origin.port != nil
            else { throw ClientFailure.invalidOrigin }
            let origin = try APIOrigin(config.origin)
            let transport = FixtureTransport(
                origin: config.origin, certificate: config.certificate, scenario: scenario)
            let credentials = CredentialStore(
                storage: KeychainCredentialStorage(
                    origin: origin, service: "dev.groupplanning.ui." + scenario))
            let api = APIClient(origin: origin, transport: transport)
            let links = PendingInvitationStore(
                file: URL.applicationSupportDirectory
                    .appendingPathComponent("UITestLinks/" + scenario))
            if scenario == "invite-anonymous" || scenario == "onboarding" {
                let session = SessionStore(
                    api: api, credentials: credentials, privateData: PrivateData())
                let signIn = YandexSignIn(
                    api: api, session: session,
                    storage: KeychainAuthAttemptStorage(
                        origin: origin, service: "dev.groupplanning.ui.auth." + scenario),
                    provider: UITestLoginProvider())
                return AppRuntime(
                    session: session, drafts: drafts, api: api, links: links, signIn: signIn)
            }
            let credentialCase =
                scenario == "invite-rsvp"
                    && ProcessInfo.processInfo.environment["SOMEWHERE_UI_REENTRY"] == "1"
                ? "invite-rsvp-reentry" : scenario
            guard let credential = config.cases[credentialCase] else {
                throw ClientFailure.invalidOrigin
            }
            let session = SessionStore(
                api: api, credentials: credentials,
                privateData: PrivateData())
            return try AppRuntime(
                session: session, drafts: drafts,
                credential: StoredSession(
                    token: credential.token, expiresAt: credential.expiresAt.date), links: links)
        } catch {
            // A broken test configuration must fail UI assertions, never fake API success.
            return AppRuntime(session: nil, drafts: drafts)
        }
    }
}
