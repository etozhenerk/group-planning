import Testing

@testable import Somewhere

struct InvitationTimezoneTests {
    @Test func publicFactsUseHumanReadableTimezoneNames() {
        #expect(InvitationTimezone.label("Europe/Moscow") == "Москва")
        #expect(InvitationTimezone.label("Asia/Yekaterinburg") == "Екатеринбург")
        #expect(InvitationTimezone.label("UTC") == "UTC")
    }
}
