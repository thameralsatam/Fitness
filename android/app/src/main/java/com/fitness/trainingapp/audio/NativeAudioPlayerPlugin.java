package com.fitness.trainingapp.audio;

import android.content.Intent;
import android.util.Base64;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "NativeAudioPlayer")
public class NativeAudioPlayerPlugin extends Plugin implements PlaybackService.PlaybackEventListener {

    @Override
    public void load() {
        super.load();
        PlaybackService.setEventListener(this);
        ensureServiceStarted();
    }

    private void ensureServiceStarted() {
        try {
            Intent intent = new Intent(getContext(), PlaybackService.class);
            getContext().startService(intent);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private File getAudioTrackFile(String trackId) {
        File dir = new File(getContext().getFilesDir(), "audio_tracks");
        if (!dir.exists()) {
            dir.mkdirs();
        }
        return new File(dir, trackId + ".dat");
    }

    @PluginMethod
    public void isNativeSupported(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("supported", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void cacheTrack(PluginCall call) {
        String id = call.getString("id");
        String base64Data = call.getString("data");

        if (id == null || id.isEmpty() || base64Data == null || base64Data.isEmpty()) {
            call.reject("Track ID and base64 audio data are required.");
            return;
        }

        // Clean any data URL prefix if present (e.g. data:audio/mpeg;base64,...)
        if (base64Data.contains(",")) {
            base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
        }

        try {
            byte[] decodedBytes = Base64.decode(base64Data, Base64.DEFAULT);
            File file = getAudioTrackFile(id);
            try (FileOutputStream fos = new FileOutputStream(file)) {
                fos.write(decodedBytes);
                fos.flush();
            }

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("id", id);
            ret.put("size", decodedBytes.length);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to cache audio track: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void hasCachedTrack(PluginCall call) {
        String id = call.getString("id");
        if (id == null || id.isEmpty()) {
            call.reject("Track ID is required.");
            return;
        }
        File file = getAudioTrackFile(id);
        JSObject ret = new JSObject();
        ret.put("cached", file.exists() && file.length() > 0);
        ret.put("id", id);
        call.resolve(ret);
    }

    @PluginMethod
    public void deleteCachedTrack(PluginCall call) {
        String id = call.getString("id");
        if (id == null || id.isEmpty()) {
            call.reject("Track ID is required.");
            return;
        }
        File file = getAudioTrackFile(id);
        boolean deleted = file.exists() && file.delete();
        JSObject ret = new JSObject();
        ret.put("success", deleted);
        ret.put("id", id);
        call.resolve(ret);
    }

    @PluginMethod
    public void clearCache(PluginCall call) {
        File dir = new File(getContext().getFilesDir(), "audio_tracks");
        if (dir.exists() && dir.isDirectory()) {
            File[] files = dir.listFiles();
            if (files != null) {
                for (File f : files) {
                    f.delete();
                }
            }
        }
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void setPlaylist(PluginCall call) {
        ensureServiceStarted();
        JSArray tracksArray = call.getArray("tracks");
        int startIndex = call.getInt("startIndex", 0);
        double startPosSec = call.getDouble("startPosition", 0.0);
        long startPosMs = (long) (startPosSec * 1000);

        if (tracksArray == null || tracksArray.length() == 0) {
            call.reject("Tracks array cannot be empty.");
            return;
        }

        List<PlaybackService.MediaTrackData> list = new ArrayList<>();
        for (int i = 0; i < tracksArray.length(); i++) {
            try {
                JSONObject obj = tracksArray.getJSONObject(i);
                String id = obj.optString("id");
                String name = obj.optString("name", "Audio Track");
                String artist = obj.optString("artist", "Full Body Workout");
                String album = obj.optString("album", "Trainingsplan Motivation");
                long durationMs = (long) (obj.optDouble("duration", 0.0) * 1000);
                int order = obj.optInt("order", i);

                list.add(new PlaybackService.MediaTrackData(id, name, artist, album, durationMs, order));
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }

        PlaybackService service = PlaybackService.getInstance();
        if (service != null) {
            service.setPlaylistAndPlay(list, startIndex, startPosMs);
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } else {
            call.reject("PlaybackService is not yet available.");
        }
    }

    @PluginMethod
    public void playTrack(PluginCall call) {
        ensureServiceStarted();
        String id = call.getString("id");
        String name = call.getString("name", "Audio Track");
        String artist = call.getString("artist", "Full Body Workout");
        String album = call.getString("album", "Trainingsplan Motivation");
        double startPosSec = call.getDouble("startPosition", 0.0);
        long startPosMs = (long) (startPosSec * 1000);

        if (id == null || id.isEmpty()) {
            call.reject("Track ID is required.");
            return;
        }

        PlaybackService service = PlaybackService.getInstance();
        if (service != null) {
            service.playTrack(id, name, artist, album, startPosMs);
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("id", id);
            call.resolve(ret);
        } else {
            call.reject("PlaybackService is not yet available.");
        }
    }

    @PluginMethod
    public void pause(PluginCall call) {
        PlaybackService service = PlaybackService.getInstance();
        if (service != null) {
            service.pause();
        }
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void resume(PluginCall call) {
        PlaybackService service = PlaybackService.getInstance();
        if (service != null) {
            service.resume();
        }
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        PlaybackService service = PlaybackService.getInstance();
        if (service != null) {
            service.stop();
        }
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void seekTo(PluginCall call) {
        double timeSec = call.getDouble("time", 0.0);
        long timeMs = (long) (timeSec * 1000);
        PlaybackService service = PlaybackService.getInstance();
        if (service != null) {
            service.seekTo(timeMs);
        }
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void skip(PluginCall call) {
        double deltaSec = call.getDouble("seconds", 10.0);
        long deltaMs = (long) (deltaSec * 1000);
        PlaybackService service = PlaybackService.getInstance();
        if (service != null) {
            service.skip(deltaMs);
        }
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void next(PluginCall call) {
        PlaybackService service = PlaybackService.getInstance();
        if (service != null) {
            service.next();
        }
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void previous(PluginCall call) {
        PlaybackService service = PlaybackService.getInstance();
        if (service != null) {
            service.previous();
        }
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void setPlaybackSpeed(PluginCall call) {
        double speed = call.getDouble("speed", 1.0);
        PlaybackService service = PlaybackService.getInstance();
        if (service != null) {
            service.setPlaybackSpeed((float) speed);
        }
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void setRepeatMode(PluginCall call) {
        String mode = call.getString("mode", "all");
        PlaybackService service = PlaybackService.getInstance();
        if (service != null) {
            service.setRepeatMode(mode);
        }
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void setVolume(PluginCall call) {
        double volume = call.getDouble("volume", 1.0);
        PlaybackService service = PlaybackService.getInstance();
        if (service != null) {
            service.setVolume((float) volume);
        }
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void getPlaybackState(PluginCall call) {
        PlaybackService service = PlaybackService.getInstance();
        JSObject ret = new JSObject();
        if (service != null && service.getPlayer() != null) {
            ret.put("isPlaying", service.getPlayer().isPlaying());
            ret.put("currentPosition", service.getPlayer().getCurrentPosition() / 1000.0);
            ret.put("duration", service.getPlayer().getDuration() / 1000.0);
            ret.put("currentIndex", service.getPlayer().getCurrentMediaItemIndex());
            ret.put("playbackSpeed", service.getPlayer().getPlaybackParameters().speed);
        } else {
            ret.put("isPlaying", false);
            ret.put("currentPosition", 0);
            ret.put("duration", 0);
            ret.put("currentIndex", -1);
            ret.put("playbackSpeed", 1.0);
        }
        call.resolve(ret);
    }

    // PlaybackService.PlaybackEventListener callbacks -> send to React via notifyListeners
    @Override
    public void onPlaybackStateChanged(boolean isPlaying, int playbackState, String currentTrackId, int currentTrackIndex) {
        JSObject data = new JSObject();
        data.put("isPlaying", isPlaying);
        data.put("playbackState", playbackState);
        data.put("currentTrackId", currentTrackId);
        data.put("currentTrackIndex", currentTrackIndex);
        notifyListeners("onPlaybackStateChange", data);
    }

    @Override
    public void onPositionUpdated(long currentPositionMs, long durationMs, String currentTrackId, int currentTrackIndex) {
        JSObject data = new JSObject();
        data.put("currentTime", currentPositionMs / 1000.0);
        data.put("duration", durationMs > 0 ? durationMs / 1000.0 : 0);
        data.put("currentTrackId", currentTrackId);
        data.put("currentTrackIndex", currentTrackIndex);
        notifyListeners("onProgress", data);
    }

    @Override
    public void onTrackChanged(String currentTrackId, int currentTrackIndex) {
        JSObject data = new JSObject();
        data.put("currentTrackId", currentTrackId);
        data.put("currentTrackIndex", currentTrackIndex);
        notifyListeners("onTrackChanged", data);
    }

    @Override
    public void onTrackEnded(String currentTrackId, int currentTrackIndex) {
        JSObject data = new JSObject();
        data.put("currentTrackId", currentTrackId);
        data.put("currentTrackIndex", currentTrackIndex);
        notifyListeners("onTrackEnded", data);
    }

    @Override
    public void onError(String errorMessage) {
        JSObject data = new JSObject();
        data.put("message", errorMessage);
        notifyListeners("onError", data);
    }
}
