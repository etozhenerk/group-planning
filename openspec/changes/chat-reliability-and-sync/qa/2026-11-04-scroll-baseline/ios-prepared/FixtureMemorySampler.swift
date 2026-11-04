import Darwin
import Foundation

// Opt-in, QA host only. Samples the application's own task, not XCTestRunner.
@MainActor
enum FixtureMemorySampler {
    private static var sampling: Task<Void, Never>?

    static func startIfRequested() {
        guard sampling == nil,
            let path = ProcessInfo.processInfo.environment["SOMEWHERE_UI_MEMORY_SAMPLES"]
        else { return }
        let url = URL(fileURLWithPath: path)
        guard FileManager.default.createFile(atPath: path, contents: nil),
            let handle = try? FileHandle(forWritingTo: url)
        else { return }
        sampling = Task { @MainActor in
            defer { try? handle.close() }
            while !Task.isCancelled {
                var info = task_vm_info_data_t()
                var count = mach_msg_type_number_t(
                    MemoryLayout<task_vm_info_data_t>.size / MemoryLayout<integer_t>.size)
                let status = withUnsafeMutablePointer(to: &info) { pointer in
                    pointer.withMemoryRebound(to: integer_t.self, capacity: Int(count)) {
                        task_info(mach_task_self_, task_flavor_t(TASK_VM_INFO), $0, &count)
                    }
                }
                if status == KERN_SUCCESS {
                    do {
                        let sample: [String: Any] = [
                            "uptime": ProcessInfo.processInfo.systemUptime,
                            "physicalFootprintBytes": info.phys_footprint,
                            "residentBytes": info.resident_size,
                            "compressedBytes": info.compressed,
                        ]
                        var data = try JSONSerialization.data(withJSONObject: sample)
                        data.append(0x0A)
                        try handle.write(contentsOf: data)
                    } catch { return }
                }
                do { try await Task.sleep(for: .milliseconds(500)) } catch { return }
            }
        }
    }
}
