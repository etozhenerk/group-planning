package dev.groupplanning.android.session

import android.content.Context
import androidx.lifecycle.SavedStateHandle
import androidx.test.core.app.ApplicationProvider
import dev.groupplanning.android.data.api.ApiClient
import dev.groupplanning.android.data.api.ApiOrigin
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import dev.groupplanning.android.data.api.HttpTransport
import dev.groupplanning.android.data.api.WireResponse
import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.FeedbackReceipt
import dev.groupplanning.android.data.media.MediaSelection
import dev.groupplanning.android.data.repository.ServiceRepository
import dev.groupplanning.android.data.session.AndroidSessionKey
import dev.groupplanning.android.data.session.SessionCipher
import dev.groupplanning.android.data.support.SupportDraftStorage
import dev.groupplanning.android.state.SupportViewModel
import java.io.File
import java.security.KeyStore
import java.util.UUID
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeout
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.jsonObject
import okhttp3.Request
import okio.Buffer
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class FeedbackRetryDeviceTests {
    @Test fun lostResponseRestoresFrozenFormAndRepeatsIdenticalPublicRequest() = runBlocking {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val alias = "somewhere.feedback-retry-test.${UUID.randomUUID()}"
        val file = File(context.noBackupFilesDir, alias)
        val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
        try {
            val requests = mutableListOf<Request>()
            val bodies = mutableListOf<String>()
            val transport = HttpTransport { request ->
                requests += request
                bodies += Buffer().also { request.body?.writeTo(it) }.readUtf8()
                if (requests.size == 1) throw ClientFailure(FailureKind.Network)
                WireResponse(
                    201,
                    "application/json",
                    apiJson.encodeToString(
                        FeedbackReceipt(UUID.randomUUID(), "SW-TEST-42", "accepted"),
                    ),
                )
            }
            val repository = ServiceRepository(
                ApiClient(ApiOrigin("https://example.test"), transport),
                null,
                MediaSelection(context),
                SupportDraftStorage(file, SessionCipher(AndroidSessionKey(alias), "test")),
            )
            val first = withContext(Dispatchers.Main) {
                SupportViewModel(repository, SavedStateHandle(), scope)
            }
            withTimeout(5_000) { first.state.first { !it.busy } }
            withContext(Dispatchers.Main) {
                first.edit { it.copy(description = "Проверка повторной отправки обращения") }
                first.send()
            }
            withTimeout(5_000) { first.state.first { it.error && !it.busy } }
            assertTrue(first.state.value.frozen)
            assertFalse(file.readText().contains("Проверка повторной"))
            val restored = withContext(Dispatchers.Main) {
                SupportViewModel(repository, SavedStateHandle(), scope)
            }
            withTimeout(5_000) { restored.state.first { !it.busy } }
            assertTrue(restored.state.value.frozen)
            assertEquals(first.state.value.description, restored.state.value.description)
            withContext(Dispatchers.Main) { restored.send() }
            withTimeout(5_000) { restored.state.first { it.receipt != null } }
            assertEquals("SW-TEST-42", restored.state.value.receipt?.reference)
            assertEquals(bodies.first(), bodies.last())
            assertEquals(
                requests.first().header("Idempotency-Key"),
                requests.last().header("Idempotency-Key"),
            )
            assertTrue(requests.all { it.url.host == "example.test" })
            assertTrue(requests.all { it.header("Authorization") == null })
            val payload = apiJson.parseToJsonElement(bodies.first()).jsonObject
            assertNull(payload["diagnostics"])
            assertNull(payload["screenshot"])
            assertFalse(file.exists())
        } finally {
            scope.cancel()
            file.delete()
            KeyStore.getInstance("AndroidKeyStore").apply {
                load(null)
                deleteEntry(alias)
            }
        }
    }
}
