package com.fitness.trainingapp.audio;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.OptIn;
import androidx.core.app.NotificationCompat;
import androidx.media3.common.AudioAttributes;
import androidx.media3.common.C;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MediaMetadata;
import androidx.media3.common.MimeTypes;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.PlaybackParameters;
import androidx.media3.common.Player;
import androidx.media3.common.util.UnstableApi;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.session.MediaSession;
import androidx.media3.session.MediaSessionService;
import androidx.media3.session.MediaStyleNotificationHelper;
import com.fitness.trainingapp.MainActivity;
import com.fitness.trainingapp.R;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

public class PlaybackService extends MediaSessionService {

    private static final String TAG = "PlaybackService";
    private static final String CHANNEL_ID = "fitness_audio_playback_channel";
    private static final int NOTIFICATION_ID = 1001;

    private static PlaybackService instance;
    private static PlaybackEventListener eventListener;

    private ExoPlayer player;
    private MediaSession mediaSession;

    private final Handler progressHandler = new Handler(Looper.getMainLooper());
    private Runnable progressRunnable;

    private final List<MediaTrackData> playlist = new ArrayList<>();
    private int currentTrackIndex = -1;

    public interface PlaybackEventListener {
        void onPlaybackStateChanged(boolean isPlaying, int playbackState, String currentTrackId, int currentTrackIndex);
        void onPositionUpdated(long currentPositionMs, long durationMs, String currentTrackId, int currentTrackIndex);
        void onTrackChanged(String currentTrackId, int currentTrackIndex);
        void onTrackEnded(String currentTrackId, int currentTrackIndex);
        void onError(String errorMessage);
    }

    public static PlaybackService getInstance() {
        return instance;
    }

    public static void setEventListener(PlaybackEventListener listener) {
        eventListener = listener;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        createNotificationChannel();
        initializePlayer();
        NativeAudioPlayerPlugin.onServiceReady(this);
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Fitness Audio Player",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Background audio playback for workout motivation");
            channel.setShowBadge(false);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    @OptIn(markerClass = UnstableApi.class)
    private void initializePlayer() {
        AudioAttributes audioAttributes = new AudioAttributes.Builder()
            .setUsage(C.USAGE_MEDIA)
            .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)
            .build();

        player = new ExoPlayer.Builder(this)
            .setAudioAttributes(audioAttributes, true)
            .setHandleAudioBecomingNoisy(true)
            .setWakeMode(C.WAKE_MODE_LOCAL)
            .build();

        player.setRepeatMode(Player.REPEAT_MODE_OFF);

        Intent sessionActivityIntent = new Intent(this, MainActivity.class);
        PendingIntent sessionPendingIntent = PendingIntent.getActivity(
            this,
            0,
            sessionActivityIntent,
            PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );

        mediaSession = new MediaSession.Builder(this, player)
            .setSessionActivity(sessionPendingIntent)
            .build();

