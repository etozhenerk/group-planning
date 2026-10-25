package dev.groupplanning.android.state

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dev.groupplanning.android.data.repository.EmojiItem
import dev.groupplanning.android.data.repository.EmojiRepository
import java.io.IOException
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.SerializationException

internal class EmojiViewModel(private val repository: EmojiRepository, scope: CoroutineScope) :
    ViewModel(scope) {
    private val mutable = MutableStateFlow<List<EmojiItem>>(emptyList())
    val items = mutable.asStateFlow()
    private val mutableRecent = MutableStateFlow<List<String>>(emptyList())
    val recent = mutableRecent.asStateFlow()
    private val mutableError = MutableStateFlow(false)
    val error = mutableError.asStateFlow()
    init {
        load()
    }
    fun load() {
        viewModelScope.launch {
            try {
                mutable.value = repository.catalog()
                mutableRecent.value = repository.recent()
                mutableError.value = false
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (_: IOException) {
                mutableError.value = true
            } catch (_: SerializationException) {
                mutableError.value = true
            }
        }
    }
    fun choose(value: String) {
        viewModelScope.launch {
            repository.used(value)
            mutableRecent.value =
                repository.recent()
        }
    }
}
