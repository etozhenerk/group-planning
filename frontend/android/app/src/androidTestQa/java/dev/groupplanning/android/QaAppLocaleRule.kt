package dev.groupplanning.android

import android.app.LocaleManager
import android.content.res.Resources
import android.os.Build
import android.os.LocaleList
import android.os.SystemClock
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.rules.ExternalResource

internal class QaAppLocaleRule(private val persistentNamespace: String? = null) :
    ExternalResource() {
    private var original: LocaleList? = null
    private var manager: LocaleManager? = null

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
        applyLocales(locales)
    }

    private fun applyLocales(locales: LocaleList) {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val localeManager = checkNotNull(manager)
        instrumentation.runOnMainSync {
            if (localeManager.applicationLocales != locales) {
                localeManager.applicationLocales = locales
            }
        }
        val expected = if (locales.isEmpty) Resources.getSystem().configuration.locales else locales
        val expectedLanguage = expected[0].toLanguageTag()
        val deadline = SystemClock.uptimeMillis() + 5_000
        var requested = ""
        var effective = ""
        while (SystemClock.uptimeMillis() < deadline) {
            instrumentation.waitForIdleSync()
            var applied = false
            instrumentation.runOnMainSync {
                val actual = instrumentation.targetContext.resources.configuration.locales
                requested = localeManager.applicationLocales.toLanguageTags()
                effective = actual.toLanguageTags()
                applied = localeManager.applicationLocales == locales &&
                    !actual.isEmpty &&
                    actual[0].toLanguageTag() == expectedLanguage
            }
            if (applied) return
            SystemClock.sleep(25)
        }
        error("QA locale not applied: expected=$locales requested=$requested effective=$effective")
    }
}
