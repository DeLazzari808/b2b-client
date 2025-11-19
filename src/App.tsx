import { useState, useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { YouTubePlayer } from './components/YouTubePlayer';
import { SoundCloudPlayer } from './components/SoundCloudPlayer';
import './index.css';

// --- Interfaces de Dados ---
type UserRole = 'dj' | 'spectator';

interface Track {
  id: string;
  title: string;
  artist: string;
  uri: string;
  albumArt?: string;
  previewUrl?: string | null;
  source?: 'spotify' | 'youtube' | 'soundcloud';
  streamUrl?: string | null;
  startTime?: number; // Timestamp quando a música começou a tocar
  duration?: number | null; // Duração da música em segundos
}

interface User {
  id: string;
  name: string;
  role: UserRole;
}

interface Lobby {
  id: string;
  users: User[];
  queue: Track[];
}

// URL da API - usa variável de ambiente em produção, localhost em desenvolvimento
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const socket: Socket = io(API_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ['polling', 'websocket'], // Tenta polling primeiro (funciona melhor com ngrok)
  upgrade: true,
  forceNew: false,
});

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

function App() {
  const [userName, setUserName] = useState('');
  const [lobbyIdInput, setLobbyIdInput] = useState('');
  const [currentLobby, setCurrentLobby] = useState<Lobby | null>(null);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentPlayingTrack, setCurrentPlayingTrack] = useState<Track | null>(null);
  const [searchSource, setSearchSource] = useState<'youtube' | 'soundcloud' | 'all'>('youtube');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);


  const currentUser = useMemo(() => {
    return currentLobby?.users.find(u => u.id === socket.id);
  }, [currentLobby]);

  useEffect(() => {
    // Logs de conexão
    socket.on('connect', () => {
      console.log('✅ Conectado ao servidor! Socket ID:', socket.id);
      setIsConnected(true);
      setError('');
    });

    socket.on('disconnect', () => {
      console.log('❌ Desconectado do servidor');
      setIsConnected(false);
      setError('Desconectado do servidor. Tentando reconectar...');
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão:', error);
      console.error('   - Tipo:', error.type);
      console.error('   - Mensagem:', error.message);
      console.error('   - API URL:', API_URL);
      
      // Mensagens de erro mais específicas
      if (error.message.includes('server error') || error.message.includes('xhr poll error')) {
        setError('Erro ao conectar ao servidor. O ngrok pode estar bloqueando requisições. Tente acessar a URL do ngrok diretamente no navegador primeiro.');
      } else if (error.message.includes('timeout')) {
        setError('Timeout ao conectar. Verifique se o servidor está rodando e se o ngrok está ativo.');
      } else {
        setError(`Erro ao conectar: ${error.message}. Verifique se o servidor está rodando na porta 3001.`);
      }
    });

    // Eventos do lobby
    socket.on('lobby_criado', (lobby: Lobby) => {
      console.log('✅ Lobby criado:', lobby);
      setCurrentLobby(lobby);
      setError('');
    });

    socket.on('lobby_entrou', (lobby: Lobby) => {
      console.log('✅ Entrou no lobby:', lobby);
      setCurrentLobby(lobby);
      setError('');
    });

    socket.on('usuario_entrou', (user: User) => {
      console.log('👤 Usuário entrou:', user);
      setCurrentLobby(p => p ? { ...p, users: [...p.users.filter(u => u.id !== user.id), user] } : null);
    });

    socket.on('usuario_saiu', (user: User) => {
      console.log('👤 Usuário saiu:', user);
      setCurrentLobby(p => p ? { ...p, users: p.users.filter(u => u.id !== user.id) } : null);
    });

    socket.on('fila_atualizada', (queue: Track[]) => {
      console.log('🎵 Fila atualizada recebida:', queue);
      console.log('   - Tamanho da fila:', queue.length);
      setCurrentLobby(p => {
        if (!p) {
          console.warn('⚠️ Tentando atualizar fila mas currentLobby é null');
          return null;
        }
        console.log('✅ Atualizando fila do lobby:', p.id);
        // Criar um novo objeto para forçar re-render
        const updatedLobby = { ...p, queue: [...queue] };
        console.log('   - Nova fila no lobby:', updatedLobby.queue.length);
        return updatedLobby;
      });
    });

    socket.on('erro_lobby', (msg: string) => {
      console.error('❌ Erro no lobby:', msg);
      setError(msg);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('lobby_criado');
      socket.off('lobby_entrou');
      socket.off('usuario_entrou');
      socket.off('usuario_saiu');
      socket.off('fila_atualizada');
      socket.off('erro_lobby');
    };
  }, []);

  useEffect(() => {
    if (debouncedSearchQuery.trim().length > 2) {
      setIsSearching(true);
      // Busca na fonte selecionada
      fetch(`${API_URL}/search?q=${encodeURIComponent(debouncedSearchQuery)}&source=${searchSource}`)
        .then(res => res.json())
        .then(data => {
          // Verifica se a resposta tem warnings ou é um array direto
          if (data.warnings && data.results) {
            setSearchResults(data.results);
            if (data.warnings.length > 0) {
              setError(`⚠️ ${data.warnings.join('. ')}`);
            }
          } else if (Array.isArray(data)) {
            setSearchResults(data);
            setError('');
          } else {
            setSearchResults([]);
            if (data.message) {
              setError(data.message);
            }
          }
        })
        .catch(err => {
          console.error("Erro ao buscar", err);
          setError('Erro ao buscar músicas. Verifique se o servidor está rodando.');
          setSearchResults([]);
        })
        .finally(() => setIsSearching(false));
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchQuery, searchSource]);

  const handleCreateLobby = () => {
    if (!userName.trim()) {
      setError('Insira um nome.');
      return;
    }
    if (!socket.connected) {
      setError('Não conectado ao servidor. Aguarde a conexão...');
      console.error('Socket não conectado. Estado:', socket.connected);
      return;
    }
    console.log('📤 Criando lobby para:', userName);
    socket.emit('criar_lobby', userName);
  };

  const handleJoinLobby = () => {
    if (!userName.trim() || !lobbyIdInput.trim()) {
      setError('Insira nome e ID do lobby.');
      return;
    }
    if (!socket.connected) {
      setError('Não conectado ao servidor. Aguarde a conexão...');
      console.error('Socket não conectado. Estado:', socket.connected);
      return;
    }
    console.log('📤 Entrando no lobby:', lobbyIdInput, 'como:', userName);
    socket.emit('entrar_lobby', lobbyIdInput, userName);
  };
  const handleLeaveLobby = () => { setCurrentLobby(null); window.location.reload(); }; // Recarrega para uma sessão limpa
  const handleAddTrack = (track: Track) => {
    if (!socket.connected) {
      setError('Não conectado ao servidor.');
      return;
    }
    if (!currentLobby) {
      setError('Você não está em um lobby.');
      return;
    }
    console.log('📤 Adicionando música:', track);
    socket.emit('adicionar_faixa', track);
    setSearchQuery('');
  };

  const handleRemoveTrack = (trackId: string) => {
    if (!socket.connected) {
      setError('Não conectado ao servidor.');
      return;
    }
    console.log('📤 Removendo música:', trackId);
    socket.emit('remover_faixa', trackId);
  };

  // Atualiza a música atual quando a fila muda
  useEffect(() => {
    if (currentLobby && currentLobby.queue.length > 0) {
      const firstTrack = currentLobby.queue[0];
      // Só atualiza se for uma música diferente
      if (!currentPlayingTrack || currentPlayingTrack.id !== firstTrack.id) {
        console.log('🎵 Nova música na fila:', firstTrack.title, 'Source:', firstTrack.source || 'youtube');
        setCurrentPlayingTrack(firstTrack);
      }
    } else if (currentPlayingTrack) {
      // Só limpa se havia uma música tocando
      console.log('🎵 Fila vazia, parando reprodução');
      setCurrentPlayingTrack(null);
    }
  }, [currentLobby?.queue]);

  // Função para notificar o servidor que a música terminou
  // O servidor gerencia o avanço automático para manter sincronização
  const handleTrackEnd = () => {
    if (currentLobby && currentLobby.queue.length > 0) {
      console.log('📤 Notificando servidor que música terminou');
      socket.emit('musica_terminou');
    }
  };

  // Debug: log quando o componente renderiza
  useEffect(() => {
    if (currentLobby) {
      console.log('🔄 Componente renderizado com lobby:', currentLobby.id);
      console.log('   - Fila atual:', currentLobby.queue.length, 'músicas');
      console.log('   - Usuários:', currentLobby.users.length);
    }
  }, [currentLobby]);

  if (currentLobby) {
    return (
      <div className="lobby-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0 }}>Lobby: <code>{currentLobby.id}</code></h1>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(currentLobby.id);
              alert('✅ ID do lobby copiado! Compartilhe com seus amigos.');
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
            title="Copiar ID do lobby"
          >
            📋 Copiar ID
          </button>
        </div>
        {currentUser && <p className="role-indicator">Você é um {currentUser.role === 'dj' ? '🎧 DJ' : '👀 Espectador'}</p>}
        <button onClick={handleLeaveLobby} className="leave-button">Sair</button>
        
        <h2>Participantes</h2>
        <ul className="user-list">{currentLobby.users.map((u) => <li key={u.id}>{u.name} ({u.role})</li>)}</ul>
        
        <hr />
        
        <div className="track-management">
          {currentUser?.role === 'dj' && (
            <div className="search-section">
              <h3>Buscar Músicas</h3>
              <div className="source-selector">
                <label>
                  <input 
                    type="radio" 
                    name="source" 
                    value="youtube" 
                    checked={searchSource === 'youtube'}
                    onChange={() => setSearchSource('youtube')}
                  />
                  <span>YouTube</span>
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="source" 
                    value="soundcloud"
                    checked={searchSource === 'soundcloud'}
                    onChange={() => setSearchSource('soundcloud')}
                  />
                  <span>SoundCloud</span>
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="source" 
                    value="all"
                    checked={searchSource === 'all'}
                    onChange={() => setSearchSource('all')}
                  />
                  <span>Todas</span>
                </label>
              </div>
              <input type="text" placeholder="Digite o nome da música ou artista..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              {isSearching && <p>Buscando...</p>}
              {error && searchQuery.trim().length > 2 && !isSearching && (
                <div className="search-warning">
                  <p>{error}</p>
                  <small>
                    💡 Dica: Configure pelo menos uma API key no arquivo <code>server/.env</code>
                    <br />
                    YouTube: <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">Obter API Key</a>
                    {' | '}
                    SoundCloud: <a href="https://developers.soundcloud.com/" target="_blank" rel="noopener noreferrer">Obter Client ID</a>
                  </small>
                </div>
              )}
              <div className="search-results">
                {searchResults.map((track) => (
                  <div key={track.id} className="search-result-item">
                    <img src={track.albumArt} alt={track.title} width="40" height="40" />
                    <div className="track-info"><span>{track.title}</span><small>{track.artist}</small></div>
                    <button onClick={() => handleAddTrack(track)}>+</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="queue-section" style={{ gridColumn: currentUser?.role === 'spectator' ? '1 / -1' : '' }}>
            <h2>Fila de Músicas ({currentLobby.queue.length})</h2>
            <div className="track-queue">
              {currentLobby.queue && currentLobby.queue.length > 0 ? (
                currentLobby.queue.map((track, i) => {
                  const isPlaying = currentPlayingTrack?.id === track.id;
                  return (
                    <div key={track.id} className={`track-item ${isPlaying ? 'track-item-playing' : ''}`}>
                      <div className="track-number">{i + 1}</div>
                      {track.albumArt && <img src={track.albumArt} alt={track.title} width="50" height="50" />}
                      <div className="track-info">
                        <span className="track-title">{track.title}</span>
                        <small className="track-artist">{track.artist}</small>
                        {isPlaying && <span className="playing-indicator">▶️ Tocando agora</span>}
                      </div>
                      {currentUser?.role === 'dj' && (
                        <button onClick={() => handleRemoveTrack(track.id)} className="remove-button" title="Remover">×</button>
                      )}
                    </div>
                  );
                })
              ) : (
                <p>A fila está vazia. {currentUser?.role === 'dj' ? 'Busque e adicione músicas!' : ''}</p>
              )}
            </div>
          </div>
        </div>
        
        {currentPlayingTrack && (
          <>
            {currentPlayingTrack.source === 'soundcloud' ? (
              <SoundCloudPlayer 
                currentTrack={currentPlayingTrack}
                onTrackEnd={handleTrackEnd}
              />
            ) : (
              <YouTubePlayer 
                currentTrack={currentPlayingTrack}
                onTrackEnd={handleTrackEnd}
              />
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="login-container">
      <h1>B2B Matchmaking</h1>
      <p>Entre ou crie uma sala para começar.</p>
      
      <div className="input-group"><input type="text" placeholder="Seu nome de DJ" value={userName} onChange={(e) => setUserName(e.target.value)} /></div>
      <button onClick={handleCreateLobby}>Criar Novo Lobby</button>
      <hr />
      <div className="input-group">
        <input type="text" placeholder="ID do Lobby" value={lobbyIdInput} onChange={(e) => setLobbyIdInput(e.target.value)} />
        <button onClick={handleJoinLobby}>Entrar em Lobby</button>
      </div>

      {error && <p className="error-message">{error}</p>}
      {!isConnected && (
        <p style={{ color: 'orange', marginTop: '10px' }}>
          ⚠️ Conectando ao servidor... ⏳
        </p>
      )}
      {isConnected && (
        <p style={{ color: 'green', marginTop: '10px' }}>
          ✅ Conectado ao servidor
        </p>
      )}
    </div>
  );
}

export default App;
