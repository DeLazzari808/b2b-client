# B2B Matchmaking - Client 🎧

Frontend do sistema B2B Matchmaking - Interface React para lobbies colaborativos de DJs.

## 🚀 Tecnologias

- **React** + **TypeScript**
- **Vite** - Build tool
- **Socket.IO Client** - Comunicação em tempo real
- **YouTube IFrame Player** - Reprodução de músicas
- **SoundCloud Widget** - Reprodução de músicas

## 📋 Configuração

1. Instale as dependências:
```bash
npm install
```

2. Configure a URL da API (opcional):
Crie um arquivo `.env`:
```env
VITE_API_URL=https://sua-url-backend.com
```

Se não configurar, usa `http://localhost:3001` por padrão.

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Build para produção:
```bash
npm run build
```

## 🔧 Funcionalidades

- ✅ Interface para criar e entrar em lobbies
- ✅ Busca de músicas no YouTube e SoundCloud
- ✅ Fila colaborativa em tempo real
- ✅ Player sincronizado (todos ouvem no mesmo timing)
- ✅ Avanço automático de músicas
- ✅ Sistema de roles (DJ/Espectador)

## 🌐 Deploy

### Vercel (Recomendado - Gratuito)

1. Instale Vercel CLI: `npm i -g vercel`
2. No diretório `client`, execute: `vercel`
3. Configure a variável de ambiente:
   - `VITE_API_URL=https://sua-url-backend.com`
4. Deploy automático a cada push no GitHub

### Netlify

1. Conecte seu repositório GitHub
2. Configure:
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`
   - Environment variables: `VITE_API_URL`

## 📝 Notas

- O frontend se conecta ao backend via Socket.IO
- A URL da API pode ser configurada via variável de ambiente `VITE_API_URL`
- Em desenvolvimento, usa `http://localhost:3001` por padrão

