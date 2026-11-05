package dev.groupplanning.android.ui.preparation

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.Participant
import dev.groupplanning.android.data.api.models.UserProfile
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.components.UserAvatar
import dev.groupplanning.android.ui.theme.DesignTokens
import java.util.UUID

@Composable
internal fun PreparationRecipientSearch(
    people: List<Participant>,
    user: UUID,
    selected: UUID?,
    choose: (UUID?) -> Unit,
) {
    var query by remember { mutableStateOf("") }
    val label = stringResource(R.string.prep_search_label)
    BasicTextField(
        query,
        { query = it },
        singleLine = true,
        modifier = Modifier.fillMaxWidth().heightIn(
            min = DesignTokens.componentMobileStateActionMinimumHeight,
        )
            .background(
                DesignTokens.colorNavigation,
                RoundedCornerShape(DesignTokens.radiusControl),
            )
            .border(
                DesignTokens.spaceS1,
                DesignTokens.colorBorderStrong,
                RoundedCornerShape(DesignTokens.radiusControl),
            )
            .padding(DesignTokens.spaceS12).semantics {
                contentDescription = label
            }.testTag("preparation-recipient-search"),
        textStyle = TextStyle(
            color = DesignTokens.colorText,
            fontSize = DesignTokens.typographySizeBody,
        ),
        cursorBrush = SolidColor(DesignTokens.colorAccent),
        decorationBox = { input ->
            if (query.isEmpty()) {
                Text(
                    stringResource(R.string.prep_search_placeholder),
                    color = DesignTokens.colorMuted,
                    fontSize = DesignTokens.typographySizeBody,
                )
            }
            input()
        },
    )
    val filtered = people.filter { it.user.displayName.contains(query, ignoreCase = true) }
    Column {
        if (query.isEmpty()) {
            PreparationRecipientRow(
                null,
                stringResource(R.string.preparation_anyone),
                stringResource(R.string.prep_any_hint),
                selected == null,
            ) { choose(null) }
        }
        filtered.forEach { person ->
            PreparationRecipientRow(
                person.user,
                if (person.user.id ==
                    user
                ) {
                    stringResource(R.string.prep_you_suffix, person.user.displayName)
                } else {
                    person.user.displayName
                },
                if (person.role ==
                    "organizer"
                ) {
                    stringResource(R.string.organizer)
                } else {
                    null
                },
                selected == person.user.id,
            ) { choose(person.user.id) }
        }
        if (filtered.isEmpty() &&
            query.isNotEmpty()
        ) {
            Text(
                stringResource(R.string.prep_search_empty),
                color = DesignTokens.colorMuted,
                fontSize = DesignTokens.typographySizeSmall,
                modifier = Modifier.padding(vertical = DesignTokens.spaceS16),
            )
        }
    }
}

@Composable
private fun PreparationRecipientRow(
    person: UserProfile?,
    name: String,
    subtitle: String?,
    selected: Boolean,
    choose: () -> Unit,
) {
    Row(
        Modifier.fillMaxWidth().heightIn(
            min = DesignTokens.componentMobilePreparationRecipientMinimumHeight,
        ).clickable(onClick = choose).padding(vertical = DesignTokens.spaceS10),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS12),
    ) {
        if (person !=
            null
        ) {
            UserAvatar(
                person.displayName,
                person.avatarUrl,
                size = DesignTokens.componentMobileAvatarSmallSize,
            )
        } else {
            ChatIcon(
                ChatSymbol.People,
                Modifier.size(DesignTokens.componentMobileAvatarSmallSize),
                tint = DesignTokens.colorAccent,
            )
        }
        Column(
            Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS3),
        ) {
            Text(name, fontSize = DesignTokens.typographySizeButton, fontWeight = FontWeight.Medium)
            if (subtitle !=
                null
            ) {
                Text(
                    subtitle,
                    fontSize = DesignTokens.typographySizeLabel,
                    color = DesignTokens.colorMuted,
                )
            }
        }
        if (selected) Text("✓", color = DesignTokens.colorAccent)
    }
    HorizontalDivider(color = DesignTokens.colorLine)
}
