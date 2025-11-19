# 🚀 Deploy do Frontend no Vercel (Gratuito)

## Passo 1: Criar Repositório no GitHub

1. Acesse: https://github.com/new
2. Nome: `b2b-client` (ou `b2b-matchmaking-client`)
3. **NÃO** marque "Initialize with README"
4. Clique em "Create repository"

## Passo 2: Conectar e Fazer Push

No terminal, dentro da pasta `client`:

```bash
git remote add origin https://github.com/SEU_USUARIO/b2b-client.git
git branch -M main
git push -u origin main
```

## Passo 3: Deploy no Vercel

### Opção A: Via Site (Mais Fácil)

1. Acesse: https://vercel.com
2. Login com GitHub
3. "Add New" → "Project"
4. Importe o repositório `b2b-client`
5. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build` (já vem preenchido)
   - **Output Directory**: `dist` (já vem preenchido)
   - **Install Command**: `npm install` (já vem preenchido)
6. **Environment Variables**:
   - Nome: `VITE_API_URL`
   - Valor: `https://527339fd873a.ngrok-free.app` (sua URL do ngrok)
7. Clique em "Deploy"

### Opção B: Via CLI

```bash
npm install -g vercel
cd client
vercel
```

Quando perguntar sobre variáveis de ambiente:
- `VITE_API_URL`: `https://527339fd873a.ngrok-free.app`

## ⚠️ Importante sobre Ngrok

A URL do ngrok muda toda vez que você reinicia. Quando mudar:

1. Vá no Vercel
2. Settings → Environment Variables
3. Atualize `VITE_API_URL` com a nova URL do ngrok
4. Faça "Redeploy"

## 🎯 URL Final

Depois do deploy, o Vercel gera uma URL tipo:
`https://b2b-client.vercel.app`

Essa é a URL que você compartilha com seus amigos!

## 📝 Checklist

- [ ] Repositório criado no GitHub
- [ ] Código enviado para GitHub
- [ ] Deploy feito no Vercel
- [ ] Variável `VITE_API_URL` configurada
- [ ] Testado acessando a URL do Vercel

