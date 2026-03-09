# 🎮 GameSmith - Game Assets Marketplace

A full-stack web application for discovering, managing, and selling game assets. Built with **React**, **NestJS**, and **MongoDB**, featuring real-time capabilities, multi-language support, and integrated payment processing.

![GameSmith](https://img.shields.io/badge/Status-Active%20Development-green?style=flat-square)
![Node.js](https://img.shields.io/badge/Node.js-v18%2B-informational?style=flat-square)
![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=flat-square&logo=react)
![NestJS](https://img.shields.io/badge/NestJS-11.0.1-E0234E?style=flat-square&logo=nestjs)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Development](#development)
- [API Documentation](#api-documentation)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**GameSmith** is a comprehensive marketplace platform for game assets including 3D models, UI kits, 2D assets, audio files, and VFX packages. The platform enables creators to upload and monetize their work while providing gamers and developers with a curated selection of high-quality assets.

### Key Use Cases
- 🎨 **Asset Creators**: Upload, manage, and sell game assets
- 🔍 **Asset Buyers**: Browse, purchase, and download game assets
- 💳 **Payment Processing**: Secure payment integration for asset purchases
- 📊 **Analytics**: Track downloads, views, and sales performance

---

## ✨ Features

### 🎨 Frontend Features
- **Browse & Search**: Powerful search and filtering across asset categories
  - 2D Assets, 3D Assets, UI Kits, Audio, VFX
  - Filter by price, license type, and more
- **User Authentication**: Secure login/signup with JWT
- **Shopping Cart & Wishlist**: Save favorite assets for later
- **Asset Management**: Creators can upload and manage their products
- **Downloads**: Track and manage purchased assets
- **Messages**: Real-time communication between users (Socket.io)
- **User Profiles**: Customizable profiles with avatar uploads
- **Multi-language Support**: Vietnamese and English localization
- **Dark/Light Mode**: Theme switching for user preference
- **Responsive Design**: Mobile-first approach with mobile-optimized layouts

### 🔧 Backend Features
- **Asset Management**: CRUD operations for game assets
- **User Management**: Authentication, profiles, and roles
- **Shopping System**: Cart, orders, and payment handling
- **Payment Processing**: Integrated payment gateway support (Stripe)
- **Download Management**: Track downloads and provide access control
- **Recommendations**: AI-powered personalized asset recommendations
- **Search & Indexing**: Fast asset discovery
- **File Storage**: Cloud-based asset file management (AWS S3)
- **Rate Limiting**: API protection against abuse
- **Category & Tag System**: Organized asset catalog

### 🎯 Core Modules
| Module | Purpose |
|--------|---------|
| **Assets** | Asset CRUD, versioning, file management |
| **Users** | Authentication, profiles, purchase history |
| **Orders** | Shopping cart, order processing, history |
| **Payments** | Payment creation, webhook handling, transaction tracking |
| **Downloads** | Access control, download tracking, history |
| **Categories** | Asset categorization and filtering |
| **Wishlist** | Save favorite assets |
| **Cart** | Shopping cart management |
| **Messages** | User-to-user communication |
| **Ratings & Reviews** | Community feedback system |
| **Recommendations** | AI-powered suggestions |
| **Storage** | File upload and management |

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19.2.0 with Vite
- **Styling**: TailwindCSS 4.1 with dark mode
- **State Management**: Context API + React Hooks
- **Routing**: React Router v7
- **Localization**: react-i18next
- **Icons**: Lucide React
- **Animation**: Framer Motion
- **Real-time**: Socket.io Client
- **HTTP Client**: Fetch API
- **Build Tool**: Vite with HMR

### Backend
- **Framework**: NestJS 11.0.1
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **File Storage**: AWS S3 SDK
- **Validation**: class-validator
- **Security**: bcrypt, helmet, CORS
- **Testing**: Jest, Supertest
- **Logging**: Built-in NestJS logger
- **Configuration**: Dotenv

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx (frontend proxy)
- **API Gateway**: Built into NestJS
- **Database**: MongoDB
- **Cloud Storage**: AWS S3

---

## 📁 Project Structure

```
GameSmith/
├── frontend/                    # React + Vite Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Footer.jsx
│   │   │   ├── navigation/     # Navbar, Sidebar
│   │   │   ├── payment/        # Payment UI components
│   │   │   ├── product/        # Product cards, details
│   │   │   └── ui/             # Generic UI components
│   │   ├── pages/              # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── BrowseAll.jsx
│   │   │   ├── ProductDetail.jsx
│   │   │   ├── MyProduct.jsx   # Creator dashboard
│   │   │   ├── Cart.jsx
│   │   │   ├── Orders.jsx
│   │   │   ├── Downloads.jsx
│   │   │   ├── Wishlist.jsx
│   │   │   ├── Messages.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Settings.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Signup.jsx
│   │   ├── context/            # Context providers
│   │   │   ├── AuthContext.jsx
│   │   │   ├── CartContext.jsx
│   │   │   ├── UserDataContext.jsx
│   │   │   ├── LanguageContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── hooks/              # Custom React hooks
│   │   │   └── useSocket.js    # WebSocket integration
│   │   ├── i18n/               # Internationalization
│   │   │   ├── i18n.js
│   │   │   └── locales/
│   │   │       ├── en.json
│   │   │       └── vi.json
│   │   ├── layouts/
│   │   │   └── MainLayout.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css           # Global styles
│   ├── public/                 # Static assets
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   └── README.md
│
├── backend/                     # NestJS Backend
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/           # JWT authentication
│   │   │   ├── assets/         # Asset management
│   │   │   │   ├── schemas/    # MongoDB schemas
│   │   │   │   ├── dto/        # Data transfer objects
│   │   │   │   ├── assets.service.ts
│   │   │   │   ├── assets.controller.ts
│   │   │   │   └── assets.module.ts
│   │   │   ├── users/          # User management
│   │   │   ├── orders/         # Order processing
│   │   │   ├── payments/       # Payment handling
│   │   │   ├── downloads/      # Download management
│   │   │   ├── categories/     # Asset categories
│   │   │   ├── carts/          # Shopping cart
│   │   │   ├── wishlist/       # Wishlist management
│   │   │   ├── messages/       # User messaging
│   │   │   ├── ratings/        # Reviews & ratings
│   │   │   ├── recommendations/# AI recommendations
│   │   │   ├── storage/        # File storage (S3)
│   │   │   ├── transactions/   # Transaction tracking
│   │   │   └── user-collections/ # Named asset collections
│   │   ├── common/
│   │   │   ├── decorators/     # Custom decorators
│   │   │   ├── guards/         # Auth guards
│   │   │   └── filters/        # Exception filters
│   │   ├── database/
│   │   │   ├── database.config.ts
│   │   │   └── database.module.ts
│   │   ├── app.module.ts       # Root module
│   │   └── main.ts             # Entrypoint
│   ├── scripts/
│   │   ├── seed-assets.ts      # Database seeding
│   │   ├── seed-categories.ts
│   │   └── test-payload.json
│   ├── test/
│   │   ├── app.e2e-spec.ts
│   │   └── jest-e2e.json
│   ├── uploads/                # Temporary file uploads
│   ├── tsconfig.json
│   ├── nest-cli.json
│   ├── package.json
│   ├── README.md
│   ├── PAYMENT_GUIDE.md        # Payment module documentation
│   ├── README_PAYMENT.md       # Payment quick start
│   └── WORK_COMPLETED.md       # Development summary
│
├── ai-service/                 # Python AI/ML Service (Optional)
│   ├── core/                   # ML core
│   │   ├── clip_embeddings.py  # CLIP model embeddings
│   │   ├── embeddings.py
│   │   ├── file_analysis.py
│   │   ├── image_caption.py
│   │   └── qdrant.py           # Vector database
│   ├── routers/                # API endpoints
│   │   ├── image_search.py
│   │   ├── recommendations.py
│   │   ├── similar.py
│   │   ├── tagging.py
│   │   ├── seo.py
│   │   └── indexing.py
│   ├── main.py
│   ├── config.py
│   ├── schemas.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.yml          # Multi-container orchestration
├── DOCKER.md                   # Docker quick start
├── LICENSE                     # MIT License
└── README.md                   # This file
```

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** v18 or higher
- **npm** or **yarn** package manager
- **MongoDB** (local or Atlas cloud)
- **Docker** & **Docker Compose** (optional)
- **AWS S3** credentials (for file uploads)

### Clone Repository

```bash
git clone https://github.com/hungblog2005-gif/GameSmith.git
cd GameSmith
```

### Option 1: Local Development

#### Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your configuration:
# - MONGODB_URI=mongodb://localhost:27017/gamesmith_db
# - JWT_SECRET=your-secret-key
# - AWS_ACCESS_KEY_ID=your-aws-key
# - AWS_SECRET_ACCESS_KEY=your-aws-secret

# Start development server
npm run start:dev
# Server runs on http://localhost:3000
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:3000" > .env

# Start development server
npm run dev
# Client runs on http://localhost:5173
```

### Option 2: Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up --build

# Services will be available at:
# - Frontend: http://localhost
# - Backend API: http://localhost:3000
# - MongoDB: localhost:27017
```

To stop:
```bash
docker-compose down
```

---

## 💻 Development

### Running Tests

**Backend:**
```bash
cd backend

# Unit tests
npm run test

# Test coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

**Frontend:**
```bash
cd frontend

# Linting
npm run lint
```

### Building for Production

**Backend:**
```bash
cd backend

# Build TypeScript
npm run build

# Run compiled version
npm run start:prod
```

**Frontend:**
```bash
cd frontend

# Build Vite bundle
npm run build

# Preview production build
npm run preview
```

### Database Seeding

```bash
cd backend

# Seed sample assets and categories
npx ts-node scripts/seed-assets.ts
npx ts-node scripts/seed-categories.ts
```

---

## 📡 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Key Endpoints

#### Assets
- `GET /assets` - List all published assets
- `GET /assets/:id` - Get asset details
- `POST /assets` - Create new asset (authenticated)
- `PUT /assets/:id` - Update asset (creator only)
- `DELETE /assets/:id` - Delete asset (creator only)

#### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh JWT token

#### Orders
- `GET /orders` - Get user's orders
- `POST /orders` - Create new order
- `GET /orders/:id` - Get order details

#### Payments
- `POST /payments` - Create payment
- `POST /payments/callback` - Payment gateway webhook
- `GET /payments/:id` - Get payment details

#### Downloads
- `GET /downloads` - Get user's downloads
- `GET /assets/:id/download` - Download asset file

#### Users
- `GET /users/:id` - Get user profile
- `PUT /users/:id` - Update profile
- `GET /users/my-assets` - Get creator's assets

For complete API reference, see [backend/PAYMENT_GUIDE.md](backend/PAYMENT_GUIDE.md)

---

## 🏗️ Architecture

### Frontend Architecture
- **Component-based**: Reusable, composable React components
- **Context API**: Global state management (Auth, Cart, Theme, Language)
- **Custom Hooks**: Encapsulated logic (useSocket, useAuth, etc.)
- **Router**: Client-side routing with React Router v7
- **Responsive**: Mobile-first CSS with TailwindCSS

### Backend Architecture
- **Modular Design**: Feature-based module organization
- **Dependency Injection**: NestJS IoC container
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based stateless auth
- **File Storage**: Pluggable storage (AWS S3)
- **Error Handling**: Centralized exception filters
- **Validation**: Class-based DTOs with validation

### Data Flow
```
Client Request → Nginx/Frontend → NestJS API → MongoDB ← AWS S3 (Files)
```

### Real-time Communication
- **Socket.io**: WebSocket events for messages and notifications
- **Publish-Subscribe**: Message queue for async operations

---

## 🔐 Security Features

- ✅ **JWT Authentication**: Secure token-based authentication
- ✅ **Password Hashing**: bcrypt for secure password storage
- ✅ **CORS Protection**: Configured CORS policies
- ✅ **Rate Limiting**: API endpoint rate limiting
- ✅ **Input Validation**: Class-based validation with decorators
- ✅ **SQL Injection Prevention**: MongoDB ODM (no raw queries)
- ✅ **HTTPS Ready**: Docker setup with Nginx reverse proxy
- ✅ **Environment Variables**: Secure config management

---

## 📈 Performance

- **Frontend**:
  - Code splitting with Vite
  - Image optimization
  - Lazy loading routes
  - TailwindCSS purging

- **Backend**:
  - Database indexing
  - Pagination support
  - Caching strategies
  - AWS S3 presigned URLs

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit** changes:
   ```bash
   git commit -m "Add: meaningful commit message"
   ```
4. **Push** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open** a Pull Request

## Code Style
- **Frontend**: ESLint + Prettier
- **Backend**: ESLint + Prettier
- **TypeScript**: Strict mode enabled

---

## 📜 License

This project is licensed under the **MIT License**.  
See the [LICENSE](LICENSE) file for details.

---

## 👥 Team

- **Developer**: hungblog2005-gif
- **Current Branch**: feature/loginSigntInProfile
- **Default Branch**: main

---

## 💬 Support

For issues, questions, or suggestions:
1. Check existing [GitHub Issues](https://github.com/hungblog2005-gif/GameSmith/issues)
2. Create a new issue with detailed description
3. Include error messages and reproducible steps

---

## 🗺️ Roadmap

- [ ] Advanced search with Elasticsearch
- [ ] AI-powered image tagging
- [ ] Video hosting and streaming
- [ ] Asset bundle management
- [ ] Creator analytics dashboard
- [ ] Subscription tiers
- [ ] Community marketplace features
- [ ] Mobile native apps

---

## 📚 Additional Resources

- [Backend Documentation](backend/README.md)
- [Payment Module Guide](backend/PAYMENT_GUIDE.md)
- [Docker Setup](DOCKER.md)
- [Payment Implementation](backend/PAYMENT_IMPLEMENTATION_SUMMARY.md)
- [Frontend Setup](frontend/README.md)

---

**Built with ❤️ for game developers and asset creators**
