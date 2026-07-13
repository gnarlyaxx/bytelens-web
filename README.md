# 📸 Bytelens

![Bytelens Banner](https://img.shields.io/badge/Bytelens-Premium_Photography_Marketplace-5865F2?style=for-the-badge)
![Discord](https://img.shields.io/badge/Discord-Integrated-7289DA?style=flat-square&logo=discord&logoColor=white)
![Midtrans](https://img.shields.io/badge/Midtrans-Payment_Gateway-004481?style=flat-square)
![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=flat-square&logo=node.js)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat-square&logo=supabase)

**Bytelens** is a premium photography and videography marketplace platform created for an **Entrepreneurship EXPO**. It bridges the gap between creators and clients by integrating a seamless web interface, robust payment gateway, and an automated Discord bot ecosystem.

---

## ✨ Key Features

- 🛒 **Premium Marketplace**: Browse, purchase, and download high-resolution photos securely. Photos are protected with dynamic watermarks until purchased.
- 💳 **Instant Payments**: Fully integrated with **Midtrans Payment Gateway**, supporting Virtual Accounts, QRIS, e-Wallets, and more.
- 🤖 **Discord Bot Automation**:
  - Automatically assigns exclusive roles upon successful payment.
  - Allows users to create service invoices directly from Discord using `/createinvoice`.
  - Real-time logging of server activities and voice channels.
- 💬 **Integrated Ticketing System**: Clients can request photography or videography services through a structured Discord ticketing system.
- ☁️ **Cloud Database**: Powered by Supabase for real-time data sync, user authentication, and transaction tracking.

---

## 🚀 Tech Stack

- **Frontend**: HTML5, Vanilla JavaScript, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Bot Engine**: Discord.js
- **Database & Auth**: Supabase
- **Payments**: Midtrans SDK

---

## 🛠️ Installation & Setup (Local)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/gnarlyaxx/bytelens-web.git
   cd bytelens-web
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory and add your credentials:
   ```env
   # Supabase
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Midtrans
   MIDTRANS_SERVER_KEY=your_midtrans_server_key
   MIDTRANS_CLIENT_KEY=your_midtrans_client_key

   # Discord Bot
   DISCORD_BOT_TOKEN=your_bot_token
   DISCORD_CLIENT_ID=your_client_id
   DISCORD_GUILD_ID=your_guild_id
   ```

4. **Run the Application:**
   ```bash
   npm run dev
   ```
   *The server will start at `http://localhost:3000`.*

---

## 👥 Authors & Collaborators

This project is proudly built and maintained by:

- **[gnarlyaxx](https://github.com/gnarlyaxx)** (Owner / Developer)
- **[Bilal](https://github.com/biaro1)** (Collaborator / Developer)

---
*Created for the Entrepreneur EXPO.*
