package dev.groupplanning.android.data.repository

import android.content.Context
import androidx.core.content.edit
import dev.groupplanning.android.data.api.apiJson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
internal data class EmojiItem(
    val emoji: String,
    val name: String,
    val keywords: List<String>,
    val category: String,
    @SerialName("category_name") val categoryName: String,
)

internal class EmojiRepository(context: Context) {
    private val assets = context.applicationContext.assets
    private val preferences = context.applicationContext.getSharedPreferences(
        "emoji-recents",
        Context.MODE_PRIVATE,
    )
    private var cached: List<EmojiItem>? = null
    suspend fun catalog(): List<EmojiItem> = withContext(Dispatchers.IO) {
        cached
            ?: apiJson.decodeFromString<List<EmojiItem>>(
                assets.open("emoji-ru.json").bufferedReader().use {
                    it.readText()
                },
            ).also {
                cached =
                    it
            }
    }
    suspend fun recent(): List<String> = withContext(Dispatchers.IO) {
        preferences.getString("recent", "").orEmpty().split('|').filter { it.isNotBlank() }
    }
    suspend fun used(emoji: String) = withContext(Dispatchers.IO) {
        val values = (listOf(emoji) + recent()).distinct().take(30)
        preferences.edit { putString("recent", values.joinToString("|")) }
    }
}
