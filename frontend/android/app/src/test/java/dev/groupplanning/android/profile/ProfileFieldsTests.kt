package dev.groupplanning.android.profile

import dev.groupplanning.android.data.api.models.OwnProfile
import dev.groupplanning.android.data.api.models.UserProfile
import dev.groupplanning.android.ui.profile.profileBirthday
import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Test

class ProfileFieldsTests {
    @Test fun partialBirthdayDoesNotInventMissingParts() {
        val cases = mapOf(
            "1990-12-23" to "23 декабря 1990",
            "0000-12-23" to "23 декабря",
            "1990-00-00" to "1990",
            "1990-12-00" to "декабрь 1990",
            "1990-00-23" to "23 число, 1990",
            "0000-00-23" to "23 число",
            "0000-12-00" to "декабрь",
            "0000-02-29" to "29 февраля",
        )
        cases.forEach { (input, expected) ->
            assertEquals(expected, profileBirthday(input) { "$it число" })
        }
        listOf(null, "", "0000-00-00", "1990-02-29", "2000-13-00", "bad").forEach {
            assertNull(profileBirthday(it) { day -> "$day число" })
        }
    }

    @Test fun privateFieldsAreOptionalAndNeverPartOfPublicUser() {
        val json = Json { ignoreUnknownKeys = true }
        val old = """{"id":"00000000-0000-4000-8000-000000000001","display_name":"Саша"}"""
        val legacy = json.decodeFromString<OwnProfile>(old)
        assertNull(legacy.login)
        assertNull(legacy.birthday)
        val extended = old.dropLast(1) +
            ""","login":"sasha","first_name":"Александр","last_name":null,"birthday":"0000-12-23","sex":"male"}"""
        val profile = json.decodeFromString<OwnProfile>(extended)
        assertEquals("Александр", profile.firstName)
        assertNull(profile.lastName)
        assertEquals("0000-12-23", profile.birthday)
        val public = json.encodeToString(UserProfile.serializer(), json.decodeFromString(extended))
        assertFalse(public.contains("birthday"))
        assertFalse(public.contains("first_name"))
        assertFalse(public.contains("login"))
    }
}
