# AAB diagnosis — DONE (2026-10-14)
See `docs/ANDROID_RELEASE.md`. Root cause: Base44 AAB package `com.base69c8e483a69a0d215eee4ef7.app` (signed by Wix One cert) ≠ Play entry `com.darululoom.app`. A new Capacitor AAB (com.darululoom.app, vc 2, target 36) built successfully, unsigned.
