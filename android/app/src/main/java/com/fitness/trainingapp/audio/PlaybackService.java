package com.fitness.trainingapp.audio;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import androidx.annotation.Nullable;
import androidx.annotation.OptIn;
import androidx.core.app.NotificationCompat;
import androidx.media3.common.AudioAttributes;
import androidx.media3.common.C;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MediaMetadata;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.PlaybackParameters;
import androidx.media3.common.Player;
import androidx.media3.common.util.UnstableApi;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.session.MediaSession;
import androidx.media3.session.MediaSessionService;
import com.fitness.trainingapp.MainActivity;
import com.fitness.trainingapp.R;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

public class PlaybackService extends MediaSessionService {

    public static final String NOTIFICATION_CHANNEL_ID = "workout_audio_playback_channel";
    private static final int NOTIFICATION_ID = 1001;

    private static PlaybackService instance;
    private ExoPlayer player;
    private MediaSession mediaSession;
    private final Handler progressHandler = new Handler(Looper.getMainLooper());
    private Runnable progressRunnable;
    private boolean isUpdatingProgress = false;

    public interface PlaybackEventListener {
        void onPlaybackStateChanged(boolean isPlaying, int playbackState, String currentTrackId, int currentTrackIndex);
        void onPositionUpdated(long currentPositionMs, long durationMs, String currentTrackId, int currentTrackIndex);
        void onTrackChanged(String currentTrackId, int currentTrackIndex);
        void onTrackEnded(String currentTrackId, int currentTrackIndex);
        void onError(String errorMessage);
    }

    private static PlaybackEventListener eventListener;

    public static void setEventListener(PlaybackEventListener listener) {
        eventListener = listener;
    }

    public static PlaybackService getInstance() {
        return instance;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        createNotificationChannel();
        initializePlayerAndSession();
        NativeAudioPlayerPlugin.onServiceReady(this);
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    NOTIFICATION_CHANNEL_ID,
                    "Workout Music Playback",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Background audio playback controls for workout sessions");
            channel.setShowBadge(false);
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    @OptIn(markerClass = UnstableApi.class)
    private void initializePlayerAndSession() {
        AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)
                .setUsage(C.USAGE_MEDIA)
                .build();

        player = new ExoPlayer.Builder(this)
                .setAudioAttributes(audioAttributes, true)
                .setHandleAudioBecomingNoisy(true)
                .setWakeMode(C.WAKE_MODE_LOCAL)
                .build();

        Intent openAppIntent = new Intent(this, MainActivity.class);
        openAppIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                openAppIntent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );

        mediaSession = new MediaSession.Builder(this, player)
                .setSessionActivity(pendingIntent)
                .setCallback(new MediaSessionCallback())
                .build();

