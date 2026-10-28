package dev.groupplanning.android.state

internal enum class SupportDescriptionIssue {
    TooShort,
    TooLong,
    ;

    companion object {
        fun inspect(value: String): SupportDescriptionIssue? {
            val description = value.trim()
            val count = description.codePointCount(0, description.length)
            return when {
                count < 10 -> TooShort
                count > 3000 -> TooLong
                else -> null
            }
        }
    }
}
