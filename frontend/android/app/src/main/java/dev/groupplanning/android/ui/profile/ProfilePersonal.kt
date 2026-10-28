package dev.groupplanning.android.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalResources
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.OwnProfile
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun ProfilePersonal(profile: OwnProfile) {
    val context = LocalContext.current
    val resources = LocalResources.current
    val missing = stringResource(R.string.profile_unspecified)
    val fields = listOf(
        R.string.profile_login to profile.login,
        R.string.profile_first_name to profile.firstName,
        R.string.profile_last_name to profile.lastName,
        R.string.profile_birthday to profileBirthday(profile.birthday) {
            context.getString(R.string.profile_day_number, it)
        },
        R.string.profile_sex to when (profile.sex) {
            "male" -> stringResource(R.string.profile_male)
            "female" -> stringResource(R.string.profile_female)
            else -> null
        },
    )
    Text(
        stringResource(R.string.profile_personal),
        fontSize = 12.sp,
        letterSpacing = .84.sp,
        fontWeight = FontWeight.SemiBold,
        color = Palette.muted,
        modifier = Modifier.padding(top = 22.dp, bottom = 12.dp),
    )
    Column(
        Modifier.fillMaxWidth().background(
            Palette.surface,
            RoundedCornerShape(22.dp),
        ).padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp),
    ) {
        fields.forEach { (label, value) ->
            Column(
                Modifier.testTag("profile-field-${resources.getResourceEntryName(label)}"),
            ) {
                Text(
                    stringResource(label),
                    fontSize = 12.sp,
                    lineHeight = 18.sp,
                    color = Palette.muted,
                )
                Text(
                    value?.takeIf(String::isNotBlank) ?: missing,
                    fontSize = 15.sp,
                    lineHeight = 22.5.sp,
                )
            }
        }
    }
}
