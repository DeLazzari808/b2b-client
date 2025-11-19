import { useEffect, useState } from 'react';
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';
import './SpotifyPlayer.css';

interface Track {
  id: string;
  title: string;
  artist: string;
  uri: string;
  albumArt?: string;
}

interface SpotifyPlayerProps {
  accessToken: string | null;
  currentTrack: Track | null;
  onTrackEnd: () => void;
}

export const SpotifyPlayer = ({ accessToken, currentTrack, onTrackEnd }: SpotifyPlayerProps) => {
  const { isReady, isPlaying, position, duration, playTrack, togglePlayPause, seek } = useSpotifyPlayer(accessToken);
  const [localPosition, setLocalPosition] = useState(0);

  useEffect(() => {
    setLocalPosition(position);
  }, [position]);

  useEffect(() => {
    if (currentTrack && isReady) {
      playTrack(currentTrack.uri);
    }
  }, [currentTrack, isReady]);

  useEffect(() => {
    if (position >= duration - 1000 && duration > 0 && isPlaying) {
      onTrackEnd();
    }
  }, [position, duration, isPlaying, onTrackEnd]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPosition = parseInt(e.target.value);
    setLocalPosition(newPosition);
    seek(newPosition);
  };

  if (!accessToken) {
    return (
      <div className="spotify-player-container">
        <div className="player-auth-prompt">
          <p>🔐 Conecte-se ao Spotify para tocar músicas completas</p>
          <a href="http://localhost:3001/auth/login" className="spotify-login-button">
            Conectar ao Spotify
          </a>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="spotify-player-container">
        <div className="player-loading">
          <p>⏳ Conectando ao Spotify Player...</p>
        </div>
      </div>
    );
  }

  if (!currentTrack) {
    return (
      <div className="spotify-player-container">
        <div className="player-empty">
          <p>🎵 Nenhuma música tocando. Adicione músicas à fila!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="spotify-player-container">
      <div className="player-content">
        <div className="player-track-info">
          {currentTrack.albumArt && (
            <img src={currentTrack.albumArt} alt={currentTrack.title} className="player-album-art" />
          )}
          <div className="player-track-details">
            <div className="player-track-title">{currentTrack.title}</div>
            <div className="player-track-artist">{currentTrack.artist}</div>
          </div>
        </div>

        <div className="player-controls">
          <button onClick={togglePlayPause} className="player-play-button">
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          
          <div className="player-progress">
            <span className="player-time">{formatTime(localPosition)}</span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={localPosition}
              onChange={handleSeek}
              className="player-seek-bar"
            />
            <span className="player-time">{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

