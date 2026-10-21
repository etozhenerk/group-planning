package dev.groupplanning.android.data.api

import kotlinx.serialization.json.Json

internal val apiJson = Json {
    ignoreUnknownKeys = true
    encodeDefaults = true
}
