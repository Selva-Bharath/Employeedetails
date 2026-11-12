# Live Production Deployment Guide

Follow these steps to deploy your **Employee Onboarding & HR Document Collection System** to production (AWS, DigitalOcean, Hetzner, GCP, Azure, or any Linux VPS).

---

## 📋 Recommended Production Stacks

| Deployment Target | Best For | Complexity | Cost |
|---|---|---|---|
| **Linux VPS (Ubuntu 22.04 / 24.04)** | Complete control with Docker & Certbot | Easy & Recommended | \$5 - \$12/mo |
| **Railway / Render** | One-click PaaS deployment | Very Easy | Usage-based |
| **AWS ECS / DigitalOcean App Platform** | Scalable enterprise clusters | Moderate | \$20+/mo |

---

## 🚀 Recommended Method: Docker Compose on Ubuntu VPS (DigitalOcean / AWS EC2 / Hetzner)

### Step 1: Provision a Server
1. Create an **Ubuntu 22.04 LTS or 24.04 LTS** server (Minimum **2 GB RAM**, 1 CPU).
2. Point your custom domain (e.g. `onboarding.yourcompany.com`) to your server IP address via an **A record** in your DNS provider (Cloudflare, GoDaddy, Namecheap).

---

### Step 2: Install Docker & Git on the Server
Connect to your server via SSH:
```bash
ssh root@your_server_ip
```
Update and install Docker:
```bash
apt update && apt upgrade -y
apt install -y git curl ufw

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install -y docker-compose-plugin
```

---

### Step 3: Clone Your Code Repository
```bash
cd /opt
git clone <YOUR_GIT_REPOSITORY_URL> onboarding-app
cd onboarding-app
```

---

### Step 4: Configure Production Environment Variables
Create a production `.env` file:
```bash
nano .env
```
Paste your secure production credentials:
```env
# Database
POSTGRES_DB=onboarding_db
POSTGRES_USER=hr_admin_prod
POSTGRES_PASSWORD=GENERATE_STRONG_DB_PASSWORD_HERE

# Security Secrets (Generate random 64-character tokens)
SECRET_KEY=GENERATE_SUPER_SECRET_KEY_HERE
JWT_SECRET_KEY=GENERATE_STRONG_JWT_KEY_HERE
DATA_ENCRYPTION_KEY=GENERATE_SECURE_ENCRYPTION_KEY_HERE

# Host Domain
DOMAIN_NAME=onboarding.yourcompany.com
```

---

### Step 5: Production `docker-compose.prod.yml`
For production, map the web traffic to standard HTTPS (`443`) and HTTP (`80`):

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: hr_postgres_prod
    restart: always
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - hr_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - hr_prod_net

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: hr_backend_prod
    restart: always
    environment:
      SECRET_KEY: ${SECRET_KEY}
      JWT_SECRET_KEY: ${JWT_SECRET_KEY}
      DATA_ENCRYPTION_KEY: ${DATA_ENCRYPTION_KEY}
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      UPLOAD_FOLDER: /app/uploads
    volumes:
      - ./uploads:/app/uploads
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - hr_prod_net

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: hr_frontend_prod
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - hr_prod_net

networks:
  hr_prod_net:
    driver: bridge

volumes:
  hr_postgres_data:
```

---

### Step 6: Enable Free SSL / HTTPS (Let's Encrypt / Certbot)
To protect confidential employee documents with HTTPS:

#### Option A: Cloudflare (Easiest & Free)
1. In your Cloudflare dashboard, toggle the DNS record to **Proxied (Orange Cloud)**.
2. In Cloudflare SSL/TLS settings, set mode to **Flexible** or **Full**.
3. Your site is instantly live with free automatic SSL at `https://onboarding.yourcompany.com`!

#### Option B: Nginx reverse proxy + Certbot on the host:
```bash
apt install -y nginx certbot python3-certbot-nginx
certbot --nginx -d onboarding.yourcompany.com
```

---

### Step 7: Launch the Production Application
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Verify all services are running:
```bash
docker compose -f docker-compose.prod.yml ps
```

---

### Step 8: Production Checklist & Best Practices
- [ ] **Change Admin Credentials**: Log in to `https://your-domain.com/admin/login` and update the default password (`Admin@123`).
- [ ] **Firewall**: Run `ufw allow 22`, `ufw allow 80`, `ufw allow 443`, and `ufw enable`.
- [ ] **Daily Backups**: Set up a cron job to backup `./uploads` and dump PostgreSQL:
  ```bash
  docker exec hr_postgres_prod pg_dump -U hr_admin_prod onboarding_db > /backup/db_$(date +%F).sql
  ```

