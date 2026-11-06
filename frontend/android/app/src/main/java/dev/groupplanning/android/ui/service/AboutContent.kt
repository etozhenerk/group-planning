package dev.groupplanning.android.ui.service

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.BuildConfig
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun AboutContent() {
    Column(
        Modifier.fillMaxWidth().padding(horizontal = DesignTokens.spaceS20)
            .padding(bottom = DesignTokens.spaceS40),
    ) {
        Row(
            Modifier.padding(top = DesignTokens.spaceS10),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS12),
        ) {
            Icon(
                painterResource(R.drawable.ic_brand_compact),
                null,
                Modifier.size(DesignTokens.componentMobileAboutBrandMarkSize),
                tint = Palette.text,
            )
            Text(
                "somewhere",
                fontSize = DesignTokens.componentMobileAboutBrandWordSize.value.sp,
                lineHeight = DesignTokens.componentMobileAboutBrandWordLineHeight.value.sp,
                fontWeight = FontWeight(DesignTokens.componentRsvpResultBrandWeight.toInt()),
                letterSpacing = -DesignTokens.componentMobileAboutBrandWordTracking.value.sp,
            )
        }
        Text(
            stringResource(R.string.about_intro),
            Modifier.widthIn(max = DesignTokens.componentMobileAboutBrandDescriptionMaximumWidth)
                .padding(
                    top = DesignTokens.spaceS16 + DesignTokens.spaceS2,
                    bottom = DesignTokens.spaceS24 + DesignTokens.spaceS6,
                ),
            fontSize = DesignTokens.typographySizeButton,
            lineHeight = DesignTokens.componentMobileAboutBrandDescriptionLineHeight.value.sp,
            color = Palette.muted,
        )
        Surface(
            color = Palette.surface,
            shape = RoundedCornerShape(DesignTokens.componentMobileAboutMetadataRadius),
        ) {
            Column(
                Modifier.fillMaxWidth()
                    .padding(horizontal = DesignTokens.componentMobileAboutMetadataInsetInline)
                    .padding(vertical = DesignTokens.spaceS4),
            ) {
                listOf(
                    R.string.about_platform to "Android",
                    R.string.about_version to BuildConfig.VERSION_NAME,
                    R.string.about_build to BuildConfig.VERSION_CODE.toString(),
                )
                    .forEachIndexed { index, (label, value) ->
                        Row(
                            Modifier.fillMaxWidth().padding(vertical = DesignTokens.spaceS16),
                            horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS20),
                            verticalAlignment = Alignment.Top,
                        ) {
                            Text(
                                stringResource(label),
                                Modifier.weight(1f),
                                fontSize = DesignTokens.typographySizeSmall,
                                lineHeight =
                                DesignTokens.componentMobileServiceBodyLineHeight.value.sp,
                                color = Palette.muted,
                            )
                            Text(
                                value.ifBlank { stringResource(R.string.about_unavailable) },
                                fontSize = DesignTokens.typographySizeSmall,
                                lineHeight =
                                DesignTokens.componentMobileServiceBodyLineHeight.value.sp,
                            )
                        }
                        if (index < 2) HorizontalDivider(color = DesignTokens.colorLine)
                    }
            }
        }
        val credit = buildAnnotatedString {
            append("Developed by ")
            withStyle(SpanStyle(color = Palette.text, fontWeight = FontWeight.SemiBold)) {
                append("MintyDev")
            }
        }
        Text(
            credit,
            Modifier.padding(top = DesignTokens.componentMobileAboutCreditTop),
            fontSize = DesignTokens.typographySizeCaption,
            lineHeight = (DesignTokens.spaceS16 + DesignTokens.spaceS2).value.sp,
            color = Palette.muted,
        )
    }
}
