package dev.groupplanning.android.ui.service

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun SupportTopics(value: String, enabled: Boolean, change: (String) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS10)) {
        Text(
            stringResource(R.string.support_topic),
            fontSize = DesignTokens.typographySizeSmall,
            fontWeight = FontWeight.SemiBold,
        )
        Surface(
            color = Palette.surface,
            shape = RoundedCornerShape(DesignTokens.componentMobileServiceFieldRadius),
        ) {
            Row(
                Modifier.padding(DesignTokens.spaceS4),
                horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS4),
            ) {
                listOf(
                    "problem" to R.string.support_problem,
                    "question" to R.string.support_question,
                    "idea" to R.string.support_idea,
                ).forEach { (key, label) ->
                    Surface(
                        {
                            change(key)
                        },
                        Modifier.weight(1f).heightIn(min = DesignTokens.targetAndroid),
                        enabled = enabled,
                        shape = RoundedCornerShape(DesignTokens.spaceS10 + DesignTokens.spaceS1),
                        color = if (key ==
                            value
                        ) {
                            Palette.action
                        } else {
                            androidx.compose.ui.graphics.Color.Transparent
                        },
                    ) {
                        Box(contentAlignment = androidx.compose.ui.Alignment.Center) {
                            Text(
                                stringResource(label),
                                fontSize = DesignTokens.typographySizeCaption,
                                fontWeight = if (key ==
                                    value
                                ) {
                                    FontWeight.SemiBold
                                } else {
                                    FontWeight.Normal
                                },
                                color = if (key == value) Palette.actionText else Palette.muted,
                            )
                        }
                    }
                }
            }
        }
    }
}