        player.addListener(new Player.Listener() {
            @Override
            public void onIsPlayingChanged(boolean isPlaying) {
                updateNotification();
                String trackId = getCurrentTrackId();
                if (eventListener != null) {
                    eventListener.onPlaybackStateChanged(isPlaying, player.getPlaybackState(), trackId, currentTrackIndex);
                }
                if (isPlaying) {
                    startProgressTracker();
                } else {
                    stopProgressTracker();
                }
            }

            @Override
            public void onPlaybackStateChanged(int playbackState) {
                String trackId = getCurrentTrackId();
                if (eventListener != null) {
                    eventListener.onPlaybackStateChanged(player.isPlaying(), playbackState, trackId, currentTrackIndex);
                }
                if (playbackState == Player.STATE_ENDED) {
                    if (eventListener != null) {
                        eventListener.onTrackEnded(trackId, currentTrackIndex);
                    }
                }
                updateNotification();
            }

            @Override
            public void onMediaItemTransition(@Nullable MediaItem mediaItem, int reason) {
                currentTrackIndex = player.getCurrentMediaItemIndex();
                String trackId = getCurrentTrackId();
                if (eventListener != null) {
                    eventListener.onTrackChanged(trackId, currentTrackIndex);
                }
                updateNotification();
            }

            @Override
            public void onPlayerError(@NonNull PlaybackException error) {
                Log.e(TAG, "[DEBUG_PLAYBACK] ExoPlayer ERROR occurred: " + error.getMessage(), error);
                Log.e(TAG, "[DEBUG_PLAYBACK] Error code: " + error.errorCode + ", Cause: " + error.getCause());
                String errorMessage = error.getMessage() != null ? error.getMessage() : "Unknown playback error";
                String errorCodeName = PlaybackException.getErrorCodeName(error.errorCode);
                if (errorCodeName != null) {
                    errorMessage += " (" + errorCodeName + ")";
                    Log.e(TAG, "[DEBUG_PLAYBACK] Error code name: " + errorCodeName);
                }
                if (eventListener != null) {
                    eventListener.onError(errorMessage);
                }
            }
        });
    }

    @Nullable
    @Override
    public MediaSession onGetSession(@NonNull MediaSession.ControllerInfo controllerInfo) {
        return mediaSession;
    }

    private String normalizeMimeType(String rawMime, String fileName) {
        if (rawMime != null && !rawMime.trim().isEmpty() && !rawMime.equalsIgnoreCase("application/octet-stream")) {
            String mime = rawMime.trim().toLowerCase();
            if (mime.contains("audio/mpeg") || mime.contains("audio/mp3")) return MimeTypes.AUDIO_MPEG;
            if (mime.contains("audio/aac")) return MimeTypes.AUDIO_AAC;
            if (mime.contains("audio/wav") || mime.contains("audio/x-wav") || mime.contains("audio/wave")) return MimeTypes.AUDIO_WAV;
            if (mime.contains("audio/flac") || mime.contains("audio/x-flac")) return MimeTypes.AUDIO_FLAC;
            if (mime.contains("audio/ogg") || mime.contains("application/ogg")) return MimeTypes.AUDIO_OGG;
            if (mime.contains("audio/mp4") || mime.contains("audio/m4a") || mime.contains("audio/x-m4a")) return MimeTypes.AUDIO_MP4;
            return mime;
        }

        if (fileName != null) {
            String lower = fileName.toLowerCase();
            if (lower.endsWith(".mp3")) return MimeTypes.AUDIO_MPEG;
            if (lower.endsWith(".aac")) return MimeTypes.AUDIO_AAC;
            if (lower.endsWith(".wav")) return MimeTypes.AUDIO_WAV;
            if (lower.endsWith(".flac")) return MimeTypes.AUDIO_FLAC;
            if (lower.endsWith(".ogg") || lower.endsWith(".oga")) return MimeTypes.AUDIO_OGG;
            if (lower.endsWith(".m4a") || lower.endsWith(".mp4")) return MimeTypes.AUDIO_MP4;
        }

        return MimeTypes.AUDIO_MPEG; // Default fallback for workout music
    }

    private void runOnMainThread(String operationName, Runnable action) {
        Log.d(TAG, "[DEBUG_NATIVE_AUDIO] Current thread before player operation (" + operationName + "): " + Thread.currentThread().getName());
        new Handler(Looper.getMainLooper()).post(() -> {
            Log.d(TAG, "[DEBUG_PLAYBACK] Player operation (" + operationName + ") executing on thread: " + Thread.currentThread().getName());
            try {
                action.run();
                Log.d(TAG, "[DEBUG_PLAYBACK] Player operation (" + operationName + ") completed successfully on thread: " + Thread.currentThread().getName());
            } catch (Exception e) {
                Log.e(TAG, "[DEBUG_PLAYBACK] Player operation (" + operationName + ") failed: " + e.getMessage(), e);
            }
        });
    }

    public void setPlaylistAndPlay(List<MediaTrackData> tracks, int startIndex, long startPositionMs) {
        runOnMainThread("setPlaylistAndPlay", () -> {
            Log.i(TAG, "[DEBUG_PLAYBACK] setPlaylistAndPlay called. Tracks count: " + tracks.size() + ", startIndex: " + startIndex + ", startPosMs: " + startPositionMs);
            playlist.clear();
            playlist.addAll(tracks);

            List<MediaItem> mediaItems = new ArrayList<>();
            for (MediaTrackData track : tracks) {
                File trackFile = getTrackFile(track.id);
                boolean exists = trackFile.exists();
                long length = exists ? trackFile.length() : 0;
                Log.d(TAG, "[DEBUG_PLAYBACK] Track ID: " + track.id + ", Name: " + track.name + ", File path: " + trackFile.getAbsolutePath() + " exists: " + exists + " length: " + length);
                if (!exists) {
                    Log.w(TAG, "[DEBUG_PLAYBACK] Audio track file NOT found for ID: " + track.id);
                }

                String determinedMimeType = normalizeMimeType(track.mimeType, track.name);
                Log.d(TAG, "[DEBUG_PLAYBACK] Determined mime type: " + determinedMimeType);

                MediaMetadata mediaMetadata = new MediaMetadata.Builder()
                    .setTitle(track.name)
                    .setArtist(track.artist)
                    .setAlbumTitle(track.album)
                    .build();

                MediaItem item = new MediaItem.Builder()
                    .setMediaId(track.id)
                    .setUri(Uri.fromFile(trackFile))
                    .setMimeType(determinedMimeType)
                    .setMediaMetadata(mediaMetadata)
                    .build();

                mediaItems.add(item);
            }

            if (!mediaItems.isEmpty()) {
                Log.i(TAG, "[DEBUG_PLAYBACK] Setting media items in ExoPlayer. Math.max(0, startIndex)=" + Math.max(0, startIndex));
                player.setMediaItems(mediaItems, Math.max(0, startIndex), Math.max(0, startPositionMs));
                Log.i(TAG, "[DEBUG_PLAYBACK] Calling player.prepare()");
                player.prepare();
                Log.i(TAG, "[DEBUG_PLAYBACK] Calling player.play()");
                player.play();
                currentTrackIndex = Math.max(0, startIndex);
                Log.i(TAG, "[DEBUG_PLAYBACK] ExoPlayer state after play() - isPlaying: " + player.isPlaying() + ", PlaybackState: " + player.getPlaybackState());
            } else {
                Log.e(TAG, "[DEBUG_PLAYBACK] Cannot start playback because mediaItems list is empty!");
            }
        });
    }

    public void playTrack(String trackId, String name, String artist, String album, long startPositionMs, String mimeType) {
        runOnMainThread("playTrack", () -> {
            File trackFile = getTrackFile(trackId);
            String determinedMimeType = normalizeMimeType(mimeType, name);

            MediaMetadata mediaMetadata = new MediaMetadata.Builder()
                .setTitle(name)
                .setArtist(artist)
                .setAlbumTitle(album)
                .build();

            MediaItem mediaItem = new MediaItem.Builder()
                .setMediaId(trackId)
                .setUri(Uri.fromFile(trackFile))
                .setMimeType(determinedMimeType)
                .setMediaMetadata(mediaMetadata)
                .build();

            player.setMediaItem(mediaItem, Math.max(0, startPositionMs));
            player.prepare();
            player.play();
            currentTrackIndex = 0;
        });
    }

    public void pause() {
        runOnMainThread("pause", () -> {
            if (player != null) {
                player.pause();
            }
        });
    }

    public void resume() {
        runOnMainThread("resume", () -> {
            if (player != null) {
                if (player.getPlaybackState() == Player.STATE_IDLE) {
                    player.prepare();
                }
                player.play();
            }
        });
    }

    public void stop() {
        runOnMainThread("stop", () -> {
            if (player != null) {
                player.stop();
                stopProgressTracker();
            }
        });
    }

    public void seekTo(long positionMs) {
        runOnMainThread("seekTo", () -> {
            if (player != null) {
                player.seekTo(Math.max(0, positionMs));
            }
        });
    }

    public void skip(long deltaMs) {
        runOnMainThread("skip", () -> {
            if (player != null) {
                long newPos = Math.max(0, player.getCurrentPosition() + deltaMs);
                if (player.getDuration() > 0) {
                    newPos = Math.min(newPos, player.getDuration());
                }
                player.seekTo(newPos);
            }
        });
    }

    public void next() {
        runOnMainThread("next", () -> {
            if (player != null && player.hasNextMediaItem()) {
                player.seekToNextMediaItem();
            }
        });
    }

    public void previous() {
        runOnMainThread("previous", () -> {
            if (player != null) {
                if (player.getCurrentPosition() > 3000 || !player.hasPreviousMediaItem()) {
                    player.seekTo(0);
                } else {
                    player.seekToPreviousMediaItem();
                }
            }
        });
    }

    public void setPlaybackSpeed(float speed) {
        runOnMainThread("setPlaybackSpeed", () -> {
            if (player != null) {
                player.setPlaybackParameters(new PlaybackParameters(speed));
            }
        });
    }

    public void setRepeatMode(String mode) {
        runOnMainThread("setRepeatMode", () -> {
            if (player != null) {
                switch (mode) {
                    case "one":
                        player.setShuffleModeEnabled(false);
                        player.setRepeatMode(Player.REPEAT_MODE_ONE);
                        break;
                    case "all":
                        player.setShuffleModeEnabled(false);
                        player.setRepeatMode(Player.REPEAT_MODE_ALL);
                        break;
                    case "shuffle":
                        player.setShuffleModeEnabled(true);
                        player.setRepeatMode(Player.REPEAT_MODE_ALL);
                        break;
                    case "off":
                    default:
                        player.setShuffleModeEnabled(false);
                        player.setRepeatMode(Player.REPEAT_MODE_OFF);
                        break;
                }
            }
        });
    }

    public void setVolume(float volume) {
        runOnMainThread("setVolume", () -> {
            if (player != null) {
                player.setVolume(Math.max(0.0f, Math.min(1.0f, volume)));
            }
        });
    }

    public ExoPlayer getPlayer() {
        return player;
    }

    private String getCurrentTrackId() {
        if (player != null && player.getCurrentMediaItem() != null) {
            return player.getCurrentMediaItem().mediaId;
        }
        return null;
    }

    private void startProgressTracker() {
        stopProgressTracker();
        progressRunnable = new Runnable() {
            @Override
            public void run() {
                if (player != null && player.isPlaying()) {
                    long currentPos = player.getCurrentPosition();
                    long duration = player.getDuration();
                    String trackId = getCurrentTrackId();
                    if (eventListener != null) {
                        eventListener.onPositionUpdated(currentPos, duration, trackId, currentTrackIndex);
                    }
                    progressHandler.postDelayed(this, 500);
                }
            }
        };
        progressHandler.post(progressRunnable);
    }

    private void stopProgressTracker() {
        if (progressRunnable != null) {
            progressHandler.removeCallbacks(progressRunnable);
            progressRunnable = null;
        }
    }

    @OptIn(markerClass = UnstableApi.class)
    private void updateNotification() {
        if (player == null) return;

        MediaItem currentItem = player.getCurrentMediaItem();
        String title = "Fitness Audio Player";
        String artist = "Workout Motivation";

        if (currentItem != null && currentItem.mediaMetadata.title != null) {
            title = currentItem.mediaMetadata.title.toString();
        }
        if (currentItem != null && currentItem.mediaMetadata.artist != null) {
            artist = currentItem.mediaMetadata.artist.toString();
        }

        Intent openAppIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingOpenApp = PendingIntent.getActivity(
            this,
            0,
            openAppIntent,
            PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(artist)
            .setContentIntent(pendingOpenApp)
            .setOngoing(player.isPlaying())
            .setSilent(true)
            .setStyle(new MediaStyleNotificationHelper.MediaStyle(mediaSession)
                .setShowActionsInCompactView(0, 1, 2));

        Notification notification = builder.build();
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID, notification);
        }
    }

    @Override
    public void onDestroy() {
        stopProgressTracker();
        instance = null;
        NativeAudioPlayerPlugin.onServiceDestroyed();
        if (player != null) {
            player.release();
            player = null;
        }
        if (mediaSession != null) {
            mediaSession.release();
            mediaSession = null;
        }
        super.onDestroy();
    }

    private File getTrackFile(String trackId) {
        File dir = new File(getFilesDir(), "audio_tracks");
        return new File(dir, trackId + ".dat");
    }

    public static class MediaTrackData {
        public String id;
        public String name;
        public String artist;
        public String album;
        public long durationMs;
        public int order;
        public String mimeType;

        public MediaTrackData(String id, String name, String artist, String album, long durationMs, int order, String mimeType) {
            this.id = id;
            this.name = name;
            this.artist = artist;
            this.album = album;
            this.durationMs = durationMs;
            this.order = order;
            this.mimeType = mimeType;
        }
    }
}
