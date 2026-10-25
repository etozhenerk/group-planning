import Foundation
import Testing

@testable import Somewhere

@Suite("Private Yandex profile data")
struct ProfilePersonalTests {
    @Test func newPrivateFieldsDecode() throws {
        let data = Data(
            """
            {"id":"00000000-0000-4000-8000-000000000001","display_name":"Саша",
             "provider":"yandex","login":"sasha","first_name":"Александр",
             "last_name":"Иванов","birthday":"0000-12-23","sex":"male"}
            """.utf8)
        let profile = try APICoding.decode(AccountProfile.self, from: data)
        #expect(profile.login == "sasha")
        #expect(profile.firstName == "Александр")
        #expect(profile.lastName == "Иванов")
        #expect(ProfilePersonalCopy.birthday(profile.birthday) == "23 декабря")
        #expect(ProfilePersonalCopy.sex(profile.sex) == "Мужской")
    }

    @Test(arguments: [
        ("1990-12-23", "23 декабря 1990"), ("0000-12-23", "23 декабря"),
        ("1990-00-00", "1990"), ("1990-12-00", "декабрь 1990"),
        ("1990-00-23", "23 число, 1990"), ("0000-00-23", "23 число"),
        ("0000-12-00", "декабрь"), ("0000-00-00", "Не указано"),
        ("0000-02-29", "29 февраля"), ("2023-02-29", "Не указано"),
        ("1990-13-01", "Не указано"), ("1990-01-32", "Не указано"),
        ("1990", "Не указано"), ("bad", "Не указано"),
    ])
    func partialBirthdayNeverInventsMissingComponents(input: String, expected: String) {
        #expect(ProfilePersonalCopy.birthday(input) == expected)
    }

    @Test func missingAndUnknownDataIsExplicit() {
        #expect(ProfilePersonalCopy.birthday(nil) == "Не указано")
        #expect(ProfilePersonalCopy.value(nil) == "Не указано")
        #expect(ProfilePersonalCopy.value(" \n") == "Не указано")
        #expect(ProfilePersonalCopy.sex("female") == "Женский")
        #expect(ProfilePersonalCopy.sex("unknown") == "Не указано")
    }
}
