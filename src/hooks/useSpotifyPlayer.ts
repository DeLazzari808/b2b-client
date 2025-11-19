import { useState, useEffect, useRef } from 'react';

interface Track {
  id: string;
  title: string;
  artist: string;
  uri: string;
  albumArt?: string;
}

interface SpotifyPlayerState {
  isReady: boolean;
  isPlaying: boolean;
  currentTrack: Track | null;
  position: number;
  duration: number;
  deviceId: string | null;
}

declare global {
  interface Window {
    Spotify: any;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

export const useSpotifyPlayer = (accessToken: string | null) => {
  const [playerState, setPlayerState] = useState<SpotifyPlayerState>({
    isReady: false,
    isPlaying: false,
    currentTrack: null,
    position: 0,
    duration: 0,
    deviceId: null,
  });

  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    // Verifica se o SDK já está carregado
    if (window.Spotify) {
      initializePlayer();
    } else {
      window.onSpotifyWebPlaybackSDKReady = initializePlayer;
    }

    function initializePlayer() {
      const player = new window.Spotify.Player({
        name: 'B2B Matchmaking Player',
        getOAuthToken: (cb: (token: string) => void) => {
          cb(accessToken);
        },
        volume: 0.5,
      });

      playerRef.current = player;

      // Event listeners
      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('✅ Spotify Player pronto! Device ID:', device_id);
        setPlayerState(prev => ({ ...prev, isReady: true, deviceId: device_id }));
      });

      player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('❌ Dispositivo desconectado:', device_id);
        setPlayerState(prev => ({ ...prev, isReady: false }));
      });

      player.addListener('player_state_changed', (state: any) => {
        if (!state) return;

        const track = state.track_window.current_track;
        setPlayerState(prev => ({
          ...prev,
          isPlaying: !state.paused,
          currentTrack: track ? {
            id: track.id,
            title: track.name,
            artist: track.artists.map((a: any) => a.name).join(', '),
            uri: track.uri,
            albumArt: track.album.images[0]?.url,
          } : null,
          position: state.position,
          duration: state.duration,
        }));
      });

      player.connect();
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
      }
    };
  }, [accessToken]);

  const playTrack = async (trackUri: string) => {
    if (!playerRef.current || !playerState.deviceId) {
      console.error('Player não está pronto');
      return;
    }

    try {
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${playerState.deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: [trackUri],
        }),
      });
    } catch (error) {
      console.error('Erro ao tocar música:', error);
    }
  };

  const togglePlayPause = async () => {
    if (!playerRef.current) return;

    if (playerState.isPlaying) {
      await playerRef.current.pause();
    } else {
      await playerRef.current.resume();
    }
  };

  const seek = async (positionMs: number) => {
    if (!playerRef.current) return;
    await playerRef.current.seek(positionMs);
  };

  return {
    ...playerState,
    playTrack,
    togglePlayPause,
    seek,
  };
};

