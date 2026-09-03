package com.kidsplay.app.audio;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.Voice;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@CapacitorPlugin(name = "KidsplayOfflineSpeech")
public class KidsplayOfflineSpeechPlugin extends Plugin {
    private TextToSpeech textToSpeech;
    private volatile boolean initializationFinished = false;
    private volatile boolean available = false;

    @Override
    public void load() {
        try {
            textToSpeech = new TextToSpeech(getContext(), status -> {
                available = status == TextToSpeech.SUCCESS;
                initializationFinished = true;
            });
        } catch (RuntimeException error) {
            available = false;
            initializationFinished = true;
        }
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        String language = call.getString("lang", "en-IN");
        Voice voice = initializationFinished && available ? selectOfflineVoice(language) : null;
        JSObject result = new JSObject();
        result.put("ready", initializationFinished);
        result.put("available", available);
        result.put("hasOfflineVoice", voice != null);
        if (voice != null) result.put("voiceName", voice.getName());
        call.resolve(result);
    }

    @PluginMethod
    public void speak(PluginCall call) {
        if (!initializationFinished) {
            call.reject("Offline speech is still initializing.", "NOT_READY");
            return;
        }
        if (!available || textToSpeech == null) {
            call.reject("Android text to speech is unavailable.", "TTS_UNAVAILABLE");
            return;
        }

        String text = call.getString("text", "").trim();
        String language = call.getString("lang", "en-IN");
        Float rate = call.getFloat("rate", 0.84f);
        Float pitch = call.getFloat("pitch", 1.12f);
        if (text.isEmpty()) {
            call.reject("Speech text is empty.", "EMPTY_TEXT");
            return;
        }

        Voice voice = selectOfflineVoice(language);
        if (voice == null) {
            call.reject("No installed offline voice is available for this language.", "NO_OFFLINE_VOICE");
            return;
        }

        int voiceResult = textToSpeech.setVoice(voice);
        if (voiceResult == TextToSpeech.ERROR) {
            call.reject("The installed offline voice could not be selected.", "VOICE_SELECTION_FAILED");
            return;
        }

        textToSpeech.setSpeechRate(clamp(rate, 0.55f, 1.35f));
        textToSpeech.setPitch(clamp(pitch, 0.75f, 1.35f));
        Bundle params = new Bundle();
        params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, 1.0f);
        String utteranceId = "kidsplay-" + UUID.randomUUID();
        int speakResult = textToSpeech.speak(text, TextToSpeech.QUEUE_FLUSH, params, utteranceId);
        if (speakResult == TextToSpeech.ERROR) {
            call.reject("The offline voice could not start speaking.", "SPEAK_FAILED");
            return;
        }

        JSObject result = new JSObject();
        result.put("voiceName", voice.getName());
        call.resolve(result);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (textToSpeech != null) textToSpeech.stop();
        call.resolve();
    }

    @PluginMethod
    public void openInstall(PluginCall call) {
        Intent installIntent = new Intent(TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA);
        PackageManager packageManager = getContext().getPackageManager();
        ResolveInfo target = packageManager.resolveActivity(installIntent, PackageManager.MATCH_DEFAULT_ONLY);
        JSObject result = new JSObject();
        if (target == null) {
            result.put("opened", false);
            call.resolve(result);
            return;
        }
        installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(installIntent);
        result.put("opened", true);
        call.resolve(result);
    }

    @Override
    protected void handleOnDestroy() {
        if (textToSpeech != null) {
            textToSpeech.stop();
            textToSpeech.shutdown();
            textToSpeech = null;
        }
    }

    private Voice selectOfflineVoice(String languageTag) {
        if (textToSpeech == null) return null;
        Set<Voice> voices = textToSpeech.getVoices();
        if (voices == null || voices.isEmpty()) return null;

        Locale requested = Locale.forLanguageTag(languageTag);
        String requestedLanguage = requested.getLanguage();
        if (requestedLanguage == null || requestedLanguage.isEmpty()) return null;

        List<Voice> candidates = new ArrayList<>();
        for (Voice voice : voices) {
            if (voice.isNetworkConnectionRequired()) continue;
            Set<String> features = voice.getFeatures();
            if (features != null && features.contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED)) continue;
            Locale locale = voice.getLocale();
            if (locale == null || !requestedLanguage.equalsIgnoreCase(locale.getLanguage())) continue;
            candidates.add(voice);
        }

        candidates.sort(
            Comparator.<Voice>comparingInt(voice -> localeScore(voice.getLocale(), requested)).reversed()
                .thenComparing(Comparator.comparingInt(Voice::getQuality).reversed())
                .thenComparingInt(Voice::getLatency)
                .thenComparing(Voice::getName)
        );
        return candidates.isEmpty() ? null : candidates.get(0);
    }

    private int localeScore(Locale voiceLocale, Locale requested) {
        if (voiceLocale == null) return 0;
        if (voiceLocale.toLanguageTag().equalsIgnoreCase(requested.toLanguageTag())) return 3;
        if (!requested.getCountry().isEmpty() && requested.getCountry().equalsIgnoreCase(voiceLocale.getCountry())) return 2;
        return 1;
    }

    private float clamp(Float value, float minimum, float maximum) {
        float actual = value == null ? minimum : value;
        return Math.max(minimum, Math.min(maximum, actual));
    }
}
