package dev.groupplanning.android.ui.service

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun HelpContent(question: () -> Unit) {
    var expanded by rememberSaveable { mutableStateOf(listOf(0)) }
    Column(verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS10)) {
        listOf(
            R.string.help_invitation_question to R.string.help_invitation_answer,
            R.string.help_join_question to R.string.help_join_answer,
            R.string.help_photo_question to R.string.help_photo_answer,
            R.string.help_contacts_question to R.string.help_contacts_answer,
        )
            .forEachIndexed { index, (title, body) ->
                HelpQuestion(stringResource(title), stringResource(body), index in expanded) {
                    expanded = if (index in expanded) expanded - index else expanded + index
                }
            }

        Column(
            Modifier.padding(top = DesignTokens.spaceS24 + DesignTokens.spaceS6).fillMaxWidth(),
        ) {
            androidx.compose.material3.HorizontalDivider(color = DesignTokens.colorLine)
            Spacer(Modifier.height(DesignTokens.spaceS24))
            ServiceIcon(ChatSymbol.Message, DesignTokens.spaceS24, Palette.accent)
            Text(
                stringResource(R.string.help_question_remains),
                Modifier.padding(
                    top = (DesignTokens.spaceS12 + DesignTokens.spaceS2),
                    bottom = DesignTokens.spaceS16,
                ),
                fontSize = DesignTokens.componentMobileServiceSectionTitleSize.value.sp,
                fontWeight = FontWeight.SemiBold,
            )
            ServiceActionButton(
                stringResource(R.string.support_write),
                Modifier.fillMaxWidth(),
                arrow = true,
                click = question,
            )
        }
    }
}
