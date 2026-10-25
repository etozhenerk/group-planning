package dev.groupplanning.android.session

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import dev.groupplanning.android.data.api.ApiClient
import dev.groupplanning.android.data.api.ApiOrigin
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import dev.groupplanning.android.data.api.HttpTransport
import dev.groupplanning.android.data.api.WireResponse
import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.ApiInstant
import dev.groupplanning.android.data.api.models.CurrentSession
import dev.groupplanning.android.data.api.models.MediaEnvelope
import dev.groupplanning.android.data.api.models.MeetingMedia
import dev.groupplanning.android.data.api.models.UserProfile
import dev.groupplanning.android.data.media.MediaSelection
import dev.groupplanning.android.data.media.MediaStorage
import dev.groupplanning.android.data.media.SelectedMedia
import dev.groupplanning.android.data.repository.MediaRepository
import dev.groupplanning.android.data.session.AndroidSessionKey
import dev.groupplanning.android.data.session.CredentialStorage
import dev.groupplanning.android.data.session.SessionCipher
import dev.groupplanning.android.data.session.SessionRepository
import dev.groupplanning.android.data.session.StoredSession
import java.io.File
import java.security.KeyStore
import java.util.UUID
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.encodeToString
import okhttp3.Request
import okio.Buffer
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class MediaRetryDeviceTests {
    @Test fun partialSuccessAndLostPublishSurviveReopeningWithTheSameKeys() = runBlocking {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val alias = "somewhere.media-retry-test.${UUID.randomUUID()}"
        val folder = File(context.noBackupFilesDir, alias)
        try {
            val user = UserProfile(UUID.randomUUID(), "Тест")
            val meeting = UUID.randomUUID()
            val expiry = ApiInstant("2099-01-01T00:00:00Z")
            val requests = mutableListOf<Request>()
            val records = mutableMapOf<UUID, MeetingMedia>()
            var failPublish = true
            val transport = HttpTransport { request ->
                requests += request
                val path = request.url.pathSegments
                if (path.last() == "me") {
                    WireResponse(
                        200,
                        "application/json",
                        apiJson.encodeToString(CurrentSession(user, expiry)),
                    )
                } else {
                    val id = if (path.last() == "uploads") {
                        UUID.fromString(request.header("Idempotency-Key"))
                    } else {
                        UUID.fromString(path[path.lastIndex - 1])
                    }
                    val media = records.getOrPut(id) {
                        MeetingMedia(
                            id, meeting, "photo.png", "image/png", 3,
                            "photo", "message", "pending", createdAt = expiry, uploadedBy = user,
                        )
                    }
                    if (path.last() == "publish" && failPublish) {
                        failPublish = false
                        throw ClientFailure(FailureKind.Network)
                    }
                    val result = if (path.last() == "publish") {
                        media.copy(status = "published")
                    } else {
                        media
                    }
                    records[id] = result
                    WireResponse(
                        if (path.last() == "uploads") 201 else 200,
                        "application/json",
                        apiJson.encodeToString(MediaEnvelope(result)),
                    )
                }
            }
            val credential = StoredSession("test-token", expiry)
            val storage = object : CredentialStorage {
                override fun load() = credential
                override fun save(credential: StoredSession) = Unit
                override fun clear() = Unit
            }
            val session = SessionRepository(
                ApiClient(ApiOrigin("https://example.test"), transport),
                storage,
            )
            session.restore()
            val access = session.meetingAccess(meeting)
            val encrypted = MediaStorage(folder, SessionCipher(AndroidSessionKey(alias), "test"))
            fun repository() = MediaRepository(session, encrypted, MediaSelection(context))
            val first = SelectedMedia(
                UUID.randomUUID().toString(),
                UUID.randomUUID().toString(),
                user.id.toString(),
                meeting.toString(),
                "one.pdf",
                "application/pdf",
                3,
                "message",
                caption = "Правила 🍒 игры",
            )
            val second = first.copy(
                key = UUID.randomUUID().toString(),
                publishKey = UUID.randomUUID().toString(),
                fileName = "two.png",
            )
            encrypted.save(first, byteArrayOf(1, 2, 3))
            encrypted.save(second, byteArrayOf(4, 5, 6))
            try {
                repository().send(access, first) { }
                error("Publish must simulate a lost response")
            } catch (failure: ClientFailure) {
                assertEquals(FailureKind.Network, failure.kind)
            }
            repository().send(access, second) { }
            val reopened = repository().records(access)
            assertTrue(reopened.single { it.key == second.key }.published)
            val retry = reopened.single { it.key == first.key }
            assertEquals(first.publishKey, retry.publishKey)
            assertEquals(first.caption, retry.caption)
            assertTrue(retry.submissionStarted)
            assertTrue(repository().send(access, retry) { }.published)
            val initialization = requests.filter { it.url.pathSegments.last() == "uploads" }
            assertEquals(2, initialization.size)
            val publishes = requests.filter {
                it.url.pathSegments.last() == "publish" &&
                    it.header("Idempotency-Key") == first.publishKey
            }
            assertEquals(2, publishes.size)
            val bodies = publishes.map { request ->
                Buffer().also { request.body!!.writeTo(it) }.readUtf8()
            }
            assertEquals(bodies.first(), bodies.last())
            assertTrue(bodies.first().contains("Правила 🍒 игры"))
            assertTrue(requests.all { it.url.host == "example.test" })
            assertTrue(requests.all { it.header("Authorization") == "Bearer test-token" })
        } finally {
            folder.deleteRecursively()
            KeyStore.getInstance("AndroidKeyStore").apply {
                load(null)
                deleteEntry(alias)
            }
        }
    }
}
