package dev.groupplanning.android.ui.service

import androidx.compose.runtime.staticCompositionLocalOf
import dev.groupplanning.android.BuildConfig

internal sealed interface AboutMetadata {
    data class Release(val version: String, val build: String?) : AboutMetadata

    data object Local : AboutMetadata

    data object Unavailable : AboutMetadata

    companion object {
        fun from(version: String?, build: String?): AboutMetadata {
            val name = version?.trim()?.takeIf { it.isNotEmpty() } ?: return Local
            val number = build?.trim()?.takeIf { it.isNotEmpty() && it != "0" }
            return Release(name, number)
        }

        val current: AboutMetadata
            get() = from(BuildConfig.VERSION_NAME, BuildConfig.VERSION_CODE.toString())
    }
}

internal val LocalAboutMetadata = staticCompositionLocalOf { AboutMetadata.current }
