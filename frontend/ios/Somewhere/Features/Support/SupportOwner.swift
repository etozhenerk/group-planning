import Foundation
import Observation
import UIKit

@MainActor @Observable
final class SupportOwner {
    let api: APIClient
    var kind: SupportKind
    var description = ""
    var screen: String
    var email = ""
    var screenshot: PendingMedia?
    var diagnostics = false
    var sending = false
    var problem: String?
    var reference: String?
    var fieldErrors: [String: String] = [:]
    private var generation = UUID()
    private var previousBody: Data?
    private var requestID = UUID()
    init(api: APIClient, kind: SupportKind, screen: String) {
        self.api = api
        self.kind = kind
        self.screen = screen
    }
    var valid: Bool {
        validationErrors.isEmpty
    }
    private var normalizedEmail: String {
        email.trimmingCharacters(in: .whitespacesAndNewlines)
    }
    private var validationErrors: [String: String] {
        var errors: [String: String] = [:]
        let count = description.trimmingCharacters(in: .whitespacesAndNewlines).count
        if count < 10 {
            errors["description"] = "Расскажите подробнее — нужно хотя бы 10 символов."
        } else if count > 3000 {
            errors["description"] = "Сократите сообщение до 3000 символов."
        }
        if !normalizedEmail.isEmpty
            && (!normalizedEmail.contains("@") || normalizedEmail.contains(" "))
        {
            errors["email"] = "Проверьте адрес почты или оставьте поле пустым."
        }
        if (screenshot?.data.count ?? 0) > 5 * 1024 * 1024 {
            errors["screenshot"] = "Выберите скриншот до 5 МБ."
        }
        return errors
    }
    func submit() async {
        guard !sending else { return }
        fieldErrors = validationErrors
        guard fieldErrors.isEmpty else { return }
        let version = generation
        sending = true
        problem = nil
        fieldErrors = [:]
        defer { if version == generation { sending = false } }
        do {
            struct Screenshot: Encodable {
                let fileName: String
                let contentType: String
                let dataBase64: String
                enum CodingKeys: String, CodingKey {
                    case fileName = "file_name"
                    case contentType = "content_type"
                    case dataBase64 = "data_base64"
                }
            }
            struct Diagnostics: Encodable {
                let clientVersion: String
                let platform: String
                let os: String
                enum CodingKeys: String, CodingKey {
                    case clientVersion = "client_version"
                    case platform, os
                }
            }
            struct Content: Encodable {
                let kind: SupportKind
                let description: String
                let screen: String
                let email: String?
                let screenshot: Screenshot?
                let diagnostics: Diagnostics?
            }
            struct Input: Encodable {
                let clientRequestID: String
                let content: Content
                func encode(to encoder: any Encoder) throws {
                    try content.encode(to: encoder)
                    var container = encoder.container(keyedBy: CodingKeys.self)
                    try container.encode(clientRequestID, forKey: .clientRequestID)
                }
                enum CodingKeys: String, CodingKey { case clientRequestID = "client_request_id" }
            }
            struct Receipt: Decodable {
                let id: UUID
                let reference: String
                let status: String
            }
            let content = Content(
                kind: kind,
                description: description.trimmingCharacters(in: .whitespacesAndNewlines),
                screen: screen, email: normalizedEmail.isEmpty ? nil : normalizedEmail,
                screenshot: screenshot.map {
                    Screenshot(
                        fileName: $0.name, contentType: $0.contentType,
                        dataBase64: $0.data.base64EncodedString())
                },
                diagnostics: diagnostics
                    ? Diagnostics(
                        clientVersion: AppVersion.version + " (" + AppVersion.build + ")",
                        platform: "ios", os: UIDevice.current.systemVersion) : nil)
            let body = try APICoding.encode(content)
            if previousBody != body {
                requestID = UUID()
                previousBody = body
            }
            let request = try APIRequest.json(
                path: ["support", "feedback"], method: .post,
                body: Input(clientRequestID: requestID.uuidString.lowercased(), content: content),
                key: requestID,
                status: 201)
            let result = try await api.send(request, as: Receipt.self)
            try Task.checkCancellation()
            guard version == generation else { return }
            guard result.status == "accepted", !result.reference.isEmpty else {
                throw ClientFailure.invalidResponse
            }
            reference = result.reference
        } catch {
            guard version == generation, !(error is CancellationError) else { return }
            if case .http(_, let details) = error as? ClientFailure {
                fieldErrors = details?.fieldErrors ?? [:]
            }
            problem =
                (error as? ClientFailure)?.statusCode == 429
                ? "Слишком много обращений. Попробуйте отправить позже."
                : "Не удалось отправить обращение. Проверьте поля и повторите попытку."
        }
    }
    func cancel() {
        generation = UUID()
        sending = false
    }
}
