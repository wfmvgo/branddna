# Деплой BrandDNA на Ubuntu VPS

## 1. Установка Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## 2. Клонирование и настройка

```bash
cd /opt
sudo git clone https://github.com/wfmvgo/branddna.git
cd branddna
sudo npm install
```

## 3. Создание .env

```bash
sudo nano .env
```

Содержимое:
```
VITE_OPENROUTER_API_KEY=sk-or-v1-ваш_ключ_openrouter
```

## 4. Сборка

```bash
sudo npm run build
```

## 5. Запуск через PM2 (рекомендуется)

```bash
sudo npm install -g pm2
PORT=3000 pm2 start server.js --name branddna
pm2 save
pm2 startup
```

## 6. Nginx (проксирование на 80/443 порт)

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/branddna
```

Содержимое:
```nginx
server {
    listen 80;
    server_name ваш_домен.ru;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/branddna /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 7. SSL (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d ваш_домен.ru
```

## Обновление

```bash
cd /opt/branddna
git pull
npm install
npm run build
pm2 restart branddna
```
