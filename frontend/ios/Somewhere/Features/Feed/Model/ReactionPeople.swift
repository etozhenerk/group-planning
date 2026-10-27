import Foundation

struct ReactionPerson: Identifiable {
    let user: UserProfile
    var emoji: [String]
    var id: UUID { user.id }
}

enum ReactionPeople {
    static func rows(_ reactions: [MessageReaction], filter: String?) -> [ReactionPerson] {
        var result: [ReactionPerson] = []
        for reaction in reactions where filter == nil || reaction.emoji == filter {
            for user in reaction.users {
                if let index = result.firstIndex(where: { $0.id == user.id }) {
                    result[index].emoji.append(reaction.emoji)
                } else {
                    result.append(ReactionPerson(user: user, emoji: [reaction.emoji]))
                }
            }
        }
        return result
    }
}
