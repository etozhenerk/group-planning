enum PreparationAction: String, Sendable, CaseIterable {
    case accept, decline, cancel, complete

    func allowed(_ task: PreparationTask) -> Bool {
        switch self {
        case .accept: task.canAccept
        case .decline: task.canDecline
        case .cancel: task.canCancel
        case .complete: task.canComplete
        }
    }
}
