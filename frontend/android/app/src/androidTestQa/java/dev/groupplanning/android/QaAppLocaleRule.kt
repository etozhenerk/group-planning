package dev.groupplanning.android

import android.app.LocaleManager
import android.os.Build
import android.os.LocaleList
import android.os.SystemClock
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.runner.lifecycle.ActivityLifecycleCallback
import androidx.test.runner.lifecycle.ActivityLifecycleMonitorRegistry
import androidx.test.runner.lifecycle.Stage
import org.junit.rules.ExternalResource

internal class QaAppLocaleRule(private val persistentNamespace: String? = null) :
    ExternalResource() {
    private var original: LocaleList? = null
    private var manager: LocaleManager? = null
    private val observed = mutableListOf<Pair<String, String>>()
    private val activityLocale = ActivityLifecycleCallback { activity, stage ->
        if (activity is MainActivity && stage == Stage.RESUMED) {
            observed +=
                activity.javaClass.name to activity.resources.configuration.locales.toLanguageTags()
        }
    }

    override fun before() {
        check(Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            "QA capture locale requires Android 13 or newer"
        }
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        QaClientTestState.begin(instrumentation.targetContext, persistentNamespace)
        QaResponseGate.releaseHistory()
        QaResponseGate.rejectMessage = false
        QaResponseGate.releaseListError()
        instrumentation.runOnMainSync {
            val localeManager = checkNotNull(
                instrumentation.targetContext.getSystemService(LocaleManager::class.java),
            )
            manager = localeManager
            original = localeManager.applicationLocales
        }
        try {
            applyLocales(LocaleList.forLanguageTags("ru-RU"))
            instrumentation.runOnMainSync {
                observed.clear()
                ActivityLifecycleMonitorRegistry.getInstance().addLifecycleCallback(activityLocale)
            }
        } catch (failure: Throwable) {
            // ExternalResource.after is not called when before itself fails.
            try {
                original?.let(::applyLocales)
            } catch (cleanup: Throwable) {
                failure.addSuppressed(cleanup)
            }
            throw failure
        }
    }

    override fun after() {
        val locales = original ?: return
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        try {
            instrumentation.runOnMainSync {
                ActivityLifecycleMonitorRegistry.getInstance().removeLifecycleCallback(
                    activityLocale,
                )
                check(observed.isNotEmpty()) { "No MainActivity locale was observed" }
                check(
                    observed.all { (_, tags) ->
                        LocaleList.forLanguageTags(tags)[0].language ==
                            "ru"
                    },
                ) {
                    "Actual Activity locale differs from Russian: $observed"
                }
            }
        } finally {
            applyLocales(locales)
        }
    }

    private fun applyLocales(locales: LocaleList) {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val localeManager = checkNotNull(manager)
        instrumentation.runOnMainSync {
            if (localeManager.applicationLocales != locales) {
                localeManager.applicationLocales = locales
            }
        }
        val deadline = SystemClock.uptimeMillis() + 5_000
        var requested = ""
        while (SystemClock.uptimeMillis() < deadline) {
            instrumentation.waitForIdleSync()
            var applied = false
            instrumentation.runOnMainSync {
                requested = localeManager.applicationLocales.toLanguageTags()
                applied = localeManager.applicationLocales == locales
            }
            if (applied) return
            SystemClock.sleep(25)
        }
        error("QA locale not applied: expected=$locales requested=$requested")
    }
}
