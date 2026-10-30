package com.civiclens.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.activity.OnBackPressedCallback;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {
    private static final int PERMISSION_REQUEST_CODE = 1001;
    private long lastBackPressTime = 0;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestAppPermissions();
        setupBackNavigationHandler();
    }

    private void setupBackNavigationHandler() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                final WebView webView = getBridge() != null ? getBridge().getWebView() : null;
                if (webView == null) {
                    finish();
                    return;
                }

                webView.evaluateJavascript(
                    "(function() { " +
                    "  if (typeof window.__handleAndroidBack === 'function') { return window.__handleAndroidBack(); } " +
                    "  var p = window.location.pathname; " +
                    "  if (p !== '/' && p !== '/dashboard') { window.history.back(); return 'HANDLED'; } " +
                    "  return 'ROOT'; " +
                    "})()",
                    value -> {
                        if (value != null && value.contains("HANDLED")) {
                            return;
                        }
                        if (webView.canGoBack()) {
                            String currentUrl = webView.getUrl();
                            if (currentUrl != null && !currentUrl.endsWith("/") && !currentUrl.endsWith("/dashboard")) {
                                webView.goBack();
                                return;
                            }
                        }
                        long now = System.currentTimeMillis();
                        if (now - lastBackPressTime < 2000) {
                            finish();
                        } else {
                            lastBackPressTime = now;
                            Toast.makeText(MainActivity.this, "Press back again to exit", Toast.LENGTH_SHORT).show();
                        }
                    }
                );
            }
        });
    }

    private void requestAppPermissions() {
        String[] permissions = new String[] {
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        };
        List<String> needed = new ArrayList<>();
        for (String perm : permissions) {
            if (ContextCompat.checkSelfPermission(this, perm) != PackageManager.PERMISSION_GRANTED) {
                needed.add(perm);
            }
        }
        if (!needed.isEmpty()) {
            ActivityCompat.requestPermissions(this, needed.toArray(new String[0]), PERMISSION_REQUEST_CODE);
        }
    }
}
