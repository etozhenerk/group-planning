import Foundation

enum EmojiPickerCategory: String, CaseIterable, Identifiable {
    case faces, nature, food, travel, objects, symbols

    var id: String { rawValue }

    var label: String {
        switch self {
        case .faces: "Лица и люди"
        case .nature: "Природа"
        case .food: "Еда и напитки"
        case .travel: "Места и поездки"
        case .objects: "Предметы"
        case .symbols: "Символы"
        }
    }

    var icon: String {
        switch self {
        case .faces: "EmojiCategorySmile"
        case .nature: "EmojiCategoryLeaf"
        case .food: "EmojiCategoryFood"
        case .travel: "EmojiCategoryPlane"
        case .objects: "EmojiCategoryBulb"
        case .symbols: "EmojiCategoryHeart"
        }
    }

    func contains(_ entry: EmojiCatalogEntry) -> Bool {
        switch self {
        case .faces: ["Smileys & Emotion", "People & Body"].contains(entry.category)
        case .nature: entry.category == "Animals & Nature"
        case .food: entry.category == "Food & Drink"
        case .travel: entry.category == "Travel & Places"
        case .objects: ["Activities", "Objects"].contains(entry.category)
        case .symbols: ["Symbols", "Flags"].contains(entry.category)
        }
    }
}
