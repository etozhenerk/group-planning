package dev.groupplanning.android.ui.service

import dev.groupplanning.android.R

internal fun legalSections(cookies: Boolean): List<Pair<Int, Int?>> = if (cookies) {
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
