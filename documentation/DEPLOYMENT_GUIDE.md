# 🏛️ KSDC Deployment Guide (Step-by-Step)

Follow these steps one by one to deploy the **DomainScope** application on the Kerala State Data Centre (KSDC) server.

---

## ✅ Prerequisites (Before You Start)

Ensure you have the following from the KSDC team:
1.  **Server Access**: IP Address, Username, and Password (or SSH Key).
2.  **Database Details**: PostgreSQL Host, Port, Database Name, User, Password.
3.  **Redis Details**: Redis Host, Port.
4.  **SMTP Details**: Host, Port, User, Password (for sending emails).

---

## 🚀 Phase 1: Getting the Code on the Server

### Step 1: Login to the Server
Open your terminal (Command Prompt or PowerShell) and run:
```bash
ssh username@your-server-ip
# Enter password when prompted
```

### Step 2: Download the Project
We will download the code from GitHub to the `/var/www/domainscope` folder.

```bash
# 1. Go to the web folder
cd /var/www

# 2. Clone the repository (Download code)
sudo git clone https://github.com/vaishnav4281/Domainscope.git domainscope

# 3. Enter the project folder
cd domainscope
```

---

## ⚙️ Phase 2: Configuration

### Step 3: Configure the Backend
We need to tell the application how to connect to the database and email server.

```bash
# 1. Go to backend folder
cd backend

# 2. Create the configuration file
cp .env.example .env

# 3. Edit the file
nano .env
```

**Inside the editor (`nano`), change these lines:**

*   **Database**: Change `DATABASE_URL` to the one KSDC gave you.
    *   Example: `postgresql://admin:pass123@10.0.0.5:5432/domainscope`
*   **Redis**: Change `REDIS_URL`.
    *   Example: `redis://10.0.0.6:6379`
    *   `SMTP_HOST=relay.nic.in`
    *   `SMTP_USER=noreply@gov.in`
    *   `SMTP_PASS=your_password`
*   **API Keys**: Add your keys for external services:
    *   `PROXYCHECK_API_KEY=your_key`
    *   `IPINFO_TOKEN=your_token`
    *   `VT_API_KEY=your_key`
*   **Rate Limiting (CRITICAL)**: Add these lines to enforce security:
    *   `RATE_LIMIT_WINDOW_MS=900000` (15 minutes)
    *   `RATE_LIMIT_MAX=500` (Strict limit for production)
    *   `AUTH_RATE_LIMIT_WINDOW_MS=3600000` (1 hour)
    *   `AUTH_RATE_LIMIT_MAX=10` (Strict limit for login attempts)

**Save and Exit:**
*   Press `Ctrl + O`, then `Enter` (to save).
*   Press `Ctrl + X` (to exit).

---

## 🛠️ Phase 3: Installation & Setup

### Step 4: Run the Automated Setup Script
We have prepared a "magic script" that installs everything for you.

```bash
# 1. Go back to the main folder
cd ..

# 2. Make the scripts executable (clickable)
chmod +x deployment/*.sh

# 3. Run the setup script
./deployment/setup.sh
```

**What this does:**
*   Installs Node.js dependencies.
*   Builds the Frontend (React).
*   Builds the Backend (Node.js).
*   Sets up the Database tables.

*Wait for it to finish. It might take 2-3 minutes.*

---

## 🚀 Phase 4: Starting the Application

### Step 5: Start the Services
We use a tool called **PM2** to keep the app running forever.

```bash
# Start the application using our config
pm2 start ecosystem.config.cjs

# Save the list so it starts on reboot
pm2 save
pm2 startup
```

### Step 6: Configure the Web Server (NGINX)
This makes the site accessible via the domain name (e.g., `domainscope.kerala.gov.in`).

```bash
# 1. Copy our configuration to NGINX
sudo cp deployment/nginx.conf /etc/nginx/sites-available/domainscope

# 2. Enable the site
sudo ln -s /etc/nginx/sites-available/domainscope /etc/nginx/sites-enabled/

# 3. Test configuration
sudo nginx -t
# You should see "syntax is ok"

# 4. Restart NGINX
sudo systemctl restart nginx
```

---

## 🛡️ Phase 5: Security (Final Touch)

### Step 7: Enable Firewall
Block hackers by only allowing necessary ports.

```bash
./deployment/setup_firewall.sh
```

### Step 8: Enable Backups
Schedule automatic database backups.

```bash
# Open the scheduler
crontab -e

# Add this line at the bottom (runs backup every day at 2 AM)
0 2 * * * /var/www/domainscope/deployment/backup_db.sh
```

---

## ✅ Verification

1.  Open your browser.
2.  Go to `https://domainscope.kerala.gov.in` (or your IP).
3.  Try to **Sign Up**.
4.  If you get an email OTP, **Everything is working!** 🎉

---

## 🔄 How to Update (When you change code)

If you pushed new code to GitHub and want to update the server:

```bash
cd /var/www/domainscope
./deployment/deploy.sh
```
*That's it! It will download updates and restart automatically.*
