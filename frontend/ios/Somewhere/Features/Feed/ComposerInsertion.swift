import Foundation

enum ComposerInsertion {
    static func insert(_ emoji: String, into text: inout String, selection: inout NSRange) {
        let range = Range(selection, in: text) ?? text.endIndex..<text.endIndex
        let offset = text[..<range.lowerBound].utf16.count
        text.replaceSubrange(range, with: emoji)
        selection = NSRange(location: offset + emoji.utf16.count, length: 0)
    }
}
