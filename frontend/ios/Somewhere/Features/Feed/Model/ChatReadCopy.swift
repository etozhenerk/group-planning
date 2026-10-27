import Foundation

enum ChatReadCopy {
    static func newMessages(_ count: Int) -> String {
        let end = count % 100
        let noun =
            (11...14).contains(end)
            ? "новых сообщений"
            : end % 10 == 1
                ? "новое сообщение"
                : (2...4).contains(end % 10) ? "новых сообщения" : "новых сообщений"
        return String(count) + " " + noun
    }
    static func unread(_ count: String) -> String {
        let last = Int(count.suffix(2)) ?? 0
        let word: String
        if (11...14).contains(last) {
            word = "непрочитанных сообщений"
        } else if last % 10 == 1 {
            word = "непрочитанное сообщение"
        } else if (2...4).contains(last % 10) {
            word = "непрочитанных сообщения"
        } else {
            word = "непрочитанных сообщений"
        }
        return count + " " + word
    }
}
