package dev.groupplanning.android.data.api.models

internal enum class PreparationAction(val path: String) {
    Accept("accept"),
    Decline("decline"),
    Cancel("cancel"),
    Complete("complete"),
    ;

    fun allowed(task: PreparationTask): Boolean = when (this) {
        Accept -> task.canAccept
        Decline -> task.canDecline
        Cancel -> task.canCancel
        Complete -> task.canComplete
    }
}
