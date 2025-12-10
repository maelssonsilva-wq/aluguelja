# 🚀 Guia de Deploy para Produção

## Preparação Geral

### 1. Checklist de Segurança

- [ ] Altere todas as chaves secretas (JWT_SECRET, SECRET_KEY)
- [ ] Use senhas fortes para banco de dados
- [ ] Configure HTTPS/SSL
- [ ] Configure CORS restritivo
- [ ] Ative rate limiting
- [ ] Configure logs de auditoria
- [ ] Use variáveis de ambiente seguras
- [ ] Remova console.log em produção
- [ ] Configure backup automático do banco

### 2. Variáveis de Ambiente

Nunca commite o arquivo `.env` no Git! Use serviços de secrets management:
- AWS Secrets Manager
- Google Cloud Secret Manager
- Azure Key Vault
- HashiCorp Vault

---

## Deploy Backend Node.js

### Opção 1: Heroku

```bash
# 1. Instale Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# 2. Login
heroku login

# 3. Crie app
cd nodejs-backend
heroku create seu-app-nome

# 4. Configure MongoDB (addon)
heroku addons:create mongolab:sandbox

# 5. Configure variáveis de ambiente
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set FRONTEND_URL=https://seu-frontend.com
heroku config:set GOOGLE_CLIENT_ID=seu_client_id
heroku config:set GOOGLE_CLIENT_SECRET=seu_secret
heroku config:set EMAIL_USER=seu_email@gmail.com
heroku config:set EMAIL_PASSWORD=sua_senha_app

# 6. Deploy
git init
git add .
git commit -m "Deploy inicial"
git push heroku main

# 7. Abra app
heroku open
```

### Opção 2: DigitalOcean App Platform

1. Conecte seu repositório GitHub
2. Selecione `nodejs-backend` como diretório
3. Configure variáveis de ambiente no painel
4. Deploy automático

### Opção 3: VPS (Ubuntu)

```bash
# 1. Conecte ao servidor
ssh root@seu-servidor.com

# 2. Instale Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Instale MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# 4. Clone repositório
git clone https://github.com/seu-usuario/seu-repo.git
cd seu-repo/nodejs-backend

# 5. Instale dependências
npm install --production

# 6. Configure .env
nano .env
# Cole suas variáveis de produção

# 7. Instale PM2 (gerenciador de processos)
sudo npm install -g pm2

# 8. Inicie aplicação
pm2 start server.js --name auth-api
pm2 startup
pm2 save

# 9. Configure Nginx como proxy reverso
sudo apt-get install nginx
sudo nano /etc/nginx/sites-available/api

# Cole:
server {
    listen 80;
    server_name api.seudominio.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

sudo ln -s /etc/nginx/sites-available/api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 10. Configure SSL com Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d api.seudominio.com
```

---

## Deploy Backend Python

### Opção 1: Railway.app

```bash
# 1. Instale Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Inicialize projeto
cd python-backend
railway init

# 4. Configure PostgreSQL
railway add postgresql

# 5. Configure variáveis
railway variables set SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
railway variables set FRONTEND_URL=https://seu-frontend.com
railway variables set GOOGLE_CLIENT_ID=seu_client_id
railway variables set GOOGLE_CLIENT_SECRET=seu_secret

# 6. Deploy
railway up
```

### Opção 2: Render.com

1. Conecte repositório GitHub
2. Selecione "Web Service"
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Configure variáveis de ambiente
6. Deploy automático

### Opção 3: VPS (Ubuntu)

```bash
# 1. Conecte ao servidor
ssh root@seu-servidor.com

# 2. Instale Python e dependências
sudo apt-get update
sudo apt-get install -y python3 python3-pip python3-venv

# 3. Instale PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 4. Configure banco
sudo -u postgres psql
CREATE DATABASE auth_system;
CREATE USER seu_usuario WITH PASSWORD 'senha_forte';
GRANT ALL PRIVILEGES ON DATABASE auth_system TO seu_usuario;
\q

# 5. Clone repositório
git clone https://github.com/seu-usuario/seu-repo.git
cd seu-repo/python-backend

# 6. Crie ambiente virtual
python3 -m venv venv
source venv/bin/activate

# 7. Instale dependências
pip install -r requirements.txt

# 8. Configure .env
nano .env
# Cole suas variáveis de produção

# 9. Instale Gunicorn
pip install gunicorn

# 10. Crie serviço systemd
sudo nano /etc/systemd/system/auth-api.service

# Cole:
[Unit]
Description=FastAPI Auth API
After=network.target

[Service]
User=seu_usuario
WorkingDirectory=/caminho/para/python-backend
Environment="PATH=/caminho/para/python-backend/venv/bin"
ExecStart=/caminho/para/python-backend/venv/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000

[Install]
WantedBy=multi-user.target

sudo systemctl start auth-api
sudo systemctl enable auth-api

# 11. Configure Nginx (igual ao Node.js, mas porta 8000)
```

---

## Deploy Frontend

### Opção 1: Vercel

