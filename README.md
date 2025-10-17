# Full-Stack Express + LemonadeJS Application

A modern full-stack application with Express.js backend API and LemonadeJS frontend, organized in a monorepo structure.

## Project Structure

```
.
├── client/                  # Frontend (LemonadeJS + Webpack)
│   ├── src/
│   │   ├── App.js          # Main app component with routing
│   │   ├── Edition.js      # User create/edit form
│   │   ├── Search.js       # User list with data grid
│   │   ├── index.js        # Entry point
│   │   ├── style.css       # Custom styles
│   │   └── utils/
│   │       ├── Header.js   # Header component
│   │       └── Menu.js     # Navigation menu
│   ├── index.html          # HTML template
│   ├── webpack.config.js   # Webpack configuration
│   └── package.json
├── server/                  # Backend (Express API)
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   │   └── user.controller.js
│   │   ├── middleware/     # Custom middleware
│   │   │   ├── errorHandler.js
│   │   │   └── asyncHandler.js
│   │   ├── routes/         # API routes
│   │   │   ├── api.routes.js
│   │   │   └── user.routes.js
│   │   └── server.js       # Express app entry point
│   ├── .env.example        # Environment variables template
│   └── package.json
├── package.json             # Root package.json with workspace scripts
├── .gitignore
└── README.md
```

## Features

### Backend
- Express.js REST API
- CRUD operations for users
- Error handling middleware
- Security headers (Helmet)
- CORS enabled
- Request logging (Morgan)
- Environment variables support
- Serves frontend in production

### Frontend
- LemonadeJS reactive framework
- Client-side routing
- Data grid for listing users
- Form for creating/editing users
- Webpack dev server with HMR
- API proxy in development
- Production build optimization

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install all dependencies (root, client, and server):
```bash
npm run install:all
```

Or install individually:
```bash
npm install              # Root dependencies
cd client && npm install # Frontend dependencies
cd server && npm install # Backend dependencies
```

2. Set up environment variables:
```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your configuration.

### Development

Run both frontend and backend concurrently:
```bash
npm run dev
```

Or run them separately:

**Terminal 1 - Backend:**
```bash
npm run dev:server
# Server runs on http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
npm run dev:client
# Client runs on http://localhost:4001
```

In development mode:
- Frontend runs on port **4001** with webpack-dev-server
- Backend API runs on port **3000**
- Webpack proxy forwards `/api/*` requests to the backend
- Hot Module Replacement (HMR) enabled

### Production

1. Build the frontend:
```bash
npm run build
```

2. Start the server (serves both API and frontend):
```bash
npm run start:prod
```

The Express server will:
- Serve the API at `/api/*`
- Serve the built frontend from `client/dist`
- Handle client-side routing
- Run on port **3000**

## API Endpoints

### Health Check
- `GET /health` - Check server status

### Users API
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
  - Body: `{ name, email }`
- `PUT /api/users/:id` - Update user
  - Body: `{ name, email }`
- `DELETE /api/users/:id` - Delete user

## Frontend Routes

- `/clients/search` - User list page
- `/clients/edition` - Create new user
- `/clients/edition?id={id}` - Edit existing user

## Environment Variables

Create a `server/.env` file:

```env
PORT=3000
NODE_ENV=development
```

## Scripts Reference

### Root Level
- `npm run install:all` - Install all dependencies
- `npm run dev` - Run both client and server in development
- `npm run dev:server` - Run only backend
- `npm run dev:client` - Run only frontend
- `npm run build` - Build frontend for production
- `npm start` - Start server in development
- `npm run start:prod` - Start server in production mode

### Client (cd client/)
- `npm start` - Start webpack dev server
- `npm run build` - Build for production

### Server (cd server/)
- `npm start` - Start server
- `npm run dev` - Start with nodemon (auto-reload)

## Technologies Used

### Backend
- **express** - Web framework
- **dotenv** - Environment variables
- **cors** - Cross-Origin Resource Sharing
- **helmet** - Security headers
- **morgan** - HTTP request logger
- **nodemon** - Development auto-restart

### Frontend
- **lemonadejs** - Reactive UI framework
- **@lemonadejs/router** - Client-side routing
- **@lemonadejs/data-grid** - Data grid component
- **jsuites** - UI utilities
- **webpack** - Module bundler
- **webpack-dev-server** - Development server

## Development Workflow

1. Make changes to your code
2. Frontend automatically reloads (HMR)
3. Backend automatically restarts (nodemon)
4. API calls from frontend are proxied to backend

## License

ISC
