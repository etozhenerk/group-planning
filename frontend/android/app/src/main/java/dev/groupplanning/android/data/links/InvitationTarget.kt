package dev.groupplanning.android.data.links

import java.util.UUID

internal sealed interface InvitationTarget {
    class Token(val value: String) : InvitationTarget {
        override fun toString(): String = "InvitationTarget.Token(redacted)"
    }
    data class Meeting(val id: UUID) : InvitationTarget
}
