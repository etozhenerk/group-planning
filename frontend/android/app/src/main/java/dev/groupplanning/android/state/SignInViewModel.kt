package dev.groupplanning.android.state

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.auth.AuthContext
import dev.groupplanning.android.data.auth.YandexAuthRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

internal class SignInViewModel(
    private val repository: YandexAuthRepository?,
    scope: CoroutineScope,
    private val completed: suspend (AuthContext) -> Unit,
) : ViewModel(scope) {
    private val mutable = MutableStateFlow(SignInState())
    val state = mutable.asStateFlow()
    private var exchanging = false

    fun start(context: AuthContext) {
        if (state.value.busy) return
        val auth = repository ?: run {
            mutable.value = SignInState(problem = true)
            return
        }
        mutable.value = SignInState(busy = true)
        viewModelScope.launch {
            try {
                auth.begin(context)
                mutable.value = SignInState(busy = true, launchSDK = true)
            } catch (_: ClientFailure) {
                mutable.value = SignInState(problem = true)
            }
        }
    }

    fun launched() {
        mutable.value = state.value.copy(launchSDK = false)
    }

    fun result(token: String?, cancelled: Boolean, ready: Job?) {
        if (exchanging) return
        exchanging = true
        mutable.value = SignInState(busy = true)
        viewModelScope.launch {
            try {
                ready?.join()
                if (token != null) {
                    val context = repository?.complete(token)
                    if (context != null) completed(context)
                    mutable.value = SignInState(problem = context == null)
                } else {
                    repository?.cancel()
                    mutable.value = SignInState(problem = !cancelled)
                }
            } catch (_: ClientFailure) {
                mutable.value = SignInState(problem = true)
            } finally {
                exchanging = false
            }
        }
    }

    fun dismissProblem() {
        mutable.value = state.value.copy(problem = false)
    }
}
