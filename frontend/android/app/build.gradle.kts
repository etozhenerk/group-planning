import java.util.Properties
import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
}

val localSettings = Properties().apply {
    val settingsFile = rootProject.file("local.properties")
    if (settingsFile.isFile) {
        settingsFile.inputStream().use { load(it) }
    }
}

android {
    namespace = "dev.groupplanning.android"
    compileSdk = 36
    buildToolsVersion = "36.0.0"

    defaultConfig {
        applicationId = "dev.groupplanning.android"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "0.1.0"
        val apiOrigin = providers.gradleProperty("somewhereApiOrigin")
            .orElse(localSettings.getProperty("somewhere.api.origin", ""))
            .get()
        require(apiOrigin.isEmpty() || apiOrigin.matches(Regex("https://[A-Za-z0-9.:-]+/?")))
        buildConfigField("String", "API_ORIGIN", "\"$apiOrigin\"")
        buildConfigField("String", "INVITATION_SCHEME", "\"group-planning-android\"")
        manifestPlaceholders["invitationScheme"] = "group-planning-android"
        val yandexClientId = providers.gradleProperty("somewhereYandexClientId")
            .orElse(
                localSettings.getProperty(
                    "somewhere.yandex.client.id",
                    "43a1ba4507214901a5c08a0d090c6e30",
                ),
            )
            .get()
        require(yandexClientId.matches(Regex("[a-f0-9]{32}")))
        manifestPlaceholders["YANDEX_CLIENT_ID"] = yandexClientId
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    sourceSets["test"].resources.srcDir("../../../contracts/fixtures")
    sourceSets["debug"].java.srcDir("src/production/java")
    sourceSets["release"].java.srcDir("src/production/java")
    testBuildType = providers.gradleProperty("somewhereTestBuildType").orElse("debug").get()

    bundle {
        language {
            // Russian product copy and native date/time controls must ship together.
            enableSplit = false
        }
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    buildTypes {
        create("qa") {
            initWith(getByName("debug"))
            applicationIdSuffix = ".uitesthost"
            buildConfigField("String", "INVITATION_SCHEME", "\"group-planning-android-qa\"")
            manifestPlaceholders["invitationScheme"] = "group-planning-android-qa"
            matchingFallbacks += "debug"
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"))
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    lint {
        abortOnError = true
        checkReleaseBuilds = true
        warningsAsErrors = true
        // Dependency and target SDK upgrades require a separate compatibility review.
        // Keep OldTargetApi visible; ExpiredTargetSdkVersion remains blocking.
        informational += listOf(
            "AndroidGradlePluginVersion",
            "GradleDependency",
            "NewerVersionAvailable",
            "OldTargetApi",
        )
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
        allWarningsAsErrors.set(true)
    }
}

dependencies {
    implementation(libs.yandex.auth)
    implementation(libs.kotlin.parcelize.runtime)
    implementation(libs.lifecycle.runtime.compose)
    androidTestImplementation(platform(libs.compose.bom))
    androidTestImplementation(libs.compose.test)
    androidTestImplementation(libs.android.test.uiautomator)
    add("qaImplementation", libs.compose.test.manifest)
    implementation(libs.okhttp)
    implementation(libs.serialization.json)
    implementation(libs.coroutines.android)
    implementation(libs.lifecycle.viewmodel)
    testImplementation(libs.junit)
    testImplementation(libs.coroutines.test)
    testImplementation(libs.mockwebserver)
    testImplementation(libs.okhttp.tls)
    androidTestImplementation(libs.android.test.runner)
    androidTestImplementation(libs.android.test.junit)
    implementation(platform(libs.compose.bom))
    implementation(libs.activity.compose)
    implementation(libs.compose.ui)
    implementation(libs.compose.material3)
    implementation(libs.compose.tooling.preview)
    debugImplementation(libs.compose.tooling)
}