```bash
# 1. Instale Vercel CLI
npm i -g vercel

# 2. Deploy
cd frontend
vercel

# 3. Configure variáveis
# Edite auth.js com a URL da API de produção
# Ou use variáveis de ambiente do Vercel
```

### Opção 2: Netlify

```bash
# 1. Instale Netlify CLI
npm install -g netlify-cli

# 2. Deploy
cd frontend
netlify deploy --prod

# 3. Configure redirects
echo '/* /index.html 200' > _redirects
```

### Opção 3: GitHub Pages

```bash
cd frontend
# Edite auth.js com URL da API
git add .
git commit -m "Deploy frontend"
git push origin main

# Configure GitHub Pages nas configurações do repositório
```

### Opção 4: VPS com Nginx

```bash
# 1. Copie arquivos para servidor
scp -r frontend/* root@servidor:/var/www/html/

# 2. Configure Nginx
sudo nano /etc/nginx/sites-available/frontend

# Cole:
server {
    listen 80;
    server_name seudominio.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

sudo ln -s /etc/nginx/sites-available/frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 3. Configure SSL
sudo certbot --nginx -d seudominio.com
```

---

## Configuração HTTPS/SSL

### Let's Encrypt (Gratuito)

```bash
# Instale Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtenha certificado
sudo certbot --nginx -d api.seudominio.com -d seudominio.com

# Renovação automática (já configurada)
sudo certbot renew --dry-run
```

### Cloudflare (Recomendado)

1. Adicione seu domínio ao Cloudflare
2. Configure DNS para apontar para seu servidor
3. Ative SSL/TLS Full (strict)
4. Ative "Always Use HTTPS"
5. Configure regras de firewall

---

## Monitoramento e Logs

### PM2 (Node.js)

```bash
# Ver logs
pm2 logs auth-api

# Monitorar
pm2 monit

# Restart
pm2 restart auth-api

# Status
pm2 status
```

### Systemd (Python)

```bash
# Ver logs
sudo journalctl -u auth-api -f

# Restart
sudo systemctl restart auth-api

# Status
sudo systemctl status auth-api
```

### Ferramentas Externas

- **Sentry**: Rastreamento de erros
- **LogRocket**: Session replay
- **New Relic**: APM
- **Datadog**: Monitoramento completo
- **UptimeRobot**: Monitoramento de uptime

---

## Backup do Banco de Dados

### MongoDB

```bash
# Backup manual
mongodump --uri="mongodb://localhost:27017/auth-system" --out=/backup/$(date +%Y%m%d)

# Backup automático (cron)
crontab -e
# Adicione:
0 2 * * * mongodump --uri="mongodb://localhost:27017/auth-system" --out=/backup/$(date +\%Y\%m\%d)
```

### PostgreSQL

```bash
# Backup manual
pg_dump auth_system > backup_$(date +%Y%m%d).sql

# Backup automático (cron)
crontab -e
# Adicione:
0 2 * * * pg_dump auth_system > /backup/backup_$(date +\%Y\%m\%d).sql
```

---

## Performance e Otimização

### Node.js

1. **Use cluster mode**
```javascript
// server.js
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
    const cpus = os.cpus().length;
    for (let i = 0; i < cpus; i++) {
        cluster.fork();
    }
} else {
    // Seu código do servidor
}
```

2. **Configure cache**
```bash
npm install redis
```

3. **Comprima respostas**
```javascript
const compression = require('compression');
app.use(compression());
```

### Python

1. **Use workers**
```bash
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
```

2. **Configure cache**
```bash
pip install redis
```

3. **Otimize queries**
```python
# Use eager loading
user = db.query(User).options(joinedload(User.posts)).first()
```

---

## Checklist Final

- [ ] Backend rodando em HTTPS
- [ ] Frontend rodando em HTTPS
- [ ] CORS configurado corretamente
- [ ] Variáveis de ambiente seguras
- [ ] Banco de dados com backup
- [ ] Monitoramento configurado
- [ ] Logs centralizados
- [ ] Rate limiting ativo
- [ ] SSL/TLS válido
- [ ] Google OAuth funcionando
- [ ] Email funcionando
- [ ] Testes de carga realizados
- [ ] Documentação atualizada

---

## Custos Estimados (Mensal)

### Opção Econômica (< $20/mês)
- **Backend**: Railway/Render (Free tier)
- **Frontend**: Vercel/Netlify (Free tier)
- **Banco**: MongoDB Atlas/Neon (Free tier)
- **Total**: $0 - $10/mês

### Opção Intermediária ($50-100/mês)
- **VPS**: DigitalOcean Droplet ($12/mês)
- **Banco**: Managed Database ($15/mês)
- **CDN**: Cloudflare (Free)
- **Monitoring**: Sentry (Free tier)
- **Total**: $30 - $50/mês

### Opção Profissional ($200+/mês)
- **Backend**: AWS ECS/Fargate
- **Banco**: AWS RDS/Aurora
- **CDN**: CloudFront
- **Monitoring**: New Relic/Datadog
- **Total**: $200 - $500/mês

---

**Boa sorte com o deploy! 🚀**
