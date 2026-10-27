import Foundation

extension FeedOwner {
    func loadNewer() {
        guard current, hasNewer, !loadingNewer else { return }
        loadingNewer = true
        let version = generation
        Task {
            defer { if generation == version { loadingNewer = false } }
            do {
                guard let last = records.last?.sequence else { return }
                let page = try await session.send(
                    FeedRequests.page(id, after: last), as: FeedPage.self)
                try Task.checkCancellation()
                guard current, generation == version else { return }
                guard page.entries.allSatisfy({ $0.sequence > last }),
                    !page.hasMore || !page.entries.isEmpty
                else { throw ClientFailure.invalidResponse }
                try merge(page.entries)
                hasNewer = page.hasMore
                newerProblem = nil
                trimWindow()
            } catch {
                if !current || (error as? ClientFailure)?.statusCode == 404 {
                    failed(error, version: version)
                }
                if current, generation == version, !(error is CancellationError) {
                    newerProblem = "Не удалось загрузить сообщения"
                }
            }
        }
    }

    func jumpToLatest() {
        guard current else { return }
        anchorID = nil
        followingLatest = true
        newMessageCount = 0
        guard hasNewer else { return }
        let version = generation
        refreshTask = Task {
            do {
                let page = try await session.send(FeedRequests.page(id), as: FeedPage.self)
                try Task.checkCancellation()
                guard current, generation == version else { return }
                records = []
                try merge(page.entries)
                hasHistory = page.hasMore
                hasNewer = false
            } catch { failed(error, version: version) }
        }
    }
}