        player.addListener(new Player.Listener() {
            @Override
            public void onIsPlayingChanged(boolean isPlaying) {
                notifyStateChanged();
                if (isPlaying) {
                    startProgressTracker();
                } else {
                    stopProgressTracker();
                }
            }

            @Override
            public void onPlaybackStateChanged(int playbackState) {
                notifyStateChanged();
                if (playbackState == Player.STATE_ENDED) {
                    stopProgressTracker();
                    MediaItem currentItem = player.getCurrentMediaItem();
                    String trackId = currentItem != null ? currentItem.mediaId : "";
                    if (eventListener != null) {
                        eventListener.onTrackEnded(trackId, player.getCurrentMediaItemIndex());
                    }
                }
            }

            @Override
            public void onMediaItemTransition(@Nullable MediaItem mediaItem, int reason) {
                notifyStateChanged();
                String trackId = mediaItem != null ? mediaItem.mediaId : "";
                if (eventListener != null) {
                    eventListener.onTrackChanged(trackId, player.getCurrentMediaItemIndex());
                }
            }

            @Override
            public void onPlayerError(PlaybackException error) {
                if (eventListener != null) {
                    eventListener.onError("Playback error: " + (error != null ? error.getMessage() : "Unknown error"));
                }
            }
        });
    }

    private void startProgressTracker() {
        if (isUpdatingProgress) return;
        isUpdatingProgress = true;
        progressRunnable = new Runnable() {
            @Override
            public void run() {
                if (player != null && player.isPlaying()) {
                    long currentPos = Math.max(0, player.getCurrentPosition());
                    long duration = Math.max(0, player.getDuration());
                    MediaItem currentItem = player.getCurrentMediaItem();
                    String trackId = currentItem != null ? currentItem.mediaId : "";
                    int index = player.getCurrentMediaItemIndex();

                    if (eventListener != null) {
                        eventListener.onPositionUpdated(currentPos, duration, trackId, index);
                    }
                    progressHandler.postDelayed(this, 500);
                } else {
                    isUpdatingProgress = false;
                }
            }
        };
        progressHandler.post(progressRunnable);
    }

    private void stopProgressTracker() {
        isUpdatingProgress = false;
        if (progressRunnable != null) {
            progressHandler.removeCallbacks(progressRunnable);
        }
    }

    private void notifyStateChanged() {
        if (player == null) return;
        boolean isPlaying = player.isPlaying();
        int state = player.getPlaybackState();
        MediaItem currentItem = player.getCurrentMediaItem();
        String trackId = currentItem != null ? currentItem.mediaId : "";
        int index = player.getCurrentMediaItemIndex();

        if (eventListener != null) {
            eventListener.onPlaybackStateChanged(isPlaying, state, trackId, index);
        }
    }

    @Nullable
    @Override
    public MediaSession onGetSession(MediaSession.ControllerInfo controllerInfo) {
        return mediaSession;
    }

    public ExoPlayer getPlayer() {
        return player;
    }

    public MediaSession getMediaSession() {
        return mediaSession;
    }

    // Playback control API methods called from Plugin
    public void setPlaylistAndPlay(List<MediaTrackData> tracks, int startIndex, long startPositionMs) {
        if (player == null) return;
        List<MediaItem> mediaItems = new ArrayList<>();
        for (MediaTrackData track : tracks) {
            File localFile = new File(getFilesDir(), "audio_tracks/" + track.id + ".dat");
            Uri fileUri = Uri.fromFile(localFile);

            MediaMetadata metadata = new MediaMetadata.Builder()
                    .setTitle(track.name)
                    .setArtist(track.artist != null && !track.artist.isEmpty() ? track.artist : "Full Body Workout")
                    .setAlbumTitle(track.album != null && !track.album.isEmpty() ? track.album : "Trainingsplan Motivation")
                    .build();

            MediaItem item = new MediaItem.Builder()
                    .setMediaId(track.id)
                    .setUri(fileUri)
                    .setMediaMetadata(metadata)
                    .build();

            mediaItems.add(item);
        }

        player.setMediaItems(mediaItems, startIndex, startPositionMs);
        player.prepare();
        player.play();
    }

    public void playTrack(String trackId, String name, String artist, String album, long startPositionMs) {
        if (player == null) return;
        
        // Check if track is already in current playlist
        int existingIndex = -1;
        for (int i = 0; i < player.getMediaItemCount(); i++) {
            MediaItem item = player.getMediaItemAt(i);
            if (item != null && trackId.equals(item.mediaId)) {
                existingIndex = i;
                break;
            }
        }

        if (existingIndex >= 0) {
            player.seekTo(existingIndex, startPositionMs);
            player.play();
        } else {
            File localFile = new File(getFilesDir(), "audio_tracks/" + trackId + ".dat");
            if (!localFile.exists()) {
                if (eventListener != null) {
                    eventListener.onError("Local audio file not found for track: " + trackId);
                }
                return;
            }

            MediaMetadata metadata = new MediaMetadata.Builder()
                    .setTitle(name)
                    .setArtist(artist != null && !artist.isEmpty() ? artist : "Full Body Workout")
                    .setAlbumTitle(album != null && !album.isEmpty() ? album : "Trainingsplan Motivation")
                    .build();

            MediaItem item = new MediaItem.Builder()
                    .setMediaId(trackId)
                    .setUri(Uri.fromFile(localFile))
                    .setMediaMetadata(metadata)
                    .build();

            player.setMediaItem(item, startPositionMs);
            player.prepare();
            player.play();
        }
    }

    public void pause() {
        if (player != null) {
            player.pause();
        }
    }

    public void resume() {
        if (player != null) {
            player.play();
        }
    }

    public void stop() {
        if (player != null) {
            player.stop();
            player.clearMediaItems();
            stopProgressTracker();
        }
    }

    public void seekTo(long positionMs) {
        if (player != null) {
            player.seekTo(Math.max(0, positionMs));
        }
    }

    public void skip(long deltaMs) {
        if (player != null) {
            long newPos = Math.max(0, Math.min(player.getCurrentPosition() + deltaMs, player.getDuration()));
            player.seekTo(newPos);
        }
    }

    public void next() {
        if (player != null && player.hasNextMediaItem()) {
            player.seekToNextMediaItem();
            player.play();
        }
    }

    public void previous() {
        if (player != null) {
            if (player.getCurrentPosition() > 3000 || !player.hasPreviousMediaItem()) {
                player.seekTo(0);
            } else {
                player.seekToPreviousMediaItem();
                player.play();
            }
        }
    }

    public void setPlaybackSpeed(float speed) {
        if (player != null) {
            PlaybackParameters params = new PlaybackParameters(speed);
            player.setPlaybackParameters(params);
        }
    }

    public void setRepeatMode(String mode) {
        if (player == null) return;
        switch (mode) {
            case "one":
                player.setRepeatMode(Player.REPEAT_MODE_ONE);
                player.setShuffleModeEnabled(false);
                break;
            case "all":
                player.setRepeatMode(Player.REPEAT_MODE_ALL);
                player.setShuffleModeEnabled(false);
                break;
            case "shuffle":
                player.setRepeatMode(Player.REPEAT_MODE_ALL);
                player.setShuffleModeEnabled(true);
                break;
            case "off":
            default:
                player.setRepeatMode(Player.REPEAT_MODE_OFF);
                player.setShuffleModeEnabled(false);
                break;
        }
    }

    public void setVolume(float volume) {
        if (player != null) {
            player.setVolume(Math.max(0f, Math.min(1f, volume)));
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

    private class MediaSessionCallback implements MediaSession.Callback {
        // Handle media session commands if needed
    }

    public static class MediaTrackData {
        public String id;
        public String name;
        public String artist;
        public String album;
        public long durationMs;
        public int order;

        public MediaTrackData(String id, String name, String artist, String album, long durationMs, int order) {
            this.id = id;
            this.name = name;
            this.artist = artist;
            this.album = album;
            this.durationMs = durationMs;
            this.order = order;
        }
    }
}
