import Foundation

extension MeetingListOwner {
    func observe() async {
        let run = UUID()
        streamGeneration = run
        defer {
            if streamGeneration == run {
                realtime.disconnect()
                realtimeReady = false
                listRefreshTask?.cancel()
                listRefreshTask = nil
            }
        }
        await load()
        do {
            let capability = try await session.send(
                ChatRequests.capabilities, as: ChatCapabilities.self)
            guard current, !Task.isCancelled, streamGeneration == run else { return }
            if capability.protocolVersion == 1, capability.realtime {
                try realtime.connect(
                    origin: session.api.origin, token: session.realtimeToken(), meeting: nil
                ) {
                    [weak self] event in
                    guard let self, self.current, self.streamGeneration == run else { return }
                    switch event {
                    case .subscribed:
                        self.realtimeReady = true
                        self.refreshFromHint()
                    case .hint:
                        self.refreshFromHint()
                    case .disconnected, .unsubscribed:
                        self.realtimeReady = false
                    }
                }
            }
        } catch {}
        while !Task.isCancelled && current && streamGeneration == run {
            do {
                try await Task.sleep(
                    for: .seconds(
                        realtimeReady
                            ? 3
                            : CalendarRefresh.delay(
                                page: page.value ?? month.value, failures: failures, now: Date())))
            } catch { return }
            if !realtimeReady { await load() }
        }
    }

    private func refreshFromHint() {
        refreshRequested = true
        guard listRefreshTask == nil else { return }
        let run = streamGeneration
        listRefreshTask = Task {
            defer { if streamGeneration == run { listRefreshTask = nil } }
            do { try await Task.sleep(for: .milliseconds(80)) } catch { return }
            repeat {
                refreshRequested = false
                guard current, streamGeneration == run, !Task.isCancelled else { return }
                await load()
            } while refreshRequested
        }
    }
}
