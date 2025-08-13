# TaskFlow - Modern Task Management Application

A comprehensive 2-tier task management application built with React frontend and .NET backend, featuring a modern dark mode UI and professional design.

## 🚀 Features

### Core Functionality
- **Task Management**: Create, read, update, delete tasks with status tracking
- **User Management**: Manage users with profile information  
- **Category Management**: Organize tasks with color-coded categories
- **Dashboard**: Overview with statistics and recent activity
- **Filtering & Search**: Advanced filtering by status, user, category, and text search
- **Dark Mode**: Complete dark mode support with system preference detection

### Technical Features
- **Modern UI**: Professional dark mode interface with Tailwind CSS
- **RESTful API**: Comprehensive REST endpoints with proper HTTP status codes
- **SQLite Database**: Lightweight, file-based database perfect for demos
- **Responsive Design**: Mobile-friendly UI with modern styling
- **Health Checks**: Built-in health check endpoints for monitoring
- **Structured Logging**: Comprehensive logging with Serilog

## 🏗️ Architecture

- **Frontend**: React 18 with modern dark mode UI, React Router, and Tailwind CSS
- **Backend**: .NET 8 Web API with Entity Framework Core, AutoMapper, and Serilog
- **Database**: SQLite (lightweight, file-based, perfect for demos and development)
- **Containerization**: Docker and Docker Compose
- **Orchestration**: Kubernetes manifests for production deployment

## ⚡ Quick Start

### Prerequisites

- Docker and Docker Compose
- .NET 8 SDK (for local development)
- Node.js 18+ (for local development)

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd 3-tier-app
   ```

2. **Start the application**
   ```bash
   # Using scripts (recommended)
   ./scripts/build-and-run.sh --detached
   
   # Or manually with Docker Compose
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Swagger UI: http://localhost:5000/swagger

### Local Development

1. **Start the backend**
   ```bash
   cd backend/TaskManagement.API
   dotnet restore
   dotnet run
   ```

2. **Start the frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm start
   ```

## 📁 Project Structure

```
taskflow/
├── backend/
│   └── TaskManagement.API/          # .NET 8 Web API
├── frontend/
│   └── src/                         # React application with dark mode
├── k8s/                             # Kubernetes manifests
├── scripts/                         # Automation scripts
└── docker-compose.yml              # Docker Compose configuration
```

## 🔧 API Endpoints

### Tasks
- `GET /api/tasks` - Get all tasks (with optional filters)
- `GET /api/tasks/{id}` - Get task by ID
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task

### Users
- `GET /api/users` - Get all users
- `GET /api/users/{id}` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/{id}` - Get category by ID
- `POST /api/categories` - Create new category
- `PUT /api/categories/{id}` - Update category
- `DELETE /api/categories/{id}` - Delete category

### Health Check
- `GET /health` - Application health status

## 🐳 Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## ☸️ Kubernetes Deployment

```bash
# Deploy using scripts
./scripts/deploy-k8s.sh --build-images

# Or manually
kubectl apply -f k8s/
kubectl get pods -n taskmanagement
```

## 🔍 Monitoring and Observability

This application includes comprehensive monitoring and logging capabilities:

- **Metrics**: HTTP request/response metrics, database query performance
- **Traces**: End-to-end request tracing, database operation tracing
- **Logs**: Structured logging with Serilog, request/response logging

## 🛠️ Development

### Environment Variables

**Backend (.NET API)**
- `ConnectionStrings__DefaultConnection` - Database connection string
- `ASPNETCORE_ENVIRONMENT` - Environment (Development/Production)

**Frontend (React)**
- `REACT_APP_API_URL` - Backend API base URL

### Database

The application uses SQLite with Entity Framework Core. The database file is automatically created with seed data on first run.

## 📝 Scripts

The `scripts/` directory contains automation scripts for common tasks:

- `setup-dev.*` - Install dependencies and setup environment
- `build-and-run.*` - Build and run with Docker Compose  
- `deploy-k8s.*` - Deploy to Kubernetes cluster

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
