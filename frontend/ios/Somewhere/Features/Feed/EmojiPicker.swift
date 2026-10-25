import SwiftUI

struct EmojiPicker: View {
    var privateData: PrivateData?
    var close: (() -> Void)?
    let select: (String) -> Void
    @State private var query = ""
    @State private var category = EmojiCatalog.categories.first ?? ""
    @State private var recent: [String] = []
    @Environment(\.dismiss) private var dismiss
    private let symbols = ["😀", "🧑", "🐻", "🍎", "⚽️", "🚗", "💡", "❤️", "🏳️"]
    private var results: [EmojiCatalogEntry] {
        EmojiCatalog.entries.filter { entry in
            if query.isEmpty { return entry.categoryName == category }
            return entry.name.localizedCaseInsensitiveContains(query)
                || entry.keywords.contains { $0.localizedCaseInsensitiveContains(query) }
                || entry.emoji == query
        }
    }
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 6) {
                TextField("Поиск эмодзи", text: $query).font(.system(size: 13)).padding(10)
                    .background(AppPalette.navigation, in: RoundedRectangle(cornerRadius: 12))
                    .overlay {
                        RoundedRectangle(cornerRadius: 12).stroke(
                            .white.opacity(0.078), lineWidth: 1)
                    }
                Button {
                    finish()
                } label: {
                    ExperienceIcon(kind: .close, size: 18).frame(width: 32, height: 40)
                        .contentShape(Rectangle().inset(by: -6))
                }
                .accessibilityLabel("Закрыть")
            }
            ScrollView {
                VStack(alignment: .leading, spacing: 8) {
                    if query.isEmpty, !recent.isEmpty {
                        Text("Недавние").font(.system(size: 12)).foregroundStyle(AppPalette.muted)
                            .padding(.top, 15)
                        LazyVGrid(
                            columns: Array(repeating: GridItem(.flexible(), spacing: 2), count: 7),
                            spacing: 2
                        ) {
                            ForEach(recent.prefix(7), id: \.self) { emoji in emojiButton(emoji) }
                        }
                    }
                    Text(query.isEmpty ? category : "Результаты поиска").font(.system(size: 12))
                        .foregroundStyle(AppPalette.muted).padding(.top, 15)
                    LazyVGrid(
                        columns: Array(repeating: GridItem(.flexible(), spacing: 2), count: 7),
                        spacing: 2
                    ) {
                        ForEach(results) { entry in
                            emojiButton(entry.emoji).accessibilityLabel(entry.name)
                        }
                    }
                    if results.isEmpty {
                        Text("Ничего не найдено").font(.system(size: 13)).foregroundStyle(
                            AppPalette.muted)
                    }
                }
            }.frame(height: 232)
            Rectangle().fill(AppPalette.border).frame(height: 1).padding(.top, 12)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 6) {
                    ForEach(Array(EmojiCatalog.categories.enumerated()), id: \.element) {
                        index, value in
                        Button {
                            category = value
                            query = ""
                        } label: {
                            Text(symbols[index % symbols.count]).font(.system(size: 18)).frame(
                                width: 32, height: 32
                            )
                            .background(
                                category == value ? .white.opacity(0.08) : .clear,
                                in: RoundedRectangle(cornerRadius: 8)
                            )
                            .contentShape(Rectangle().inset(by: -6))
                        }.accessibilityLabel(value).accessibilityAddTraits(
                            category == value ? .isSelected : [])
                    }
                }
            }.padding(.top, 12)
        }.padding(16).background(Color(designHex: 0x36373f), in: RoundedRectangle(cornerRadius: 19))
            .overlay {
                RoundedRectangle(cornerRadius: 19).stroke(.white.opacity(0.078), lineWidth: 1)
            }
            .shadow(color: .black.opacity(0.33), radius: 30, y: 20)
            .onAppear { recent = privateData?.recentEmoji ?? [] }
    }
    private func emojiButton(_ emoji: String) -> some View {
        Button {
            choose(emoji)
        } label: {
            Text(emoji).font(.system(size: 25)).frame(maxWidth: .infinity, minHeight: 40)
                .contentShape(Rectangle().inset(by: -2))
        }
        .buttonStyle(.plain)
    }
    private func finish() { if let close { close() } else { dismiss() } }
    private func choose(_ emoji: String) {
        recent.removeAll { $0 == emoji }
        recent.insert(emoji, at: 0)
        privateData?.recentEmoji = Array(recent.prefix(24))
        select(emoji)
        finish()
    }
}
