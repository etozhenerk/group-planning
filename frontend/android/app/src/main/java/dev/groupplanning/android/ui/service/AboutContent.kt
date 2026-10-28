package dev.groupplanning.android.ui.service

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.BuildConfig
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.CompactButton
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun AboutContent(support: () -> Unit) {
    Column(
        Modifier.fillMaxWidth().background(Palette.surface, RoundedCornerShape(22.dp))
            .padding(horizontal = 20.dp, vertical = 25.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Icon(
            painterResource(R.drawable.ic_brand_compact),
            null,
            Modifier.size(76.dp),
            tint = Palette.text,
        )
        Text(
            stringResource(R.string.about_intro),
            fontSize = 13.sp,
            lineHeight = 23.4.sp,
            textAlign = TextAlign.Center,
            color = Palette.muted,
        )
        HorizontalDivider(Modifier.padding(top = 16.dp), color = Color(0x12ffffff))
        Column(
            Modifier.fillMaxWidth().padding(vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            listOf(
                R.string.about_platform to "Android",
                R.string.about_version to
                    BuildConfig.VERSION_NAME,
                R.string.about_build to BuildConfig.VERSION_CODE.toString(),
                R.string.about_developer to "MintyDev",
            ).forEach { (label, value) ->
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(stringResource(label), fontSize = 13.sp, color = Palette.muted)
                    Text(value, fontSize = 13.sp)
                }
            }
        }
        HorizontalDivider(Modifier.padding(bottom = 16.dp), color = Color(0x12ffffff))
        CompactButton(stringResource(R.string.support_title), click = support)
        Text(stringResource(R.string.developer_credit), fontSize = 11.sp, color = Palette.muted)
    }
}
