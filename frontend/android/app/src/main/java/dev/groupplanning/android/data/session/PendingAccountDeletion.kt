@file:kotlinx.serialization.UseSerializers(
    dev.groupplanning.android.data.api.models.UuidSerializer::class,
)

package dev.groupplanning.android.data.session

import java.util.UUID
import kotlinx.serialization.Serializable

@Serializable
internal class PendingAccountDeletion(val token: String, val userId: UUID) {
    init {
        require(token.matches(Regex("[A-Za-z0-9_-]{43}")))
    }
    override fun toString(): String = "PendingAccountDeletion(redacted)"
}
