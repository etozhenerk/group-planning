import Foundation

enum OnboardingSlide: Int, CaseIterable, Identifiable {
    case invitation, conversation, poll, task, plans
    var id: Int { rawValue }
    var title: String {
        switch self {
        case .invitation: "Назначьте встречу.\nОтправьте ссылку."
        case .conversation: "Разговор —\nвнутри встречи."
        case .poll: "Новое место?\nРешите голосованием."
        case .task: "Кто закажет пиццу?\nПредложите задачу."
        case .plans: "Создайте\nпервую встречу."
        }
    }
    var text: String {
        switch self {
        case .invitation:
            "Друзья ответят «Приду», «Возможно» или «Не смогу». Вы увидите, кого ждать."
        case .conversation:
            "Обсудите детали в общем чате. Дата, место и ответы участников останутся рядом."
        case .poll:
            "После завершения опроса место изменится, если большинство проголосовавших будет за."
        case .task:
            "Друг станет ответственным, когда примет задачу. Остальные увидят, кто что готовит."
        case .plans: "После входа откроются ваши встречи. Отдельная регистрация не нужна."
        }
    }
    var exampleLabel: String {
        switch self {
        case .invitation:
            "Пример приглашения: суббота, 24 октября, 19:00, у Саши. Лена ответила: приду."
        case .conversation:
            "Пример разговора: Лена предлагает встретиться у Саши, Миша обещает принести настолки."
        case .poll: "Пример будущего опроса: встретиться у Саши. За — 3, против — 1."
        case .task: "Пример будущей задачи: заказать пиццу. Миша принял задачу."
        case .plans: "Пример списка предстоящих встреч. Календарь появится позже."
        }
    }
    var coming: Bool { self == .poll || self == .task }
}
