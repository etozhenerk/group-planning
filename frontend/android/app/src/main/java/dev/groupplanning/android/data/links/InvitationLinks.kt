package dev.groupplanning.android.data.links

import dev.groupplanning.android.data.api.ApiOrigin
import java.net.URI
import java.net.URISyntaxException
import java.util.Base64

internal class InvitationLinks(private val origin: ApiOrigin?, private val scheme: String) {
    fun parse(value: String): InvitationTarget.Token? {
        val uri = try {
            URI(value)
        } catch (_: URISyntaxException) {
            return null
        }
        if (uri.rawUserInfo != null || uri.rawQuery != null || uri.rawFragment != null) return null
        val parts = uri.rawPath.orEmpty().split('/').drop(1)
        val token = when {
            uri.scheme == "https" &&
                origin != null &&
                uri.host == origin.url.host &&
                (if (uri.port == -1) 443 else uri.port) == origin.url.port &&
                parts.size == 2 &&
                parts[0] in setOf("i", "invitations") -> parts[1]
            uri.scheme == scheme &&
                uri.host in setOf("i", "invitations") &&
                uri.port == -1 &&
                parts.size == 1 -> parts[0]
            else -> return null
        }
        return token.takeIf(::validToken)?.let(InvitationTarget::Token)
    }

    fun shareable(value: String): Boolean = value.startsWith("https://") && parse(value) != null

    companion object {
        fun validToken(value: String): Boolean {
            if (!value.matches(Regex("[A-Za-z0-9_-]{22}|[A-Za-z0-9_-]{43}"))) return false
            return try {
                Base64.getUrlEncoder().withoutPadding().encodeToString(
                    Base64.getUrlDecoder().decode(value),
                ) == value
            } catch (_: IllegalArgumentException) {
                false
            }
        }
    }
}
