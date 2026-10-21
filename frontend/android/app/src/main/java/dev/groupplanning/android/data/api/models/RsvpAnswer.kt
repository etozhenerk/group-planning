package dev.groupplanning.android.data.api.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
internal enum class RsvpAnswer {
    @SerialName("going")
    Going,

    @SerialName("maybe")
    Maybe,

    @SerialName("not_going")
    NotGoing,
}
