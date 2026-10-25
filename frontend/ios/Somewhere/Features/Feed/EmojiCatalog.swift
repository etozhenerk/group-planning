import Foundation

struct EmojiCatalogEntry: Decodable, Identifiable, Sendable {
    let emoji: String
    let name: String
    let keywords: [String]
    let category: String
    let categoryName: String
    var id: String { emoji }
    enum CodingKeys: String, CodingKey {
        case emoji, name, keywords, category
        case categoryName = "category_name"
    }
}

enum EmojiCatalog {
    /// The checked resource is generated from the shared Unicode 17 / CLDR 48 catalog.
    static let entries: [EmojiCatalogEntry] = {
        guard let url = Bundle.main.url(forResource: "emoji-ru", withExtension: "json"),
            let data = try? Data(contentsOf: url),
            let entries = try? JSONDecoder().decode([EmojiCatalogEntry].self, from: data)
        else { return [] }
        return entries
    }()
    static var categories: [String] {
        entries.reduce(into: []) { result, entry in
            if !result.contains(entry.categoryName) { result.append(entry.categoryName) }
        }
    }
}
