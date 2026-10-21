package dev.groupplanning.android

import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import dev.groupplanning.android.state.AppViewModel
import dev.groupplanning.android.ui.SomewhereApp
import dev.groupplanning.android.ui.theme.SomewhereTheme
import java.util.Locale

class MainActivity : ComponentActivity() {
    override fun attachBaseContext(newBase: Context) {
        val configuration = Configuration(newBase.resources.configuration)
        configuration.setLocale(Locale.forLanguageTag("ru"))
        super.attachBaseContext(newBase.createConfigurationContext(configuration))
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        intent.dataString?.let { ViewModelProvider(this)[AppViewModel::class.java].receiveLink(it) }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.dark(Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.dark(Color.TRANSPARENT),
        )
        if (Build.VERSION.SDK_INT >= 31) splashScreen.setOnExitAnimationListener { it.remove() }
        val factory = object : ViewModelProvider.Factory {
            override fun <T : ViewModel> create(modelClass: Class<T>): T = checkNotNull(
                modelClass.cast(
                    AppViewModel(
                        RuntimeFactory.create(applicationContext, intent),
                        intent.dataString,
                    ),
                ),
            )
        }
        val model = ViewModelProvider(this, factory)[AppViewModel::class.java]
        setContent { SomewhereTheme { SomewhereApp(model) } }
    }
}
