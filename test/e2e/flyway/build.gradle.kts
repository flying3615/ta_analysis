plugins {
    // Apply the org.jetbrains.kotlin.jvm Plugin to add support for Kotlin.
    id("org.jetbrains.kotlin.jvm") version "1.8.20"
    id("org.flywaydb.flyway") version "9.20.1"
    application
}

repositories {
    mavenCentral()
}

flyway {
    placeholders = mapOf("BLOB_PATH" to "$projectDir/src/test/resources/data/")
}

dependencies {
    implementation("com.ibm.informix:jdbc:4.50.10")
}
