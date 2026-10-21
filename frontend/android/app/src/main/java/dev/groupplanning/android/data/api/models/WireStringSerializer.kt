package dev.groupplanning.android.data.api.models

import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerializationException
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.JsonDecoder
import kotlinx.serialization.json.JsonPrimitive

internal abstract class WireStringSerializer<T>(name: String) : KSerializer<T> {
    override val descriptor = PrimitiveSerialDescriptor(name, PrimitiveKind.STRING)

    protected abstract fun parse(value: String): T
    protected abstract fun format(value: T): String

    override fun deserialize(decoder: Decoder): T {
        val value = if (decoder is JsonDecoder) {
            val primitive = decoder.decodeJsonElement() as? JsonPrimitive
            if (primitive?.isString != true) throw SerializationException("Expected string")
            primitive.content
        } else {
            decoder.decodeString()
        }
        return try {
            parse(value)
        } catch (_: IllegalArgumentException) {
            throw SerializationException("Invalid $descriptor")
        }
    }

    override fun serialize(encoder: Encoder, value: T) = encoder.encodeString(format(value))
}
