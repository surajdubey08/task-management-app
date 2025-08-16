# SRE POC - Build and Push Guide

This guide explains how to build and push TaskFlow Docker images to the SRE POC registry.

## 📋 Prerequisites

### 1. Docker Installation
Ensure Docker is installed and running on your system:
```bash
docker --version
docker info
```

### 2. Registry Authentication
**IMPORTANT**: You must be logged in to the SRE POC registry before running the scripts:

```bash
docker login sre-citizenuser-jfp-west-virtual-docker-prod001.artifacts-west.pwc.com
```

Enter your credentials when prompted.

### 3. Repository Access
Ensure you have the TaskFlow repository cloned and are in the root directory:
```bash
cd 3-tier-app
ls -la scripts/build-image-for-sre-poc.*
```

## 🚀 Usage

### Bash Script (Linux/macOS/WSL)

#### Basic Usage:
```bash
./scripts/build-image-for-sre-poc.sh
```

#### Make Script Executable (if needed):
```bash
chmod +x scripts/build-image-for-sre-poc.sh
```

### PowerShell Script (Windows)

#### Basic Usage:
```powershell
.\scripts\build-image-for-sre-poc.ps1
```

#### Skip Cleanup:
```powershell
.\scripts\build-image-for-sre-poc.ps1 -SkipCleanup
```

#### Show Help:
```powershell
.\scripts\build-image-for-sre-poc.ps1 -Help
```

## 🔄 What the Scripts Do

### 1. **Docker Cleanup** (Optional)
- Stops and removes all containers
- Removes unused images, volumes, and networks
- Removes existing TaskFlow images
- Provides a fresh start for building

### 2. **Build Images**
- Builds the .NET API image from `backend/TaskManagement.API/`
- Builds the React frontend image from `frontend/`
- Uses optimized Dockerfiles with non-root user configuration

### 3. **Tag Images**
- Tags local images with SRE POC registry URLs:
  - `taskmanagement-api:latest` → `sre-citizenuser-jfp-west-virtual-docker-prod001.artifacts-west.pwc.com/sre-poc-app/taskmanagement-api:latest`
  - `taskmanagement-frontend:latest` → `sre-citizenuser-jfp-west-virtual-docker-prod001.artifacts-west.pwc.com/sre-poc-app/taskmanagement-frontend:latest`

### 4. **Push Images**
- Pushes tagged images to the SRE POC registry
- Verifies successful upload

## 📊 Expected Output

```
==============================================
SRE POC - BUILD AND PUSH DOCKER IMAGES
==============================================

Registry: sre-citizenuser-jfp-west-virtual-docker-prod001.artifacts-west.pwc.com
Project:  sre-poc-app
Tag:      latest

==============================================
CLEANING UP DOCKER RESOURCES
==============================================
✅ Docker cleanup completed

==============================================
BUILDING DOCKER IMAGES
==============================================
✅ API image built successfully: taskmanagement-api:latest
✅ Frontend image built successfully: taskmanagement-frontend:latest

==============================================
TAGGING IMAGES FOR REGISTRY
==============================================
✅ API image tagged: sre-citizenuser-jfp-west-virtual-docker-prod001.artifacts-west.pwc.com/sre-poc-app/taskmanagement-api:latest
✅ Frontend image tagged: sre-citizenuser-jfp-west-virtual-docker-prod001.artifacts-west.pwc.com/sre-poc-app/taskmanagement-frontend:latest

==============================================
PUSHING IMAGES TO REGISTRY
==============================================
✅ API image pushed successfully
✅ Frontend image pushed successfully

==============================================
BUILD AND PUSH SUMMARY
==============================================
✅ Successfully built and pushed images:

API Image:
  Local:    taskmanagement-api:latest
  Registry: sre-citizenuser-jfp-west-virtual-docker-prod001.artifacts-west.pwc.com/sre-poc-app/taskmanagement-api:latest

Frontend Image:
  Local:    taskmanagement-frontend:latest
  Registry: sre-citizenuser-jfp-west-virtual-docker-prod001.artifacts-west.pwc.com/sre-poc-app/taskmanagement-frontend:latest

✅ Images are now available in the SRE POC registry!

🎉 Build and push process completed successfully!
```

## 🔧 Troubleshooting

### Authentication Issues
```bash
# Error: unauthorized: authentication required
docker login sre-citizenuser-jfp-west-virtual-docker-prod001.artifacts-west.pwc.com
```

### Docker Not Running
```bash
# Error: Cannot connect to the Docker daemon
# Start Docker Desktop or Docker service
sudo systemctl start docker  # Linux
```

### Permission Issues (Linux/macOS)
```bash
# Make script executable
chmod +x scripts/build-image-for-sre-poc.sh

# Or run with bash
bash scripts/build-image-for-sre-poc.sh
```

### Build Failures
- Check Dockerfile syntax
- Ensure all required files are present
- Verify Docker has enough disk space
- Check network connectivity

### Push Failures
- Verify registry authentication
- Check network connectivity to registry
- Ensure you have push permissions to the repository

## 📁 Registry Information

- **Registry URL**: `sre-citizenuser-jfp-west-virtual-docker-prod001.artifacts-west.pwc.com`
- **Project**: `sre-poc-app`
- **Images**:
  - `taskmanagement-api:latest`
  - `taskmanagement-frontend:latest`

## 🚀 Next Steps

After successfully pushing images:

1. **Deploy to Kubernetes**:
   ```bash
   kubectl apply -f k8s/
   ```

2. **Verify Deployment**:
   ```bash
   kubectl get pods -n taskmanagement
   kubectl get services -n taskmanagement
   ```

3. **Check Logs**:
   ```bash
   kubectl logs -f deployment/taskmanagement-api-deployment -n taskmanagement
   kubectl logs -f deployment/taskmanagement-frontend-deployment -n taskmanagement
   ```

## 🔒 Security Notes

- Images are built with non-root users for enhanced security
- All containers run on non-privileged ports (8080)
- Security contexts are enforced in Kubernetes deployments
- Registry credentials should be kept secure and not committed to version control

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all prerequisites are met
3. Review Docker and registry logs
4. Ensure network connectivity to the registry
