package dev.groupplanning.android

import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import dev.groupplanning.android.data.realtime.ChatRealtime
import dev.groupplanning.android.data.realtime.ChatSignal
import java.util.UUID
import java.util.concurrent.CopyOnWriteArrayList
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.launch

/** QA-only observation; never records credentials, query cursors or message payloads. */
internal object QaChatProbe {
    val requests = CopyOnWriteArrayList<String>()
    val events = CopyOnWriteArrayList<String>()
    fun mark(label: String) {
        events.add("${android.os.SystemClock.elapsedRealtime()} $label")
    }
    val signals = CopyOnWriteArrayList<String>()
    private val interruptions = MutableStateFlow(0)
    fun interruptMeeting() {
        interruptions.value++
    }
    fun request(method: String, path: String, cursor: Boolean = false) {
        val safePath = path.replace(Regex("/invitations/[^/]+"), "/invitations/:token")
        mark("HTTP $method $safePath cursor=$cursor")
        requests.add(
            method + " " + safePath +
                if (cursor) " (cursor present)" else "",
        )
    }
    fun reset() {
        requests.clear()
        events.clear()
        signals.clear()
    }
    fun observe(real: ChatRealtime): ChatRealtime = object : ChatRealtime {
        override fun events(token: String, owner: UUID, meeting: UUID): Flow<ChatSignal> =
            record("meeting", real.events(token, owner, meeting))
        override fun personal(token: String, owner: UUID): Flow<ChatSignal> =
            record("personal", real.personal(token, owner))
    }
    private fun record(channel: String, events: Flow<ChatSignal>): Flow<ChatSignal> = flow {
        signals.add("$channel:opened")
        try {
            coroutineScope {
                val generation = interruptions.value
                val fault = if (channel == "meeting") {
                    launch {
                        interruptions.first { it != generation }
                        throw ClientFailure(FailureKind.Network)
                    }
                } else {
                    null
                }
                try {
                    events.collect { signal ->
                        signals.add("$channel:${signal.javaClass.simpleName}")
                        mark("$channel:${signal.javaClass.simpleName}")
                        emit(signal)
                    }
                } finally {
                    fault?.cancel()
                }
            }
        } finally {
            signals.add("$channel:closed")
        }
    }
}
