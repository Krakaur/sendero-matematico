package org.krakaur.sendero;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;
import androidx.webkit.WebViewAssetLoader;
import java.io.ByteArrayInputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
    private static final String START = "https://appassets.androidplatform.net/assets/index.html";
    private static final int OPEN = 41, SAVE = 42;
    private WebView web;
    private ValueCallback<Uri[]> fileCallback;
    private byte[] pendingExport;
    private boolean ready;
    private final android.os.Handler handler = new android.os.Handler(android.os.Looper.getMainLooper());

    @Override @SuppressLint("SetJavaScriptEnabled")
    public void onCreate(Bundle state) {
        super.onCreate(state);
        FrameLayout frame = new FrameLayout(this);
        frame.setBackgroundColor(0xfffaf8f0);
        setContentView(frame);
        // API 35+ enforces edge-to-edge; keep all game controls outside system bars.
        if (Build.VERSION.SDK_INT >= 35) {
            frame.setOnApplyWindowInsetsListener((v, insets) -> {
                android.graphics.Insets bars = insets.getInsets(
                    android.view.WindowInsets.Type.systemBars() | android.view.WindowInsets.Type.displayCutout());
                v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                return insets;
            });
        }
        try { web = new WebView(this); }
        catch (RuntimeException error) { showUnavailable(); return; }
        frame.addView(web, new FrameLayout.LayoutParams(-1, -1));
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true); // User-selected documents only, via system picker.
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setUserAgentString(settings.getUserAgentString() + " SenderoAndroid/1");
        android.webkit.CookieManager.getInstance().setAcceptCookie(false);
        web.setBackgroundColor(0xfffaf8f0);
        web.addJavascriptInterface(new LocalBridge(), "SenderoAndroid");
        WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this)).build();
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                WebResourceResponse local = loader.shouldInterceptRequest(request.getUrl());
                // Never fall through to a remote server or content provider.
                return local != null ? local : new WebResourceResponse("text/plain", "UTF-8", 403,
                    "Blocked", java.util.Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !isGameUrl(request.getUrl());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return !isGameUrl(Uri.parse(url));
            }
            @Override public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                ((android.view.ViewGroup) view.getParent()).removeView(view);
                view.destroy(); web = null; showUnavailable(); return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE)
                    .setType("*/*").putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"application/json", "text/plain", "application/octet-stream"})
                    .putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                try { startActivityForResult(intent, OPEN); }
                catch (ActivityNotFoundException error) { fileCallback.onReceiveValue(null); fileCallback = null; toast("No hay selector de archivos disponible."); }
                return true;
            }
        });
        web.loadUrl(START);
        if (Build.VERSION.SDK_INT >= 33) getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
            android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::onBackPressed);
        handler.postDelayed(() -> { if (!ready && !isFinishing()) showUnavailable(); }, 20000);
    }

    private static boolean isGameUrl(Uri uri) {
        return "https".equals(uri.getScheme()) && "appassets.androidplatform.net".equals(uri.getHost())
            && "/assets/index.html".equals(uri.getPath()) && uri.getPort() == -1;
    }
    private void toast(String text) { Toast.makeText(this, text, Toast.LENGTH_LONG).show(); }
    private void showUnavailable() {
        new AlertDialog.Builder(this).setTitle("No se pudo abrir Sendero")
            .setMessage("El componente Android System WebView puede necesitar una actualización o el teléfono puede tener poca memoria. Cierra otras aplicaciones y vuelve a intentarlo. Actualiza WebView en un punto con conexión. Tus datos guardados no se borran.")
            .setPositiveButton("Cerrar", (dialog, which) -> finish()).setCancelable(false).show();
    }

    public final class LocalBridge {
        @JavascriptInterface public void ready() { runOnUiThread(() -> ready = true); }
        @JavascriptInterface public void saveFile(String name, String content, String mime) {
            if (name == null || content == null || !name.matches("sendero-[A-Za-z0-9-]+\\.(json|csv)")
                || content.length() > 10 * 1024 * 1024) return;
            final String safeMime = name.endsWith(".json") ? "application/json" : "text/csv";
            runOnUiThread(() -> {
                if (pendingExport != null) { toast("Termina de guardar el archivo anterior."); return; }
                pendingExport = content.getBytes(StandardCharsets.UTF_8);
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE)
                    .setType(safeMime).putExtra(Intent.EXTRA_TITLE, name);
                try { startActivityForResult(intent, SAVE); }
                catch (ActivityNotFoundException error) { pendingExport = null; toast("No hay selector para guardar archivos."); }
            });
        }
        @JavascriptInterface public void openExternal(String url) {
            if (url == null) return;
            Uri uri = Uri.parse(url);
            if (!"https".equals(uri.getScheme()) || !"github.com".equals(uri.getHost())
                || uri.getPort() != -1 || uri.getUserInfo() != null || uri.getPath() == null
                || !(uri.getPath().equals("/Krakaur/sendero-matematico") || uri.getPath().startsWith("/Krakaur/sendero-matematico/"))) return;
            runOnUiThread(() -> new AlertDialog.Builder(MainActivity.this).setTitle("Para una persona adulta")
                .setMessage("Vas a abrir la documentación o las descargas en el navegador. Ese sitio necesita conexión y aplica su propia política de privacidad.")
                .setNegativeButton("Volver al juego", null).setPositiveButton("Abrir navegador", (dialog, which) -> {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
                    catch (ActivityNotFoundException error) { toast("No hay navegador disponible."); }
                }).show());
        }
    }

    @Override public void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request == OPEN && fileCallback != null) {
            Uri[] uris = null;
            if (result == RESULT_OK && data != null) {
                if (data.getClipData() != null) {
                    int count = Math.min(data.getClipData().getItemCount(), 100);
                    uris = new Uri[count];
                    for (int i = 0; i < count; i++) uris[i] = data.getClipData().getItemAt(i).getUri();
                } else if (data.getData() != null) uris = new Uri[]{data.getData()};
            }
            fileCallback.onReceiveValue(uris); fileCallback = null;
        }
        if (request == SAVE) {
            byte[] bytes = pendingExport; pendingExport = null;
            if (result == RESULT_OK && data != null && data.getData() != null && bytes != null) {
                Uri destination = data.getData();
                new Thread(() -> {
                    boolean success = false;
                    try (OutputStream output = getContentResolver().openOutputStream(destination, "wt")) {
                        if (output == null) throw new java.io.IOException();
                        output.write(bytes); success = true;
                    } catch (Exception error) { /* No student data in logs. */ }
                    final boolean saved = success;
                    runOnUiThread(() -> {
                        toast(saved ? "Informe guardado. Entrégalo a tu docente." : "No se pudo guardar el informe. Inténtalo de nuevo.");
                        if (web != null) web.evaluateJavascript("window.dispatchEvent(new CustomEvent('sendero-export-result',{detail:" + saved + "}))", null);
                    });
                }, "sendero-export").start();
            }
        }
    }

    @Override public void onBackPressed() {
        if (web != null) web.evaluateJavascript("location.hash === '#explorar' || !location.hash", atHome -> {
            if ("true".equals(atHome)) finish(); else web.evaluateJavascript("location.hash='#explorar'", null);
        });
        else super.onBackPressed();
    }
    @Override protected void onPause() {
        super.onPause();
        if (web != null) {
            web.evaluateJavascript("window.dispatchEvent(new Event('sendero-pause'))", null);
            web.onPause();
        }
    }
    @Override protected void onResume() { super.onResume(); if (web != null) web.onResume(); }
    @Override protected void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        if (fileCallback != null) { fileCallback.onReceiveValue(null); fileCallback = null; }
        if (web != null) { web.removeJavascriptInterface("SenderoAndroid"); web.destroy(); web = null; }
        super.onDestroy();
    }
}
