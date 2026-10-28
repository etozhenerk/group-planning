package dev.groupplanning.android.ui.service

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.CompactButton
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun HelpContent(question: () -> Unit) {
    var expanded by rememberSaveable { mutableStateOf(listOf(0)) }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
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
            Modifier.padding(top = 22.dp).fillMaxWidth()
                .background(Color(0xff38313e), RoundedCornerShape(20.dp)).padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(
                stringResource(R.string.help_callout),
                fontSize = 19.sp,
                fontWeight = FontWeight.Bold,
            )
            Text(
                stringResource(R.string.help_callout_body),
                fontSize = 12.sp,
                color = Palette.muted,
            )
            CompactButton(stringResource(R.string.help_ask), primary = true, click = question)
        }
    }
}
