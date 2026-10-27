import Foundation
import Testing

@testable import Somewhere

@Suite("Mobile chat interactions")
@MainActor
struct ChatInteractionTests {
    @Test(arguments: ["👨‍👩‍👧‍👦", "👍🏽", "🇷🇺", "❤️"])
    func backwardDeletionRemovesACompleteGrapheme(_ emoji: String) {
        var text = "А\(emoji)Б"
        var selection = NSRange(location: "А\(emoji)".utf16.count, length: 0)
        ComposerInsertion.deleteBackward(in: &text, selection: &selection)
        #expect(text == "АБ")
        #expect(selection == NSRange(location: 1, length: 0))
        selection = NSRange(location: 0, length: 0)
        ComposerInsertion.deleteBackward(in: &text, selection: &selection)
        #expect(text == "АБ")
    }

    @Test func selectionAndRepeatedInsertionPreserveSurroundingText() {
        var text = "До XX после"
        var selection = (text as NSString).range(of: "XX")
        ComposerInsertion.insert("🍕", into: &text, selection: &selection)
        ComposerInsertion.insert("❤️", into: &text, selection: &selection)
        #expect(text == "До 🍕❤️ после")
        #expect(selection.location == "До 🍕❤️".utf16.count)
        selection = (text as NSString).range(of: "🍕❤️")
        ComposerInsertion.deleteBackward(in: &text, selection: &selection)
        #expect(text == "До  после")
        #expect(selection == NSRange(location: 3, length: 0))
    }

    @Test func childSheetReturnsToInformationWithoutDiscardingComposer() async throws {
        let context = try await FeedTestContext()
        let owner = context.owner
        defer { owner.suspend() }
        owner.draft = "До XX после"
        owner.composerSelection = NSRange(location: 3, length: 2)
        owner.panel = .emoji
        owner.openSheet(.information)
        owner.informationExpanded = true
        owner.openSheet(.settings, child: true)
        #expect(owner.panel == nil)
        #expect(owner.sheets == [.information, .settings])
        owner.closeSheet()
        #expect(owner.sheets == [.information])
        #expect(owner.informationExpanded)
        #expect(owner.informationReturn == .settings)
        owner.closeSheet()
        #expect(owner.sheets.isEmpty)
        #expect(owner.draft == "До XX после")
        #expect(owner.composerSelection == NSRange(location: 3, length: 2))
        #expect(!owner.composerFocused)
        owner.clear()
        #expect(owner.draft.isEmpty)
        #expect(owner.composerSelection == NSRange(location: 0, length: 0))
    }

    @Test func peopleFiltersMergeUsersWithoutTogglingReactions() throws {
        let users = try JSONDecoder().decode(
            [UserProfile].self,
            from: Data(
                """
                [{"id":"11111111-1111-4111-8111-111111111111","display_name":"Саша"},
                 {"id":"22222222-2222-4222-8222-222222222222","display_name":"Лена"}]
                """.utf8))
        let reactions = [
            MessageReaction(emoji: "👍", count: 2, mine: false, users: users),
            MessageReaction(emoji: "🍕", count: 1, mine: true, users: [users[0]]),
        ]
        let all = ReactionPeople.rows(reactions, filter: nil)
        #expect(all.count == 2)
        #expect(all[0].emoji == ["👍", "🍕"])
        #expect(ReactionPeople.rows(reactions, filter: "🍕").map(\.id) == [users[0].id])
        #expect(ReactionPeople.rows(reactions, filter: "❤️").isEmpty)
        #expect(reactions[1].mine)
        #expect(reactions[1].count == 1)
    }
}
