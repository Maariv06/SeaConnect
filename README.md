# 🌊 SeaConnect

A full-stack web application for **online fish auction and marketplace**, connecting fishermen and buyers through real-time bidding and secure transactions.

---

## 🚀 Features

* 🐟 Browse and explore different fish listings
* 📈 Real-time fish auction system
* 💰 Secure payments using Stripe
* 👤 User authentication (Login/Register)
* 🛒 Order management system
* 🔔 Notifications system
* 🧑‍💼 Admin dashboard for managing users, auctions, and orders
* 💼 Wallet system integration

---

## 🛠️ Tech Stack

### Frontend

* React.js
* CSS

### Backend

* Node.js
* Express.js

### Database

* MongoDB

### Payment

* Stripe

---

## 📂 Project Structure

```
SeaConnect/
│── frontend/      # React frontend
│── backend/       # Node.js backend
│── .gitignore
│── README.md
```

---

## ⚙️ Installation & Setup

### 1. Clone the repository

```
git clone https://github.com/Maariv06/SeaConnect.git
cd SeaConnect
```

---

### 2. Install dependencies

#### Backend

```
cd backend
npm install
```

#### Frontend

```
cd ../frontend
npm install
```

---

### 3. Environment Variables

Create a `.env` file inside `backend/` and add:

```
STRIPE_SECRET_KEY=your_secret_key
MONGO_URI=your_database_url
JWT_SECRET=your_secret_key
```

---

### 4. Run the application

#### Start Backend

```
cd backend
npm start
```

#### Start Frontend

```
cd frontend
npm start
```

---

## 📸 Screenshots

seperate folder there for

---

## 🔐 Security Note

Sensitive data like API keys and secrets are stored in environment variables (`.env`) and are not pushed to the repository.

---

## 👨‍💻 Author

**Mariappan**

---

## ⭐ Contribution

Feel free to fork this project and contribute!

---
