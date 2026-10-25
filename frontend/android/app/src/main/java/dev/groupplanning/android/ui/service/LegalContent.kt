package dev.groupplanning.android.ui.service

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun LegalContent(cookies: Boolean, open: (String) -> Unit) {
    Column(
        Modifier.fillMaxWidth().background(Color(0xff34303c), RoundedCornerShape(16.dp))
            .padding(18.dp),
        verticalArrangement = Arrangement.spacedBy(7.dp),
    ) {
        Text(stringResource(R.string.legal_draft), fontSize = 13.sp, color = Palette.accent)
        Text(stringResource(R.string.legal_draft_note), fontSize = 12.sp, color = Palette.muted)
    }
    val sections = if (cookies) {
        listOf(
            R.string.cookies_intro_title to R.string.cookies_intro_text,
            R.string.cookies_current_title to null,
            R.string.cookies_session_title to R.string.cookies_session_text,
            R.string.cookies_auth_title to R.string.cookies_auth_text,
            R.string.cookies_tab_title to R.string.cookies_tab_text,
            R.string.cookies_ads_title to R.string.cookies_ads_text,
            R.string.cookies_control_title to R.string.cookies_control_text,
            R.string.cookies_consent_title to R.string.cookies_consent_text,
        )
    } else {
        listOf(
            R.string.legal_operator to R.string.legal_operator_fields,
            R.string.legal_data_title to R.string.legal_data_text,
            R.string.legal_purpose_title to R.string.legal_purpose_text,
            R.string.legal_sharing_title to R.string.legal_sharing_text,
            R.string.legal_support_title to R.string.legal_support_text,
            R.string.legal_retention_title to R.string.legal_retention_text,
            R.string.legal_rights_title to R.string.legal_rights_text,
        )
    }
    sections.forEach { (title, body) ->
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(stringResource(title), fontSize = 19.sp, fontWeight = FontWeight.Bold)
            body?.let {
                Text(
                    stringResource(it),
                    fontSize = 13.sp,
                    lineHeight = 22.1.sp,
                    color = Palette.muted,
                )
            }
            if (title == R.string.legal_operator) {
                Text(
                    stringResource(R.string.legal_operator_note),
                    fontSize = 13.sp,
                    lineHeight = 22.1.sp,
                    color = Palette.muted,
                )
            }
        }
    }
    TextButton({ open(if (cookies) "privacy" else "cookies") }) {
        Text(stringResource(if (cookies) R.string.privacy_title else R.string.cookies_title))
    }
}
