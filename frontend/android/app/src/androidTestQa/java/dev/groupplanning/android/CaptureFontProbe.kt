package dev.groupplanning.android

import android.graphics.Paint
import android.graphics.Typeface
import android.graphics.text.TextRunShaper
import android.os.Build
import dev.groupplanning.android.ui.theme.DesignTokens
import org.json.JSONArray
import org.json.JSONObject

internal object CaptureFontProbe {
    fun measure(): JSONObject = JSONObject().apply {
        put("publishedFamily", DesignTokens.typographyFamilyAndroid)
        put("themeSelection", "Compose platform default; no explicit fontFamily override")
        put("method", "TextRunShaper with Typeface.DEFAULT, regular and bold")
        put(
            "limitation",
            "Measures the platform default for representative text, " +
                "not every glyph in the screenshot.",
        )
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            put("resolvedSamples", JSONObject.NULL)
            put("unavailableReason", "TextRunShaper requires API 31")
            return@apply
        }
        val samples = JSONArray()
        for (style in listOf(Typeface.NORMAL, Typeface.BOLD)) {
            val paint = Paint().apply {
                typeface = Typeface.create(Typeface.DEFAULT, style)
                textSize = 28f
            }
            for (text in listOf("Предложить задачу", "somewhere 123", "❤️🎉")) {
                val glyphs = TextRunShaper.shapeTextRun(
                    text, 0, text.length, 0, text.length, 0f, 0f, false, paint,
                )
                val fonts = (0 until glyphs.glyphCount()).map { index ->
                    val font = glyphs.getFont(index)
                    Triple(font.file?.absolutePath, font.ttcIndex, font.style.weight)
                }.distinct()
                samples.put(
                    JSONObject().apply {
                        put("text", text)
                        put("style", if (style == Typeface.BOLD) "bold" else "regular")
                        put("glyphCount", glyphs.glyphCount())
                        put(
                            "fonts",
                            JSONArray(
                                fonts.map { (file, ttcIndex, weight) ->
                                    JSONObject().apply {
                                        put("file", file ?: JSONObject.NULL)
                                        put("ttcIndex", ttcIndex)
                                        put("weight", weight)
                                    }
                                },
                            ),
                        )
                    },
                )
            }
        }
        put("resolvedSamples", samples)
    }
}
