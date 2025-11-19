# ✅ Teste do Deploy

## Passo 1: Redeploy no Vercel

1. No Vercel, vá em **Deployments**
2. Encontre o último deploy (o mais recente)
3. Clique nos **3 pontinhos** (⋮) ao lado do deploy
4. Selecione **"Redeploy"**
5. Aguarde o deploy terminar (alguns segundos)

## Passo 2: Testar a URL

Depois do redeploy, você terá uma URL tipo:
- `https://b2b-client-git-main-joao-pedro-de-lazzaris-projects.vercel.app`

**Teste:**
1. Abra essa URL no navegador
2. Tente criar um lobby
3. Tente adicionar uma música
4. Verifique se conecta ao servidor (ngrok)

## Passo 3: Verificar se está funcionando

Se funcionar:
- ✅ Frontend carrega
- ✅ Consegue criar/entrar em lobby
- ✅ Consegue buscar músicas
- ✅ Consegue adicionar à fila

Se não funcionar:
- ❌ Verifique se o servidor está rodando localmente
- ❌ Verifique se o ngrok está ativo
- ❌ Teste a URL do ngrok: `https://7e0dd36641ec.ngrok-free.app/health`

## 🎯 Pronto!

Depois do redeploy, você terá:
- **Frontend**: URL do Vercel (ex: `b2b-client.vercel.app`)
- **Backend**: URL do ngrok (ex: `7e0dd36641ec.ngrok-free.app`)

Compartilhe a URL do Vercel com seus amigos para testarem juntos!

