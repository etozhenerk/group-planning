package dev.groupplanning.android.data.covers

import dev.groupplanning.android.data.api.models.PreparedCover

internal fun interface CoverSelectionSource {
    suspend fun select(): PreparedCover?
}
