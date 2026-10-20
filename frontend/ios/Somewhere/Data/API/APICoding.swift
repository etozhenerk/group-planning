import Foundation

enum APICoding {
    static func decode<Value: Decodable>(_ type: Value.Type, from data: Data) throws -> Value {
        try JSONDecoder().decode(type, from: data)
    }

    static func encode<Value: Encodable>(_ value: Value) throws -> Data {
        try JSONEncoder().encode(value)
    }
}
