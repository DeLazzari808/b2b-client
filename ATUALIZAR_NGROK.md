# 🔄 Como Atualizar URL do Ngrok no Vercel

Sua URL atual do ngrok: **https://7e0dd36641ec.ngrok-free.app**

## ⚠️ Importante
A URL do ngrok muda toda vez que você reinicia o ngrok. Sempre que mudar, siga estes passos:

## Passo a Passo

### 1. Acesse o Vercel
1. Vá para: https://vercel.com
2. Faça login
3. Encontre seu projeto `b2b-client`

### 2. Atualize a Variável de Ambiente
1. Clique no projeto
2. Vá em **Settings** (Configurações)
3. No menu lateral, clique em **Environment Variables**
4. Encontre a variável `VITE_API_URL`
5. Clique nos **3 pontinhos** → **Edit**
6. Atualize o valor para: `https://7e0dd36641ec.ngrok-free.app`
7. Clique em **Save**

### 3. Faça Redeploy
1. Vá na aba **Deployments**
2. Clique nos **3 pontinhos** do último deploy
3. Selecione **Redeploy**
4. Aguarde o deploy terminar

## ✅ Pronto!

Agora seu frontend vai usar a nova URL do ngrok.

## 💡 Dica

Se você quiser uma URL fixa do ngrok (que não muda), pode:
- Criar conta gratuita no ngrok
- Configurar um domínio fixo (gratuito)
- Ou usar outra solução como Cloudflare Tunnel

Mas para testar agora, atualizar manualmente funciona perfeitamente!

