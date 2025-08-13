# Security Improvements - Non-Root Container Execution

This document outlines the security improvements made to run the TaskFlow application containers as non-root users.

## Overview

Running containers as non-root users is a critical security best practice that:
- Reduces the attack surface if a container is compromised
- Prevents privilege escalation attacks
- Follows the principle of least privilege
- Complies with security standards and policies

## Changes Made

### 1. Backend (.NET API) Container

**Dockerfile Changes:**
- Created non-root user `appuser` with UID/GID 1001
- Set proper ownership of application directories
- Switched to non-root user before running the application

**Key Security Features:**
```dockerfile
# Create non-root user with specific UID/GID
RUN groupadd -r -g 1001 appuser && useradd -r -u 1001 -g appuser appuser

# Set proper ownership
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser
```

### 2. Frontend (Nginx) Container

**Dockerfile Changes:**
- Created non-root user `appuser` with UID/GID 1001
- Configured nginx to run on port 8080 (non-privileged port)
- Set proper permissions for nginx directories
- Created custom nginx configuration for non-root execution

**Key Security Features:**
```dockerfile
# Create non-root user
RUN addgroup -g 1001 -S appuser && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G appuser -g appuser appuser

# Set proper permissions for nginx
RUN chown -R appuser:appuser /var/cache/nginx /var/log/nginx /etc/nginx/conf.d

# Switch to non-root user
USER appuser
```

### 3. Port Changes

**Frontend Port Change:**
- Changed from port 80 (privileged) to port 8080 (non-privileged)
- Updated all configuration files accordingly

**Files Updated:**
- `frontend/nginx-nonroot.conf` - nginx listens on port 8080
- `docker-compose.yml` - port mapping updated to 3000:8080
- `k8s/frontend-deployment.yaml` - container port and health checks updated

### 4. Kubernetes Security Context

**Pod-level Security Context:**
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1001
  runAsGroup: 1001
  fsGroup: 1001
```

**Container-level Security Context:**
```yaml
securityContext:
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: false
  runAsNonRoot: true
  runAsUser: 1001
  runAsGroup: 1001
  capabilities:
    drop:
    - ALL
```

## Security Benefits

### 1. Reduced Attack Surface
- Containers cannot perform privileged operations
- Limited access to system resources
- Cannot bind to privileged ports (< 1024)

### 2. Privilege Escalation Prevention
- `allowPrivilegeEscalation: false` prevents gaining additional privileges
- `capabilities.drop: ALL` removes all Linux capabilities

### 3. File System Security
- Proper ownership ensures only the application user can access files
- `fsGroup` ensures consistent group ownership in Kubernetes

### 4. Network Security
- Non-privileged ports reduce the risk of port conflicts
- Cannot bind to system ports without explicit permission

## Verification

### Check Container User
```bash
# Docker
docker run --rm taskmanagement-api:latest whoami
docker run --rm taskmanagement-frontend:latest whoami

# Kubernetes
kubectl exec -it <pod-name> -- whoami
```

### Check Running Processes
```bash
# Docker
docker run --rm taskmanagement-api:latest ps aux
docker run --rm taskmanagement-frontend:latest ps aux

# Kubernetes
kubectl exec -it <pod-name> -- ps aux
```

### Check Port Bindings
```bash
# Check if containers are listening on correct ports
docker run --rm -p 5000:80 taskmanagement-api:latest &
docker run --rm -p 3000:8080 taskmanagement-frontend:latest &

# Verify with netstat or ss
netstat -tlnp | grep -E "(5000|3000)"
```

## Troubleshooting

### Permission Issues
If you encounter permission errors:

1. **Check file ownership in container:**
   ```bash
   kubectl exec -it <pod-name> -- ls -la /app
   ```

2. **Verify user ID:**
   ```bash
   kubectl exec -it <pod-name> -- id
   ```

3. **Check security context:**
   ```bash
   kubectl describe pod <pod-name>
   ```

### Port Binding Issues
If containers fail to start due to port issues:

1. **Verify non-privileged ports:**
   - Backend: Port 80 (internal, no binding issues)
   - Frontend: Port 8080 (non-privileged)

2. **Check port conflicts:**
   ```bash
   netstat -tlnp | grep -E "(8080|5000|3000)"
   ```

### Nginx Issues
If nginx fails to start:

1. **Check nginx configuration:**
   ```bash
   kubectl exec -it <frontend-pod> -- nginx -t
   ```

2. **Verify file permissions:**
   ```bash
   kubectl exec -it <frontend-pod> -- ls -la /etc/nginx/conf.d/
   ```

## Compliance

These changes help meet various security standards:

- **CIS Kubernetes Benchmark**: Runs containers as non-root
- **NIST Guidelines**: Implements principle of least privilege
- **PCI DSS**: Reduces attack surface for payment applications
- **SOC 2**: Demonstrates security controls implementation

## Best Practices Implemented

1. ✅ **Non-root execution**: All containers run as non-root users
2. ✅ **Specific UID/GID**: Uses consistent user IDs across environments
3. ✅ **Dropped capabilities**: Removes unnecessary Linux capabilities
4. ✅ **No privilege escalation**: Prevents gaining additional privileges
5. ✅ **Non-privileged ports**: Uses ports > 1024
6. ✅ **Proper file ownership**: Ensures correct permissions
7. ✅ **Security context**: Enforces security policies in Kubernetes

## Future Enhancements

Consider implementing:
- **Read-only root filesystem**: Set `readOnlyRootFilesystem: true`
- **Network policies**: Restrict network traffic between pods
- **Pod security policies**: Enforce security standards cluster-wide
- **Image scanning**: Regular vulnerability scanning of container images
- **Secrets management**: Use Kubernetes secrets for sensitive data
