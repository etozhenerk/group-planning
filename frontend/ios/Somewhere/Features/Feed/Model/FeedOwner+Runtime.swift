import Foundation

extension FeedOwner {
    func run() async {
        guard current else { return }
        active = true
        let version = generation
        defer { if generation == version, Task.isCancelled { suspend() } }
        do {
            _ = try await session.send(SessionRequests.me, as: CurrentSession.self)
            guard current, generation == version else { return }
            try await discoverCapabilities(version: version)
            await refresh()
            guard current, generation == version else { return }
            if loaded, problem == nil { try await prepareRuntime(version: version) }
            startFallback(delay: transportStarted ? 10 : 3)
        } catch {
            if current, generation == version, !(error is CancellationError) {
                failed(error, version: version)
                startFallback(delay: 3)
            }
        }
        while !Task.isCancelled, current, generation == version {
            do { try await Task.sleep(for: .seconds(60)) } catch { return }
        }
    }

    private func discoverCapabilities(version: UUID) async throws {
        let value: ChatCapabilities?
        do {
            value = try await session.send(ChatRequests.capabilities, as: ChatCapabilities.self)
        } catch {
            guard (error as? ClientFailure)?.statusCode == 404 else { throw error }
            value = nil
        }
        guard current, generation == version else { throw ClientFailure.staleSession }
        capabilities = value?.protocolVersion == 1 ? value : nil
        capabilitiesLoaded = true
        reads.enabled = capabilities?.readState == true
    }

    private func prepareRuntime(version: UUID) async throws {
        reads.resume()
        do {
            try await restoreLocal()
            guard current, active, generation == version else { return }
            drainQueue()
        } catch { storageProblem = "Не удалось сохранить сообщение на устройстве" }
        guard !transportStarted, capabilities?.sync == true, capabilities?.realtime == true else {
            return
        }
        try realtime.connect(
            origin: session.api.origin, token: session.realtimeToken(), meeting: id
        ) {
            [weak self] event in
            guard let self, self.active, self.current, self.generation == version else { return }
            self.receive(event)
        }
        transportStarted = true
    }

    func synchronizationSucceeded() {
        guard subscriptionReady, active, current else { return }
        realtimeReady = true
        fallbackTask?.cancel()
        fallbackTask = nil
    }

    func receive(_ event: ChatRealtimeEvent) {
        switch event {
        case .subscribed:
            subscriptionReady = true
            realtimeReady = false
            requestSync()
        case .hint(let data):
            guard let hint = try? JSONDecoder().decode(ChatHint.self, from: data),
                hint.meetingID == id
            else { return }
            if hint.accessRevoked == true {
                session.updateMeetingAccess(id, allowed: false)
                clear()
            } else {
                requestSync()
            }
        case .disconnected(let code):
            subscriptionReady = false
            realtimeReady = false
            if code >= 3500 {
                let version = generation
                refreshTask = Task {
                    do {
                        _ = try await session.send(SessionRequests.me, as: CurrentSession.self)
                    } catch { failed(error, version: version) }
                }
            }
            startFallback(delay: 10)
        case .unsubscribed(let code):
            subscriptionReady = false
            realtimeReady = false
            if code == 2003 || code == 103 {
                requestSync()
            }
            startFallback(delay: 10)
        }
    }

    func requestSync() {
        syncRequested = true
        guard hintTask == nil else { return }
        let version = generation
        hintTask = Task {
            defer { if generation == version { hintTask = nil } }
            do { try await Task.sleep(for: .milliseconds(80)) } catch { return }
            guard active, current, generation == version else { return }
            await refresh()
            if current, generation == version { drainQueue() }
        }
    }

    func startFallback(delay: Double) {
        guard active, fallbackTask == nil else { return }
        let version = generation
        fallbackTask = Task {
            defer { if generation == version { fallbackTask = nil } }
            var wait = delay
            while active, current, generation == version, !realtimeReady {
                do { try await Task.sleep(for: .seconds(wait)) } catch { return }
                guard active, current, generation == version, !realtimeReady else { return }
                do {
                    if !capabilitiesLoaded { try await discoverCapabilities(version: version) }
                    await refresh()
                    guard active, current, generation == version else { return }
                    if loaded, problem == nil { try await prepareRuntime(version: version) }
                } catch { failed(error, version: version) }
                wait = min(30, max(3, wait == 10 ? 3 : wait * 2)) * Double.random(in: 0.9...1.1)
            }
        }
    }
}

private struct ChatHint: Decodable {
    let meetingID: UUID?
    let accessRevoked: Bool?
    enum CodingKeys: String, CodingKey {
        case meetingID = "meeting_id"
        case accessRevoked = "access_revoked"
    }
}
