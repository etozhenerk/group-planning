package dev.groupplanning.android.ui.profile

import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.OwnProfile

@Composable
internal fun ProfilePersonal(profile: OwnProfile) {
    val context = LocalContext.current
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
    fields.forEachIndexed { index, (label, value) ->
        ProfileDataRow(
            label,
            value?.takeIf(String::isNotBlank) ?: missing,
            last =
            index == fields.lastIndex,
        )
    }
}
