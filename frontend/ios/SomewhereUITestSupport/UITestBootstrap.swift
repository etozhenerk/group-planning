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
        guard scenario != "onboarding" else { return AppRuntime(session: nil, drafts: drafts) }
        do {
            let file = URL.temporaryDirectory.appendingPathComponent("ui-fixture.json")
            let config = try JSONDecoder().decode(Config.self, from: Data(contentsOf: file))
            guard config.origin.scheme == "https", config.origin.host == "127.0.0.1",
                config.origin.port != nil, let credential = config.cases[scenario]
            else { throw ClientFailure.invalidOrigin }
            let origin = try APIOrigin(config.origin)
            let transport = FixtureTransport(
                origin: config.origin, certificate: config.certificate, scenario: scenario)
            let credentials = CredentialStore(
                storage: KeychainCredentialStorage(
                    origin: origin, service: "dev.groupplanning.ui." + scenario))
            let session = SessionStore(
                api: APIClient(origin: origin, transport: transport), credentials: credentials,
                privateData: PrivateData())
            return try AppRuntime(
                session: session, drafts: drafts,
                credential: StoredSession(
                    token: credential.token, expiresAt: credential.expiresAt.date))
        } catch {
            // A broken test configuration must fail UI assertions, never fake API success.
            return AppRuntime(session: nil, drafts: drafts)
        }
    }
}
