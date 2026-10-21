import org.gradle.api.attributes.Bundling

plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
}

val ktlint by configurations.creating {
    isTransitive = false
    attributes {
        attribute(Bundling.BUNDLING_ATTRIBUTE, objects.named(Bundling.SHADOWED))
    }
}

dependencies {
    ktlint(libs.ktlint.cli)
}

listOf("formatCheck", "formatApply").forEach { taskName ->
    tasks.register<JavaExec>(taskName) {
        group = "verification"
        description = if (taskName == "formatCheck") "Check Kotlin style" else "Format Kotlin files"
        classpath = ktlint
        mainClass.set("com.pinterest.ktlint.Main")
        maxHeapSize = "512m"
        if (taskName == "formatApply") args("--format")
        args("**/*.kt", "**/*.kts", "!**/build/**", "!**/.gradle/**")
    }
}
