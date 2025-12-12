# 💻 Local Setup Guide 

This guide will help you run **DomainScope** on your own computer (Laptop/PC) for testing and development.

---

## ✅ Prerequisites (Install these first)

1.  **Node.js**: Download and install "LTS Version" from [nodejs.org](https://nodejs.org/).
2.  **Git**: Download from [git-scm.com](https://git-scm.com/).
3.  **VS Code**: A good code editor from [code.visualstudio.com](https://code.visualstudio.com/).
4.  **PostgreSQL & Redis**:
    *   **Easiest Way**: Install [Docker Desktop](https://www.docker.com/).
    *   **Hard Way**: Install PostgreSQL and Redis separately on your OS.

---

## 📥 Step 1: Get the Code

1.  Open your terminal (Command Prompt / Terminal).
2.  Run this command to download the project:
    ```bash
    git clone https://github.com/vaishnav4281/Domainscope.git
    ```
3.  Go into the folder:
    ```bash
    cd Domainscope
    ```

---

## ⚙️ Step 2: Setup the Backend

The "Backend" is the brain of the application.

1.  **Start the Database**:
    *   We use Docker to run the database easily.
    *   Run this command in the **root folder** (where `docker-compose.yml` is):
        ```bash
        docker compose up -d
        ```
    *   *Note: If you get a permission error, try `sudo docker compose up -d`.*

2.  **Go to backend folder**:
    ```bash
    cd backend
    ```

2.  **Install libraries**:
    ```bash
    npm install
    ```

3.  **Configure Environment**:
    *   Copy the example file:
        ```bash
        cp .env.example .env
        # On Windows Command Prompt: copy .env.example .env
        ```
    *   Open `.env` in VS Code.
    *   **Important**: If you are using the Docker setup above, the default `DATABASE_URL` and `REDIS_URL` in the file are already correct!
    *   If you are NOT using Docker, you will need to update them to match your local Postgres installation.
    example = DATABASE_URL="postgresql://postgres:postgres@localhost:5432/domainscope?schema=public"
    example = REDIS_URL="redis://localhost:6379"
    *   **Email**: For local testing, we use a fake email service called "Ethereal". You don't need to change the SMTP settings for now, or you can use your own Gmail (search "Gmail App Password").
    *   **API Keys**: You will need API keys for **VirusTotal**, **IPInfo**, and **ProxyCheck.io** to get full scan results. Add them to the `.env` file.
    *   **Rate Limits**: The `.env` file now includes `RATE_LIMIT_MAX` and `AUTH_RATE_LIMIT_MAX`. They are set to high values (10000) by default so you don't get blocked while testing.

4.  **Setup Database**:
    ```bash
    # This creates the tables in your database
    # MAKE SURE you are in the 'backend' folder!
    npx prisma generate
    npx prisma db push
    ```

5.  **Start Backend**:
    ```bash
    npm run dev
    ```
    *You should see: "Server running on port 3001"*

---

## 🎨 Step 3: Setup the Frontend

The "Frontend" is what you see in the browser.

1.  **Open a NEW terminal window** (Keep the backend running!).
2.  **Go to the project folder**:
    ```bash
    cd Domain-scope
    ```
3.  **Install libraries**:
    ```bash
    npm install
    ```
4.  **Start Frontend**:
    ```bash
    npm run dev
    ```
    *You should see: "Local: http://localhost:5173"*

---

## 🎉 Step 4: Use the App

1.  Open your browser (Chrome/Firefox).
2.  Go to `http://localhost:5173`.
3.  **Sign Up**: Create a new account.
    *   Since we are in "Development Mode", check your **Backend Terminal**. The "Email OTP" will be printed there in the logs! You don't need to check your real email.
4.  **Login** and start scanning domains!

---

## ❓ Common Problems

**"Command not found: npm"**
> You didn't install Node.js. Go install it and restart your terminal.

**"Connection refused (PostgreSQL/Redis)"**(For Beginners)
> Your database is not running. Open Docker Desktop and make sure it's running, or start your local Postgres service.

**"Prisma Client not initialized"**
> You forgot to run `npx prisma generate` in the backend folder.

**"Error: EMFILE: too many open files"**
> This is a common issue on Linux. It means your system has a low limit on how many files can be "watched" for changes.
> Run these commands to fix it:
> ```bash
> sudo sysctl fs.inotify.max_user_instances=1024
> sudo sysctl fs.inotify.max_user_watches=524288
> ```