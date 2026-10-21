package dev.groupplanning.android

import android.content.Context
import android.content.Intent
import dev.groupplanning.android.data.ClientRuntime

internal object RuntimeFactory {
    fun create(context: Context, @Suppress("UNUSED_PARAMETER") intent: Intent): ClientRuntime =
        ClientRuntime.create(context, origin = null)
}
