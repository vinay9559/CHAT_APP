<<<<<<< HEAD
# AetherChat: Real-Time Chat Application with Secure Authentication

A premium, full-stack, real-time chat application featuring user authentication, public and private messaging, online presence indicators, and live typing status updates. Designed with a custom glassmorphism dark-mode UI.

---

## 🌟 Key Features

1. **Secure Authentication & Session Management**:
   - User registration and login utilizing unique username checks.
   - Secure password hashing with `bcrypt` (10 rounds).
   - Session tokens generated via JSON Web Tokens (JWT) stored in secure HTTP-only cookies.
   - REST API protection via Express JWT validation middleware.
   - Secure WebSocket connection verification via cookie authorization on handshake.
   
2. **Real-Time Communication**:
   - Driven by **Socket.IO** for lightning-fast duplex message transfers.
   - **Global Chatroom** for messaging all active users.
   - **Private Messaging (Direct Messages)** targeting isolated individual user channels.
   - **Presence Indicators**: Visual cues (online/offline status) updated dynamically as users log in, disconnect, or logout.
   - **Typing Indicators**: Displays animations when someone is actively typing in global or private conversations.
   - **Persistent History**: Chat messages are stored in MongoDB. Historical logs load instantly upon switching rooms.

3. **Premium Glassmorphic Interface**:
   - Modern cosmic-purple color theme.
   - Backdrop-filter blur animations and micro-interactions.
   - Dynamic user avatar colors based on initials.
   - Responsive layouts optimized for both desktop viewports and mobile screens.

---

## 🛠️ Technology Stack

- **Frontend**: React (Vite), Context API, Socket.IO Client, Lucide React (Icons).
- **Backend**: Node.js, Express, Socket.IO Server, JWT, BCrypt, Cookie Parser.
- **Database**: MongoDB, Mongoose ODM.

---

## 📁 Repository Structure

```
chat-app/
├── README.md               # Documentation and setup instructions
├── package.json            # Workspace setup for starting dev servers
├── server/                 # Express and Socket.IO backend
│   ├── src/
│   │   ├── config/         # MongoDB connection config
│   │   ├── middleware/     # Auth and error middleware
│   │   ├── models/         # User and Message Schemas
│   │   ├── routes/         # Auth and messaging REST endpoints
│   │   ├── socket/         # Socket.IO connection event logic
│   │   └── index.js        # Server entry file
│   ├── .env.example
│   └── package.json
└── client/                 # React frontend
    ├── src/
    │   ├── components/     # UI Views (AuthPage, Sidebar, ChatWindow)
    │   ├── context/        # React context (Auth and Socket connections)
    │   ├── index.css       # Layout styles & Glassmorphic tokens
    │   ├── App.jsx         # App router and layout assembler
    │   └── main.jsx        # App mounting file
    ├── vite.config.js      # Vite config with API proxy
    └── package.json
```

---

## ⚙️ Setup and Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [MongoDB](https://www.mongodb.com/) running locally on port `27017` (or access to a MongoDB Atlas cluster URI).

### Step 1: Clone the Repository & Configure Environment
1. Ensure the project folders match the directory structure.
2. In the `server` directory, create a `.env` file from the example:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/chat-app
   JWT_SECRET=your_super_secret_jwt_key
   FRONTEND_URL=http://localhost:3000
   NODE_ENV=development
   ```

### Step 2: Install Dependencies
From the root workspace folder, run the following command to download and install packages for both client and server projects:
```bash
npm run install:all
```
*(This triggers installations in the root directory, inside `/server` and inside `/client`)*

### Step 3: Run the Application
Start both the backend server and React client concurrently by running the following command from the root workspace:
```bash
npm run dev
```

- **Frontend client** will run on: [http://localhost:3000](http://localhost:3000)
- **Backend server** will run on: [http://localhost:5000](http://localhost:5000)

---

## 🔒 Security Practices Implemented

- **Password Hashing**: Stored passwords undergo cryptographic hashing via `bcrypt`. Plaintext passwords are never logged or stored.
- **HTTP-Only Cookies**: JWT tokens are persisted in `httpOnly` cookies. This makes them inaccessible to client-side scripts, protecting the user from Cross-Site Scripting (XSS) token-theft attacks.
- **WebSocket Handshake Validation**: Socket connections are authenticated in the connection middleware before socket event registers. Unauthenticated connections are dropped.
- **CORS Protection**: Access control configurations restrict server resources exclusively to the trusted frontend origins.

---

## 📝 License & Copyright

Copyright (c) 2026 Vinay Yadav. All rights reserved.
This project is built and maintained by Vinay Yadav.
=======
# CHAT_APP
 premium, full-stack, real-time chat application featuring user authentication, public and private messaging, online presence indicators, and live typing status updates. Designed with a custom glassmorphism dark-mode UI.
>>>>>>> 3d9e8e5ec908c80c49d6b21dafd4f351465655f2
