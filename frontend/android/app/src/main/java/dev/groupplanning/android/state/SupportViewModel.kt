package dev.groupplanning.android.state

import android.net.Uri
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dev.groupplanning.android.BuildConfig
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.FeedbackReceipt
import dev.groupplanning.android.data.media.SelectedBytes
import dev.groupplanning.android.data.repository.ServiceRepository
import java.io.IOException
import java.util.Base64
import java.util.UUID
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

internal data class SupportState(
    val kind: String = "problem",
    val description: String = "",
    val screen: String = "other",
    val email: String = "",
    val diagnostics: Boolean = false,
    val screenshot: SelectedBytes? = null,
    val selecting: Boolean = false,
    val busy: Boolean = false,
    val frozen: Boolean = false,
    val error: Boolean = false,
    val fileError: Boolean = false,
    val validation: Boolean = false,
    val fieldErrors: Set<String> = emptySet(),
    val receipt: FeedbackReceipt? = null,
)

internal class SupportViewModel(
    private val repository: ServiceRepository,
    private val saved: SavedStateHandle,
    scope: CoroutineScope,
) : ViewModel(scope) {
    private val mutable = MutableStateFlow(
        SupportState(
            kind = saved["support-kind"] ?: "problem",
            description = saved["support-description"] ?: "",
            screen = saved["support-screen"] ?: "other",
            email = saved["support-email"] ?: "",
            diagnostics = saved["support-diagnostics"] ?: false,
            busy = true,
        ),
    )
    val state = mutable.asStateFlow()
    private var key = UUID.fromString(
        saved.get<String>("support-key") ?: UUID.randomUUID().toString(),
    )
    private var pending: String? = null

    init {
        viewModelScope.launch {
            try {
                repository.loadDraft()?.let { draft ->
                    key = UUID.fromString(draft.key)
                    pending = draft.pending
                    val image = draft.screenshot?.let {
                        SelectedBytes(it.name, it.type, Base64.getDecoder().decode(it.data))
                    }
                    mutable.value = state.value.copy(screenshot = image, frozen = pending != null)
                    pending?.let { body ->
                        val fields = apiJson.parseToJsonElement(
                            body,
                        ) as JsonObject
                        fun field(name: String) =
                            (fields[name] as? JsonPrimitive)?.content.orEmpty()
                        mutable.value =
                            state.value.copy(
                                kind = field("kind"),
                                description = field("description"),
                                screen = field("screen"),
                                email = field("email").takeUnless {
                                    it ==
                                        "null"
                                }.orEmpty(),
                                diagnostics = fields["diagnostics"] != null,
                            )
                    }
                }
            } catch (_: ClientFailure) {
                mutable.value = state.value.copy(error = true)
            } finally {
                mutable.value = state.value.copy(busy = false)
                saved["support-key"] =
                    key.toString()
            }
        }
    }

    fun preset(screen: String) {
        if (state.value.description.isEmpty() &&
            !state.value.frozen
        ) {
            edit { it.copy(screen = screen) }
        }
    }

    fun edit(change: (SupportState) -> SupportState) {
        if (state.value.busy || state.value.frozen) return
        val oldScreenshot = state.value.screenshot
        mutable.value =
            change(state.value).copy(error = false, validation = false, fieldErrors = emptySet())
        if (oldScreenshot != null && state.value.screenshot == null) {
            viewModelScope.launch {
                try {
                    repository.saveDraft(key, pending, state.value.screenshot)
                } catch (_: ClientFailure) {
                    mutable.value = state.value.copy(fileError = true)
                }
            }
        }
        val value = state.value
        saved["support-kind"] = value.kind
        saved["support-description"] = value.description
        saved["support-screen"] = value.screen
        saved["support-email"] = value.email
        saved["support-diagnostics"] = value.diagnostics
        saved["support-key"] = key.toString()
    }

    fun screenshot(uri: Uri?) {
        if (uri == null || state.value.frozen) return
        mutable.value = state.value.copy(selecting = true, fileError = false)
        viewModelScope.launch {
            try {
                val image = repository.screenshot(uri)
                repository.saveDraft(key, pending, image)
                mutable.value = state.value.copy(screenshot = image)
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (_: IOException) {
                mutable.value = state.value.copy(fileError = true)
            } catch (_: ClientFailure) {
                mutable.value = state.value.copy(fileError = true)
            } catch (_: SecurityException) {
                mutable.value = state.value.copy(fileError = true)
            } finally {
                mutable.value = state.value.copy(selecting = false)
            }
        }
    }

    fun send() {
        val value = state.value
        if (value.busy || value.selecting) return
        val description = value.description.trim()
        if (SupportDescriptionIssue.inspect(description) != null ||
            (
                value.email.isNotBlank() &&
                    !android.util.Patterns.EMAIL_ADDRESS.matcher(value.email.trim()).matches()
                )
        ) {
            mutable.value = value.copy(validation = true)
            return
        }
        val body = pending ?: buildJsonObject {
            put("client_request_id", key.toString())
            put("kind", value.kind)
            put("description", description)
            put("screen", value.screen)
            if (value.email.isBlank()) put("email", JsonNull) else put("email", value.email.trim())
            value.screenshot?.let { file ->
                put(
                    "screenshot",
                    buildJsonObject {
                        put("file_name", file.name)
                        put("content_type", file.type)
                        put("data_base64", Base64.getEncoder().encodeToString(file.bytes))
                    },
                )
            }
            if (value.diagnostics) {
                put(
                    "diagnostics",
                    buildJsonObject {
                        put(
                            "client_version",
                            "${BuildConfig.VERSION_NAME} (${BuildConfig.VERSION_CODE})",
                        )
                        put("platform", "android")
                        put("os", "Android ${android.os.Build.VERSION.RELEASE}")
                    },
                )
            }
        }.toString().also { pending = it }
        saved["support-key"] = key.toString()
        mutable.value = value.copy(busy = true, frozen = true, error = false)
        viewModelScope.launch {
            try {
                repository.saveDraft(key, body, value.screenshot)
                val result = repository.feedback(body, key)
                try {
                    repository.clearDraft()
                } catch (_: ClientFailure) {
                    // A confirmed receipt remains successful; retrying its key stays idempotent.
                }
                mutable.value = state.value.copy(receipt = result, busy = false)
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (error: ClientFailure) {
                val rejected = error.status in listOf(400, 422)
                if (rejected) {
                    pending = null
                    key = UUID.randomUUID()
                    try {
                        repository.saveDraft(key, null, state.value.screenshot)
                    } catch (
                        _: ClientFailure,
                    ) { }
                }
                mutable.value = state.value.copy(
                    busy = false,
                    error = true,
                    frozen = !rejected,
                    validation = rejected,
                    fieldErrors = error.problem?.fieldErrors?.keys.orEmpty(),
                )
            }
        }
    }

    fun reset() {
        if (state.value.busy) return
        viewModelScope.launch {
            try {
                repository.clearDraft()
            } catch (_: ClientFailure) { }
        }
        pending = null
        key = UUID.randomUUID()
        mutable.value = SupportState()
        edit { it }
    }
}
