# TaskFlow - Modern Task Management Application

A comprehensive full-stack task management application built with React frontend and .NET 8 backend, featuring modern UI/UX, dark mode support, and enterprise-grade architecture.

## 🏗️ Architecture Overview

### Technology Stack

- **Frontend**: React 18 with TypeScript support, Tailwind CSS, React Query
- **Backend**: .NET 8 Web API with Entity Framework Core
- **Database**: SQLite (development) / SQL Server (production)
- **Containerization**: Docker & Docker Compose
- **Orchestration**: Kubernetes ready with Helm charts
- **UI Components**: Lucide React icons, React Hook Form, React Hot Toast

### Application Features

- **Task Management**: Create, read, update, delete tasks with status tracking
- **User Management**: Complete user lifecycle with profile management
- **Category Management**: Organize tasks with color-coded categories
- **Dashboard**: Real-time statistics and activity overview
- **Kanban Board**: Drag-and-drop task management interface
- **Calendar View**: Timeline-based task visualization
- **Search & Filtering**: Advanced filtering by status, user, category, and text search
- **Dark Mode**: Complete dark theme with system preference detection
- **Responsive Design**: Mobile-first approach with responsive layouts

## 📁 Project Structure

```
taskflow/
├── backend/
│   └── TaskManagement.API/          # .NET 8 Web API
│       ├── Controllers/              # API endpoints
│       ├── Services/                 # Business logic layer
│       ├── Repositories/             # Data access layer
│       ├── Models/                   # Domain models
│       ├── DTOs/                     # Data transfer objects
│       ├── Data/                     # Database context
│       └── Mappings/                 # AutoMapper profiles
├── frontend/
│   └── src/                          # React application
│       ├── components/               # Reusable UI components
│       ├── pages/                    # Page components
│       ├── contexts/                 # React contexts
│       ├── services/                 # API service layer
│       └── styles/                   # CSS and styling
├── k8s/                              # Kubernetes manifests
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── api-deployment.yaml
│   ├── frontend-deployment.yaml
│   └── nginx-configmap.yaml
├── scripts/                          # Automation scripts
│   ├── build-deploy.sh              # Build and deployment automation
│   ├── k8s-deploy.sh                # Kubernetes deployment
│   └── database-manager.sh          # Database management
└── docker-compose.yml               # Local development setup
```

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose**: For containerized development
- **Node.js 18+**: For frontend development
- **.NET 8 SDK**: For backend development
- **kubectl**: For Kubernetes deployment

### Local Development with Docker

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd taskflow
   ```

2. **Start the application**

   ```bash
   ./scripts/build-deploy.sh --build-run
   ```

3. **Access the application**
   - Frontend: <http://localhost:3000>
   - Backend API: <http://localhost:5000>
   - API Documentation: <http://localhost:5000/swagger

### Build and Registry Push

Build and push images to your container registry:

```bash
# Build and push with default tag (latest)
./scripts/build-deploy.sh --push-registry my.company.com/taskflow

# Build and push with custom tag
./scripts/build-deploy.sh --push-registry my.company.com/taskflow --tag v1.0.0

# Build and push in detached mode
./scripts/build-deploy.sh --push-registry my.company.com/taskflow --tag v1.2.3 --detached
```

**Note**: Ensure you're logged into the registry first:
```bash
docker login my.company.com
```>

### Manual Development Setup

1. **Backend Setup**

   ```bash
   cd backend/TaskManagement.API
   dotnet restore
   dotnet run
   ```

2. **Frontend Setup**

   ```bash
   cd frontend
   npm install
   npm start
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

### Task Comments

- `GET /api/tasks/{taskId}/comments` - Get task comments
- `POST /api/tasks/{taskId}/comments` - Add comment to task

### Task Activities

- `GET /api/tasks/{taskId}/activities` - Get task activity history

## 🐳 Docker Configuration

### Development Environment

```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: ./backend/TaskManagement.API
    ports:
      - "5000:8080"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Data Source=data/taskmanagement.db
    volumes:
      - ./backend/TaskManagement.API/data:/app/data

  frontend:
    build: ./frontend
    ports:
      - "3000:8080"
    environment:
      - REACT_APP_API_URL=http://localhost:5000/api
    depends_on:
      - api
```

### Production Considerations

