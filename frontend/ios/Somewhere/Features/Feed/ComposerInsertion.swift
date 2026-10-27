import Foundation

enum ComposerInsertion {
    static func insert(_ emoji: String, into text: inout String, selection: inout NSRange) {
        let range = Range(selection, in: text) ?? text.endIndex..<text.endIndex
        let offset = text[..<range.lowerBound].utf16.count
        text.replaceSubrange(range, with: emoji)
        selection = NSRange(location: offset + emoji.utf16.count, length: 0)
    }

    static func deleteBackward(in text: inout String, selection: inout NSRange) {
        guard let range = Range(selection, in: text) else { return }
        if !range.isEmpty {
            let offset = text[..<range.lowerBound].utf16.count
            text.removeSubrange(range)
            selection = NSRange(location: offset, length: 0)
        } else if range.lowerBound > text.startIndex {
            let previous = text.index(before: range.lowerBound)
            let offset = text[..<previous].utf16.count
            text.removeSubrange(previous..<range.lowerBound)
            selection = NSRange(location: offset, length: 0)
        }
    }
}
