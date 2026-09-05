package com.kidsplay.app.navigation;

import android.os.Handler;
import android.os.Looper;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

/** One native-to-host Back bridge. No studio, content, storage or scoring logic. */
public final class KidsplayBackNavigation {
    private KidsplayBackNavigation() {}

    public static void install(BridgeActivity activity) {
        Handler handler = new Handler(Looper.getMainLooper());
        activity.getOnBackPressedDispatcher().addCallback(activity, new OnBackPressedCallback(true) {
            private boolean pending = false;
            private int request = 0;

            private void complete(int token, boolean handled) {
                if (!pending || token != request) return;
                pending = false;
                if (activity.isFinishing() || activity.isDestroyed() || handled) return;
                // No app-owned layer: retain normal Android/Capacitor root Back.
                setEnabled(false);
                try { activity.getOnBackPressedDispatcher().onBackPressed(); }
                finally { setEnabled(true); }
            }

            @Override
            public void handleOnBackPressed() {
                if (pending || activity.isFinishing() || activity.isDestroyed()) return;
                pending = true;
                int token = ++request;
                WebView webView = activity.getBridge() == null ? null : activity.getBridge().getWebView();
                if (webView == null) { complete(token, false); return; }
                Runnable timeout = () -> complete(token, false);
                handler.postDelayed(timeout, 1500);
                try {
                    // dispatchEvent returns false only when the shared host
                    // cancels this event because it owns a navigation layer.
                    webView.evaluateJavascript(
                        "window.dispatchEvent(new Event('kidsplay:system-back',{cancelable:true}))",
                        result -> {
                            handler.removeCallbacks(timeout);
                            complete(token, "false".equals(result));
                        }
                    );
                } catch (RuntimeException exception) {
                    handler.removeCallbacks(timeout);
                    complete(token, false);
                }
            }
        });
    }
}
