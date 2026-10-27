import java.net.URI
import java.util.Properties
import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
}

val emojiAssets = tasks.register<Sync>("prepareEmojiAssets") {
    from(rootProject.file("../../contracts/emoji")) { include("emoji-ru.json", "LICENSE") }
    into(layout.buildDirectory.dir("generated/emoji-assets"))
}

val localSettings = Properties().apply {
    val settingsFile = rootProject.file("local.properties")
    if (settingsFile.isFile) {
        settingsFile.inputStream().use { load(it) }
    }
}

val storeRelease = providers.gradleProperty("somewhereStoreRelease").orElse("false").get() == "true"
val releaseVersion = providers.gradleProperty("somewhereReleaseVersion").orElse("0.1.0").get()
val releaseBuild = providers.gradleProperty("somewhereReleaseBuild").orElse("1").get().toInt()
require(releaseVersion.matches(Regex("[0-9]+\\.[0-9]+\\.[0-9]+")))
require(releaseBuild in 1..9999)

fun signingSecret(name: String): String = providers.environmentVariable(name).orNull
    ?.takeIf { it.isNotBlank() }
    ?: error("Missing Android signing setting: $name")

android {
    namespace = "dev.groupplanning.android"
    compileSdk = 36
    buildToolsVersion = "36.0.0"

    defaultConfig {
        applicationId = "dev.groupplanning.android"
        minSdk = 26
        targetSdk = 36
        versionCode = releaseBuild
        versionName = releaseVersion
        val apiOrigin = providers.gradleProperty("somewhereApiOrigin")
            .orElse(localSettings.getProperty("somewhere.api.origin", ""))
            .get()
        require(apiOrigin.isEmpty() || apiOrigin.matches(Regex("https://[A-Za-z0-9.:-]+/?")))
        require(!storeRelease || apiOrigin.isNotEmpty()) {
            "Store release requires an HTTPS API origin"
        }
        buildConfigField("String", "API_ORIGIN", "\"$apiOrigin\"")
        manifestPlaceholders["invitationHost"] =
            if (apiOrigin.isEmpty()) "unconfigured.invalid" else requireNotNull(URI(apiOrigin).host)
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
    sourceSets["debug"].manifest.srcFile("src/production/AndroidManifest.xml")
    sourceSets["release"].manifest.srcFile("src/production/AndroidManifest.xml")
    testBuildType = providers.gradleProperty("somewhereTestBuildType").orElse("debug").get()

    bundle {
        language {
            // Russian product copy and native date/time controls must ship together.
            enableSplit = false
        }
    }

    sourceSets.getByName("main").assets.srcDir(layout.buildDirectory.dir("generated/emoji-assets"))

    buildFeatures {
        compose = true
        buildConfig = true
    }

    if (storeRelease) {
        signingConfigs.create("store") {
            storeFile = file(signingSecret("ANDROID_KEYSTORE_PATH"))
            storePassword = signingSecret("ANDROID_STORE_PASSWORD")
            keyAlias = signingSecret("ANDROID_KEY_ALIAS")
            keyPassword = signingSecret("ANDROID_KEY_PASSWORD")
        }
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
            if (storeRelease) signingConfig = signingConfigs.getByName("store")
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
    implementation(libs.exifinterface)
    implementation(libs.yandex.auth)
    implementation(libs.kotlin.parcelize.runtime)
    implementation(libs.lifecycle.runtime.compose)
    androidTestImplementation(platform(libs.compose.bom))
    androidTestImplementation(libs.compose.test)
    androidTestImplementation(libs.android.test.uiautomator)
    add("qaImplementation", libs.compose.test.manifest)
    implementation(libs.okhttp)
    implementation(libs.centrifuge)
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

tasks.named("preBuild").configure { dependsOn(emojiAssets) }