- **Security**: Non-root user execution in containers
- **Health Checks**: Comprehensive health monitoring
- **Resource Limits**: CPU and memory constraints
- **Logging**: Structured logging with Serilog
- **Monitoring**: Application metrics and tracing

## ☸️ Kubernetes Deployment

### Namespace and Configuration

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: taskmanagement
```

### Application Deployment

```bash
# Deploy to Kubernetes
./scripts/k8s-deploy.sh --deploy

# Check deployment status
kubectl get pods -n taskmanagement
kubectl get services -n taskmanagement
```

## 🗄️ Database Management

### Schema Overview

- **Tasks**: Core task entities with status, priority, and relationships
- **Users**: User profiles with authentication support
- **Categories**: Task categorization with color coding
- **TaskComments**: Comment system for task collaboration
- **TaskActivities**: Audit trail for task changes

### Database Operations

```bash
# Reset database
./scripts/database-manager.sh --reset

# Populate with sample data
./scripts/database-manager.sh --reset --populate

# Backup database
./scripts/database-manager.sh --backup
```

## 🔒 Security Features

### Authentication & Authorization

- JWT token-based authentication (ready for implementation)
- Role-based access control structure
- Secure API endpoints with proper validation

### Container Security

- Non-root user execution
- Minimal base images
- Security context enforcement
- Network policies support

### Data Protection

- Input validation and sanitization
- SQL injection prevention with Entity Framework
- XSS protection with proper encoding
- CORS configuration for cross-origin requests

## 📊 Monitoring & Observability

### Logging

- Structured logging with Serilog
- Request/response logging
- Error tracking and alerting
- Performance metrics

### Health Checks

- Application health endpoints
- Database connectivity checks
- External service dependency monitoring
- Kubernetes readiness and liveness probes

## 🛠️ Development Workflow

### Code Quality

- ESLint and Prettier for frontend
- EditorConfig for consistent formatting
- Git hooks for pre-commit validation
- Automated testing pipeline ready

### CI/CD Pipeline

- Docker image building and pushing
- Kubernetes deployment automation
- Database migration handling
- Environment-specific configurations

## 📚 Additional Resources

### Scripts Documentation

See [scripts/README.md](./scripts/README.md) for detailed information about automation scripts and their usage.

### API Documentation

Interactive API documentation available at `/swagger` endpoint when running the backend.

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 🎯 Production Deployment

### Kubernetes Deployment

**✅ DEPLOYMENT READY** - All configurations validated and optimized for K8s.

#### Production Deployment

```bash
# 1. Validate configuration
./scripts/k8s-validate.sh

# 2. Deploy with registry images
./scripts/k8s-deploy.sh \
  --registry my.company.com/taskflow \
  --image-tag v1.0.0 \
  --image-pull-secret my-registry-secret \
  deploy

# 3. Verify deployment
./scripts/k8s-deploy.sh status

# 4. Populate database
./scripts/k8s-database-manager.sh populate
```

#### Development Deployment

```bash
# Deploy with local images (no registry required)
./scripts/k8s-deploy.sh deploy

# Check status
./scripts/k8s-deploy.sh status
```

#### Access Methods

- **LoadBalancer**: `kubectl get svc taskmanagement-frontend-service -n taskmanagement`
- **NodePort**: `http://<node-ip>:30080`
- **Ingress**: `http://taskmanagement.local` (requires ingress controller)

#### Configuration Requirements

- **Registry Deployments**: Must specify `--image-pull-secret` when using `--registry`
- **Image Pull Secrets**: Must exist in target namespace before deployment
- **Namespace**: Defaults to `taskmanagement`, customizable with `--namespace`

See [K8S-DEPLOYMENT-CHECKLIST.md](K8S-DEPLOYMENT-CHECKLIST.md) for complete deployment guide.

### Environment Variables

#### Backend (.NET API)

- `ASPNETCORE_ENVIRONMENT` - Environment (Development/Production)
- `ASPNETCORE_URLS` - Server URLs (http://+:8080)
- `ConnectionStrings__DefaultConnection` - Database connection string

#### Frontend (React)

- `REACT_APP_API_URL` - Backend API base URL
- `REACT_APP_ENVIRONMENT` - Application environment

### Scaling Considerations

- Horizontal pod autoscaling for Kubernetes
- Database connection pooling
- Redis caching for session management
- CDN integration for static assets

---

**TaskFlow** - Built with ❤️ for modern task management needs.
