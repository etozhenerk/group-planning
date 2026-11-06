package dev.groupplanning.android

import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.junit4.ComposeTestRule

internal class ReactionUiFixture(private val compose: ComposeTestRule) {
    fun chip(emoji: String): SemanticsNodeInteraction =
        compose.onNode(hasContentDescription("$emoji,", substring = true))

    fun state(emoji: String): Pair<Int, Boolean> {
        val nodes = compose.onAllNodes(hasContentDescription("$emoji,", substring = true))
            .fetchSemanticsNodes()
        if (nodes.isEmpty()) return 0 to false
        check(nodes.size == 1) { "Reaction must identify one message chip: $emoji" }
        val config = nodes.single().config
        val description = config[SemanticsProperties.ContentDescription].single()
        val count = description.substringAfter(", ").substringBefore(',').toInt()
        return count to config[SemanticsProperties.Selected]
    }

    fun waitState(emoji: String, count: Int, selected: Boolean) {
        compose.waitUntil(10_000) { state(emoji) == (count to selected) }
        compose.waitForIdle()
    }
}
