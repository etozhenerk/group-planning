import CoreGraphics
import Foundation
import XCTest

/// QA-only. Wait for independent semantic readiness before calling this helper.
@MainActor
enum SettledGeometry {
    struct Frame: Codable, Equatable {
        let x: Double
        let y: Double
        let width: Double
        let height: Double
        init?(_ rect: CGRect) {
            guard !rect.isNull, !rect.isInfinite, rect.width > 0, rect.height > 0 else { return nil }
            x = rect.minX; y = rect.minY; width = rect.width; height = rect.height
        }
        func near(_ other: Frame, tolerance: Double) -> Bool {
            zip([x, y, width, height], [other.x, other.y, other.width, other.height])
                .allSatisfy { abs($0.0 - $0.1) <= tolerance }
        }
    }
    struct Sample: Codable {
        let elapsed: Double
        let foreground: Bool
        let target: Frame?
        let anchors: [String: Frame]
    }
    struct Record: Codable {
        let settled: Bool
        let capturedAt: String
        let stableFor: Double
        let beforeCapture: Frame?
        let afterCapture: Frame?
        let samples: [Sample]
        let captureError: String?
    }
    enum Failure: Error { case notSettled, captureFailed }

    /// Captures evidence even on failure; expected dimensions must be asserted AFTER return.
    static func captureThenMeasure(
        app: XCUIApplication, target: XCUIElement, anchors: [String: XCUIElement] = [:],
        requireHittable: Bool = false, visibleBounds: (() -> CGRect)? = nil,
        timeout: TimeInterval = 8, stableDuration: TimeInterval = 0.7,
        tolerance: Double = 0.25, recordURL: URL, capture: () throws -> Void
    ) async throws -> Record {
        let start = Date()
        var samples: [Sample] = []
        var previous: Sample?
        var stableSince: Date?
        var settled = false
        var stableSamples = 0
        var observedStableFor = 0.0
        while Date().timeIntervalSince(start) < timeout {
            var observed: [String: Frame] = [:]
            if let window = Frame(app.windows.firstMatch.frame) { observed["nativeWindow"] = window }
            for (key, element) in anchors where element.exists {
                if let frame = Frame(element.frame) { observed[key] = frame }
            }
            let frame = target.exists ? Frame(target.frame) : nil
            let sample = Sample(elapsed: Date().timeIntervalSince(start),
                foreground: app.state == .runningForeground, target: frame, anchors: observed)
            samples.append(sample)
            let visible = visibleBounds.map { bounds in
                target.exists && bounds().insetBy(dx: -0.5, dy: -0.5).contains(target.frame)
            } ?? true
            let valid = sample.foreground && frame != nil && visible
                && (!requireHittable || target.isHittable)
                && observed.count == anchors.count + 1
            let unchanged = previous.map { old in
                guard let oldFrame = old.target, let frame else { return false }
                return frame.near(oldFrame, tolerance: tolerance)
                    && Set(old.anchors.keys) == Set(observed.keys)
                    && observed.allSatisfy { key, value in
                        old.anchors[key].map { value.near($0, tolerance: tolerance) } == true
                    }
            } ?? false
            if valid && unchanged {
                stableSamples += 1
                if stableSince == nil { stableSince = Date() }
                observedStableFor = Date().timeIntervalSince(stableSince ?? Date())
                if stableSamples >= 4 && observedStableFor >= stableDuration {
                    settled = true
                    break
                }
            } else {
                stableSamples = 0; stableSince = nil; observedStableFor = 0
            }
            previous = sample
            try await Task.sleep(for: .milliseconds(100))
        }
        let before = target.exists ? Frame(target.frame) : nil
        var captureError: String?
        do { try capture() } catch { captureError = String(describing: error) }
        let after = target.exists ? Frame(target.frame) : nil
        let unchangedDuringCapture = before.flatMap { a in
            after.map { a.near($0, tolerance: tolerance) }
        } ?? false
        let result = Record(settled: settled && unchangedDuringCapture,
            capturedAt: Date().ISO8601Format(), stableFor: observedStableFor,
            beforeCapture: before, afterCapture: after, samples: samples, captureError: captureError)
        try FileManager.default.createDirectory(at: recordURL.deletingLastPathComponent(),
            withIntermediateDirectories: true)
        let encoder = JSONEncoder(); encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        try encoder.encode(result).write(to: recordURL)
        if captureError != nil { throw Failure.captureFailed }
        guard result.settled else { throw Failure.notSettled }
        return result
    }
}
