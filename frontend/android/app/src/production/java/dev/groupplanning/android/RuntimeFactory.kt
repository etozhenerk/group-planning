package dev.groupplanning.android

import android.content.Context
import android.content.Intent
import dev.groupplanning.android.data.ClientRuntime
import dev.groupplanning.android.data.api.ApiOrigin

internal object RuntimeFactory {
    fun create(context: Context, @Suppress("UNUSED_PARAMETER") intent: Intent): ClientRuntime =
        ClientRuntime.create(
            context,
            origin = BuildConfig.API_ORIGIN.takeIf {
                it.isNotBlank()
            }?.let(::ApiOrigin),
        )
}
