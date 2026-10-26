package dev.groupplanning.android

import android.app.LocaleManager
import android.os.Build
import android.os.LocaleList
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.rules.ExternalResource

internal class QaAppLocaleRule : ExternalResource() {
    private var original: LocaleList? = null
    private var manager: LocaleManager? = null

    override fun before() {
        check(Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            "QA capture locale requires Android 13 or newer"
        }
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        instrumentation.runOnMainSync {
            val localeManager = checkNotNull(
                instrumentation.targetContext.getSystemService(LocaleManager::class.java),
            )
            manager = localeManager
            original = localeManager.applicationLocales
            localeManager.applicationLocales = LocaleList.forLanguageTags("ru-RU")
        }
    }

    override fun after() {
        val locales = original ?: return
        InstrumentationRegistry.getInstrumentation().runOnMainSync {
            manager?.applicationLocales = locales
        }
    }
}
