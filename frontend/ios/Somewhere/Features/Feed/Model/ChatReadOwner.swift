import Foundation
import Observation

@MainActor @Observable
final class ChatReadOwner {
    let meetingID: UUID
    let session: SessionStore
    let lease: PrivateData.Lease?
    var enabled = false
    var active = false
    var obscured = false
    var actual: ServerCounter = .zero
    var unread: ServerCounter?
    var divider: UUID?
    var counts: [UUID: ServerCounter] = [:]
    private var initialized = false
    private var stateVersion: ServerCounter = .zero
    private var desired: ServerCounter = .zero
    private var visibleCandidate: ServerCounter?
    private var lastVisible: [FeedEntry] = []
    private var visibleOwn: [UUID] = []
    private var receiptVersion: ServerCounter = .zero
    private var receiptRequested = false
    private var generation = UUID()
    private var lastSent = Date.distantPast
    @ObservationIgnored private var visibilityTask: Task<Void, Never>?
    @ObservationIgnored private var markerTask: Task<Void, Never>?
    @ObservationIgnored private var receiptTask: Task<Void, Never>?

    init(meetingID: UUID, session: SessionStore) {
        self.meetingID = meetingID
        self.session = session
        lease = try? session.privateData.lease(for: meetingID)
    }
    var current: Bool {
        session.status == .authenticated && lease.map { session.privateData.isCurrent($0) } == true
    }

    func apply(
        actual: ServerCounter?, count: ServerCounter?, firstUnread: UUID?,
        projectionVersion: ServerCounter? = nil
    ) {
        guard enabled, current, let actual else { return }
        if let projectionVersion {
            guard projectionVersion >= stateVersion else { return }
            stateVersion = projectionVersion
        }
        self.actual = max(self.actual, actual)
        unread = count
        if !initialized {
            divider = firstUnread
            initialized = true
        }
        if let count, var meetings = session.privateData.meetings.value,
            let index = meetings.firstIndex(where: { $0.id == meetingID })
        {
            meetings[index].unreadCount = count
            meetings[index].firstUnread = firstUnread
            let request = session.privateData.meetings.begin()
            session.privateData.meetings.succeed(meetings, requestID: request)
        }
    }

    func resetProjectionVersions() {
        stateVersion = .zero
        receiptVersion = .zero
    }

    func visible(_ entries: [FeedEntry], unobscured: Bool) {
        lastVisible = entries
        let own = Array(entries.filter { $0.actor.id == session.profile?.id }.map(\.id).prefix(100))
        if visibleOwn != own {
            visibleOwn = own
            refreshCounts()
        }
        let candidate =
            unobscured && active && !obscured && enabled && current
            ? entries.filter { $0.kind == "message" }.map(\.sequence).max() : nil
        guard candidate != visibleCandidate else { return }
        visibleCandidate = candidate
        visibilityTask?.cancel()
        visibilityTask = nil
        guard let candidate, candidate > actual else { return }
        let version = generation
        visibilityTask = Task {
            do { try await Task.sleep(for: .milliseconds(500)) } catch { return }
            guard current, active, !obscured, enabled, generation == version,
                visibleCandidate == candidate
            else { return }
            desired = max(desired, candidate)
            sendMarker()
        }
    }

    func cover(_ covered: Bool) {
        obscured = covered
        visible(lastVisible, unobscured: !covered)
    }

    func resume() {
        active = true
        visibleCandidate = nil
        visible(lastVisible, unobscured: !obscured)
        refreshCounts()
        sendMarker()
    }

    func refreshCounts() {
        guard enabled, current, active, !visibleOwn.isEmpty else { return }
        receiptRequested = true
        guard receiptTask == nil else { return }
        let version = generation
        receiptTask = Task {
            defer { if generation == version { receiptTask = nil } }
            repeat {
                receiptRequested = false
                let ids = visibleOwn
                do {
                    let page = try await session.send(
                        ChatReadRequests.receipts(meetingID, entries: ids),
                        as: ChatReceiptPage.self)
                    guard current, generation == version else { return }
                    guard page.receipts.allSatisfy({ ids.contains($0.entryID) }) else { return }
                    if page.projectionVersion >= receiptVersion {
                        for receipt in page.receipts {
                            counts[receipt.entryID] = receipt.readerCount
                        }
                        receiptVersion = page.projectionVersion
                    }
                } catch { return }
            } while receiptRequested && active && current
        }
    }

    func pause() {
        // Only a previously qualified visible end may be flushed while leaving the screen.
        if enabled, current, desired > actual {
            let through = desired
            let session = session
            let meetingID = meetingID
            let lease = lease
            Task {
                guard let lease, session.privateData.isCurrent(lease) else { return }
                _ = try? await session.send(
                    ChatReadRequests.marker(meetingID, through: through), as: ChatReadState.self)
            }
        }
        active = false
        generation = UUID()
        visibilityTask?.cancel()
        markerTask?.cancel()
        receiptTask?.cancel()
        visibilityTask = nil
        markerTask = nil
        receiptTask = nil
        visibleCandidate = nil
        if !current {
            counts = [:]
            divider = nil
            unread = nil
        }
    }

    private func sendMarker() {
        guard enabled, current, active, !obscured, desired > actual, markerTask == nil else {
            return
        }
        let version = generation
        markerTask = Task {
            defer { if generation == version { markerTask = nil } }
            var retryDelay: Double = 3
            while current, active, !obscured, generation == version, desired > actual {
                do {
                    let wait = max(0, 1 - Date().timeIntervalSince(lastSent))
                    if wait > 0 { try await Task.sleep(for: .seconds(wait)) }
                    guard current, active, !obscured, generation == version else { return }
                    let through = desired
                    lastSent = Date()
                    let value = try await session.send(
                        ChatReadRequests.marker(meetingID, through: through), as: ChatReadState.self
                    )
                    guard current, generation == version else { return }
                    apply(
                        actual: value.readThroughSequence, count: value.unreadCount,
                        firstUnread: value.firstUnread, projectionVersion: value.projectionVersion)
                    retryDelay = 3
                } catch {
                    guard !(error is CancellationError), current, active, generation == version
                    else { return }
                    do { try await Task.sleep(for: .seconds(retryDelay)) } catch { return }
                    retryDelay = min(30, retryDelay * 2)
                }
            }
        }
    }
}
