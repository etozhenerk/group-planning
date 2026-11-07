import Testing

@testable import Somewhere

@MainActor
struct AboutMetadataTests {
    @Test func completeVersionAndMissingMetadataKeepTheirMeaning() {
        #expect(
            AboutMetadata.resolve([
                "CFBundleShortVersionString": "1.0.0-rc.2", "CFBundleVersion": "42",
            ]) == .release(version: "1.0.0-rc.2", build: "42"))
        #expect(AboutMetadata.resolve([:]) == .local)
        #expect(AboutMetadata.resolve(nil) == .unavailable)
        #expect(
            AboutMetadata.resolve([
                "CFBundleShortVersionString": "1.0.0", "CFBundleVersion": "0",
            ]) == .release(version: "1.0.0", build: nil))
    }
}
