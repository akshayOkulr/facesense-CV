#############################################
# React Native
#############################################

-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Native modules & TurboModules
-keep class * extends com.facebook.react.bridge.NativeModule { *; }
-keep class * extends com.facebook.react.bridge.JavaScriptModule { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# React Native annotations
-keepattributes *Annotation*
-keepattributes JavascriptInterface
-keepattributes Signature
-keepattributes InnerClasses
-keepattributes EnclosingMethod

#############################################
# Hermes
#############################################
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.hermes.intl.** { *; }

#############################################
# Reanimated (VERY IMPORTANT)
#############################################
-keep class com.swmansion.reanimated.** { *; }

#############################################
# ML Kit – Face Detection
#############################################
-keep class com.google.mlkit.** { *; }
-keep class com.google.android.gms.internal.mlkit_vision_face.** { *; }

#############################################
# JSON / Reflection
#############################################
-keep class org.json.** { *; }
-keep class com.google.gson.** { *; }

#############################################
# Kotlin
#############################################
-keep class kotlin.Metadata { *; }

#############################################
# Prevent stripping needed classes
#############################################
-dontwarn com.facebook.react.**
-dontwarn com.facebook.hermes.**
-dontwarn com.swmansion.reanimated.**
-dontwarn com.google.mlkit.**
-dontwarn com.google.android.gms.**

#############################################
# Optimization
#############################################
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

#############################################
# Security fixes
#############################################
# Ensure SecureRandom is used instead of Random where possible
-keep class java.security.SecureRandom { *; }
-dontwarn java.util.Random

# Secure file handling
-keep class java.io.File { *; }
-keep class java.io.FileInputStream { *; }
-keep class java.io.FileOutputStream { *; }

# SQLite security
-keep class android.database.sqlite.** { *; }
-keep class net.sqlcipher.** { *; }

# Cryptography security
-keep class javax.crypto.** { *; }
-keep class java.security.** { *; }

#############################################
# Disable obfuscation warnings
#############################################
-ignorewarnings
