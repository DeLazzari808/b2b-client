import { useEffect, useRef, useState } from 'react';
import './SoundCloudPlayer.css';

interface Track {
  id: string;
  title: string;
  artist: string;
  uri: string;
  albumArt?: string;
  source?: string;
  streamUrl?: string | null;
  startTime?: number; // Timestamp quando a música começou a tocar
}

interface SoundCloudPlayerProps {
  currentTrack: Track | null;
  onTrackEnd: () => void;
}

declare global {
  interface Window {
    SC: any;
  }
}

export const SoundCloudPlayer = ({ currentTrack, onTrackEnd }: SoundCloudPlayerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Carrega o SoundCloud Widget API
    if (!window.SC) {
      const script = document.createElement('script');
      script.src = 'https://w.soundcloud.com/player/api.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        setIsReady(true);
        console.log('✅ SoundCloud Widget API carregada');
      };
    } else {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (currentTrack && isReady && window.SC && iframeRef.current) {
      const widget = window.SC.Widget(iframeRef.current);
      
      // Configura o player
      widget.bind(window.SC.Widget.Events.READY, () => {
        console.log('✅ SoundCloud Player pronto');
        
        // Calcula o offset para sincronização
        let startPosition = 0;
        if (currentTrack.startTime) {
          const elapsedMs = Date.now() - currentTrack.startTime;
          startPosition = elapsedMs; // SoundCloud usa milissegundos
          console.log(`⏰ Sincronização: Música começou há ${Math.floor(elapsedMs/1000)}s, iniciando no offset`);
        }
        
        // Carrega a música
        const urlToLoad = currentTrack.streamUrl || currentTrack.uri;
        widget.load(urlToLoad, {
          auto_play: true,
          show_artwork: true,
        });
        
        // Após carregar, pula para a posição correta
        if (startPosition > 0) {
          widget.bind(window.SC.Widget.Events.PLAY, () => {
            widget.seekTo(startPosition);
            widget.unbind(window.SC.Widget.Events.PLAY); // Remove o listener após usar
          });
        }
      });

      widget.bind(window.SC.Widget.Events.FINISH, () => {
        console.log('🎵 Música terminou');
        onTrackEnd();
      });

      widget.bind(window.SC.Widget.Events.ERROR, (error: any) => {
        console.error('❌ Erro no SoundCloud Player:', error);
      });
    }
  }, [currentTrack, isReady, onTrackEnd]);

  if (!currentTrack) {
    return (
      <div className="soundcloud-player-container">
        <div className="player-empty">
          <p>🎵 Nenhuma música tocando. Adicione músicas à fila!</p>
        </div>
      </div>
    );
  }

  // URL do widget do SoundCloud
  const widgetUrl = currentTrack.streamUrl 
    ? `https://w.soundcloud.com/player/?url=${encodeURIComponent(currentTrack.streamUrl)}&auto_play=true&hide_related=false&show_comments=true&show_user=true&show_reposts=false&visual=true`
    : `https://w.soundcloud.com/player/?url=${encodeURIComponent(currentTrack.uri)}&auto_play=true&hide_related=false&show_comments=true&show_user=true&show_reposts=false&visual=true`;

  return (
    <div className="soundcloud-player-container">
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
        <div className="player-iframe-container">
          <iframe
            ref={iframeRef}
            width="100%"
            height="80"
            scrolling="no"
            frameBorder="no"
            allow="autoplay"
            src={widgetUrl}
            title={`SoundCloud Player - ${currentTrack.title}`}
          ></iframe>
        </div>
      </div>
    </div>
  );
};

