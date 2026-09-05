# STUDIO-04 AA — native Back integration

This is the 27th focused implementation/review package, discovered by executing the real native acceptance path rather than relaxing it. Exact commit/run status belongs in #264.

At head `7b50656`, the packaged Android journey reached the studio, assigned Part 1 Gold, displayed the final fraction demonstration step and captured `studio-before-process-kill.png`. Hardware Back then exited to the Android launcher instead of closing the studio. Failure artifact 9975575437 from run33987050565 retains the worked studio screen and final launcher accessibility tree. Thus process-relaunch acceptance was not yet established.

The web app already had one Escape/popstate stack, but the generated Android activity did not bridge hardware Back to that stack. `KidsplayBackNavigation` now registers a lifecycle-owned AndroidX OnBackPressedCallback after Capacitor bridge creation. It sends one fixed cancelable event to the existing app shell. An app-owned layer cancels the event and requests the same history Back used by visible controls. With no layer, native handling delegates to normal Android/Capacitor Back. Reentry, destroyed activities and a bounded 1.5-second unanswered WebView call have explicit guards. No navigation/content/audio/mastery state is moved into native code.

The existing Capacitor sync hook installs the native navigation class through a separate conservative/idempotent helper. It refuses ambiguous lifecycle anchors and does not check in the generated Android project or add a package dependency. Tests cover event cancellation, root fallback, cleanup, duplicate install and installer boundaries. The unchanged real Android studio path must pass after the fix; browser/unit tests alone are insufficient.

Primary API basis: AndroidX OnBackPressedDispatcher lifecycle-owned addCallback; Android WebView.evaluateJavascript; Capacitor 8.5.0 BridgeActivity.getBridge (see their official API/source documentation). The task uses the existing pinned Capacitor dependency, not a version upgrade.
