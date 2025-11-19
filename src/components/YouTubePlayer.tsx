import { useEffect, useRef, useState } from 'react';
import './YouTubePlayer.css';

interface Track {
  id: string;
  title: string;
  artist: string;
  uri: string;
  albumArt?: string;
  source?: string;
  startTime?: number; // Timestamp quando a música começou a tocar
  duration?: number | null; // Duração da música em segundos
}

interface YouTubePlayerProps {
  currentTrack: Track | null;
  onTrackEnd: () => void;
}

export const YouTubePlayer = ({ currentTrack, onTrackEnd }: YouTubePlayerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const currentVideoIdRef = useRef<string>('');
  const [startSeconds, setStartSeconds] = useState(0);
  const messageListenerRef = useRef<((event: MessageEvent) => void) | null>(null);

  // Listener para mensagens do YouTube iframe (detecta fim de vídeo)
  useEffect(() => {
    if (!currentTrack) return;

    const handleMessage = (event: MessageEvent) => {
      // Verifica se a mensagem é do YouTube
      if (event.origin !== 'https://www.youtube.com') return;
      
      try {
        // YouTube pode enviar dados como string ou objeto
        let data;
        if (typeof event.data === 'string') {
          data = JSON.parse(event.data);
        } else {
          data = event.data;
        }
        
        // Verifica diferentes formatos de mensagem do YouTube
        if (data && (data.event === 'onStateChange' || data.event === 'video-progress')) {
          // Estado 0 = ENDED (vídeo terminou)
          const state = data.info || data.data;
          if (state === 0 || (typeof state === 'object' && state.playerState === 0)) {
            console.log('⏹️ Vídeo terminou detectado via postMessage');
            onTrackEnd();
          }
        }
      } catch (e) {
        // Ignora erros de parsing - nem todas as mensagens são JSON
      }
    };

    window.addEventListener('message', handleMessage);
    messageListenerRef.current = handleMessage;

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [currentTrack, onTrackEnd]);

  // Monitora o tempo baseado na duração real do vídeo
  useEffect(() => {
    if (!currentTrack || !currentTrack.startTime) return;

    // Usa a duração real se disponível, senão usa estimativa de 4 minutos
    const durationSeconds = currentTrack.duration || 240; // 4 minutos padrão
    const durationMs = durationSeconds * 1000;
    
    const elapsed = Date.now() - currentTrack.startTime;
    const remaining = Math.max(0, durationMs - elapsed);

    console.log(`⏱️ Música tem ${durationSeconds}s de duração, faltam ${Math.floor(remaining/1000)}s`);

    const timer = setTimeout(() => {
      console.log('⏹️ Música terminou (timer baseado na duração)');
      onTrackEnd();
    }, remaining);

    return () => clearTimeout(timer);
  }, [currentTrack, onTrackEnd]);

  useEffect(() => {
    if (!currentTrack) {
      currentVideoIdRef.current = '';
      return;
    }

    // Se o vídeo mudou, atualiza o iframe
    if (currentVideoIdRef.current !== currentTrack.id) {
      console.log('🎵 Carregando vídeo do YouTube:', currentTrack.id, currentTrack.title);
      
      // Calcula o offset baseado no startTime para sincronização
      let calculatedStart = 0;
      if (currentTrack.startTime) {
        const elapsedMs = Date.now() - currentTrack.startTime;
        calculatedStart = Math.floor(elapsedMs / 1000); // Converte para segundos
        console.log(`⏰ Sincronização: Música começou há ${calculatedStart}s, iniciando no offset`);
      }
      
      setStartSeconds(calculatedStart);
      currentVideoIdRef.current = currentTrack.id;
      setIsLoading(true);
      
      // Aguarda um pouco antes de considerar carregado
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [currentTrack]);

  if (!currentTrack) {
    return (
      <div className="youtube-player-container">
        <div className="player-empty">
          <p>🎵 Nenhuma música tocando. Adicione músicas à fila!</p>
        </div>
      </div>
    );
  }

  // URL do YouTube com autoplay, sem controles (lobby é uma caixa de som compartilhada)
  // enablejsapi=1 permite receber eventos via postMessage
  const youtubeUrl = `https://www.youtube.com/embed/${currentTrack.id}?autoplay=1&controls=0&modestbranding=1&rel=0&start=${startSeconds}&enablejsapi=1&origin=${window.location.origin}`;

  return (
    <div className="youtube-player-container">
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
          {isLoading && (
            <div className="player-loading">
              <span>⏳ Carregando...</span>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={youtubeUrl}
            title={currentTrack.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              width: '100%',
              height: '80px',
              border: 'none',
            }}
            onLoad={() => {
              setIsLoading(false);
              console.log('✅ Vídeo carregado:', currentTrack.title);
            }}
          />
        </div>
      </div>
    </div>
  );
};
