# Docker Deployment Guide - Proxy10x

Complete step-by-step guide for deploying Proxy10x using Docker in different environments.

## Table of Contents

1. [Quick Start (5 minutes)](#quick-start)
2. [Development Setup](#development-setup)
3. [Production Deployment](#production-deployment)
4. [Kubernetes Deployment](#kubernetes-deployment)
5. [Docker Swarm Deployment](#docker-swarm-deployment)
6. [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisite: Install Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# macOS (using Homebrew)
brew install docker

# Or download Docker Desktop from https://www.docker.com/products/docker-desktop
```

### 1. Pull the Latest Image

```bash
docker pull bwalia/proxy10x:latest
```

### 2. Run Container

```bash
docker run -d \
  --name proxy10x \
  --restart unless-stopped \
  -p 80:80 \
  -p 443:443 \
  -p 8080:8080 \
  -v proxy10x-data:/opt/nginx/data \
  -v proxy10x-certs:/etc/resty-auto-ssl \
  bwalia/proxy10x:latest
```

### 3. Access Admin Dashboard

Open your browser and navigate to:
```
http://localhost:8080
```

**Default Credentials:** (from settings.json)
- Username: `admin`
- Password: (see your settings.json)

### 4. View Logs

```bash
docker logs -f proxy10x
```

---

## Development Setup

### Using Docker Compose

**1. Clone the repository**

```bash
git clone https://github.com/proxy10x/proxy10x.git
cd proxy10x
```

**2. Start the development environment**

```bash
docker-compose -f docker-compose-dev.yml up -d
```

**3. Verify services are running**

```bash
docker-compose -f docker-compose-dev.yml ps
```

**4. View logs**

```bash
docker-compose -f docker-compose-dev.yml logs -f proxy10x
```

**5. Access services**

- **Admin Dashboard**: http://localhost:8080
- **Nginx**: http://localhost:80, https://localhost:443
- **Redis CLI**: `docker-compose exec redis redis-cli`

**6. Make changes and hot-reload**

The development compose mounts your local files, so changes are reflected immediately:
- Edit Lua files in `./api/` → Changes applied instantly
- Edit dashboard files in `./openresty-admin/src/` → Changes applied instantly
- Edit config files → Run `docker-compose exec proxy10x openresty -s reload`

**7. Stop the environment**

```bash
docker-compose -f docker-compose-dev.yml down
```

---

## Production Deployment

### Using Docker Compose (Single Node)

**1. Create data directory**

```bash
mkdir -p /data/proxy10x/{data,certs}
cd /data/proxy10x
```

**2. Create settings.json**

```bash
cat > data/settings.json << 'EOF'
{
  "instance_id": "prod-proxy",
  "instance_name": "Production Proxy",
  "env_profile": "prod",
  "redis_host": "redis",
  "storage_type": "disk",
  "env_vars": {
    "REDIS_HOST": "redis",
    "REDIS_PORT": 6379,
    "CONTROL_PLANE_API_URL": "https://api.example.com",
    "FRONT_URL": "https://admin.example.com"
  },
  "super_user": {
    "email": "admin@example.com",
    "password": "your-hashed-password",
    "username": "admin"
  }
}
EOF
```

**3. Copy docker-compose-prod.yml**

```bash
cp docker-compose-prod.yml /data/proxy10x/
cd /data/proxy10x
```

**4. Start services**

```bash
docker-compose -f docker-compose-prod.yml up -d
```

**5. Verify deployment**

```bash
# Check container status
docker-compose -f docker-compose-prod.yml ps

# Check logs
docker-compose -f docker-compose-prod.yml logs -f proxy10x

# Health check
curl http://localhost:8080/health
```

**6. Enable auto-start on reboot**

```bash
# Configure Docker to start on boot
sudo systemctl enable docker

# Docker Compose will automatically restart containers due to restart: always
```

### Using Raw Docker Commands (Advanced)

```bash
# Create volumes
docker volume create proxy10x-data
docker volume create proxy10x-certs
docker volume create redis-data

# Start Redis
docker run -d \
  --name proxy10x-redis \
  --restart always \
  -v redis-data:/data \
  redis:7-alpine \
  redis-server --appendonly yes

# Start Proxy10x
docker run -d \
  --name proxy10x \
  --restart always \
  --link proxy10x-redis:redis \
  -p 80:80 \
  -p 443:443 \
  -p 8080:8080 \
  -e REDIS_HOST=redis \
  -e REDIS_PORT=6379 \
  -e NGINX_CONFIG_DIR=/opt/nginx \
  -v proxy10x-data:/opt/nginx/data \
  -v proxy10x-certs:/etc/resty-auto-ssl \
  bwalia/proxy10x:latest

# View logs
docker logs -f proxy10x
```

### Update to Latest Version

```bash
cd /data/proxy10x

# Pull latest image
docker-compose -f docker-compose-prod.yml pull

# Restart with new image
docker-compose -f docker-compose-prod.yml up -d
```

---

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (1.20+)
- `kubectl` configured
- Helm 3+ installed

### Quick Deploy with Helm

**1. Clone the repository**

```bash
git clone https://github.com/proxy10x/proxy10x.git
cd infra/helm-charts
```

**2. Create values override file**

```bash
cat > values-prod.yaml << 'EOF'
replicaCount: 3

image:
  repository: bwalia/tenthmatrix
  tag: latest
  pullPolicy: IfNotPresent

service:
  type: LoadBalancer
  http:
    port: 80
  https:
    port: 443
  admin:
    port: 8080

ingress:
  enabled: true
  hosts:
    - host: proxy10x.example.com
      paths:
        - path: /
          pathType: Prefix

resources:
  limits:
    cpu: 2
    memory: 2Gi
  requests:
    cpu: 1
    memory: 512Mi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

persistence:
  enabled: true
  size: 20Gi
  storageClassName: default

redis:
  enabled: true
  replica:
    replicaCount: 2
  persistence:
    enabled: true
    size: 10Gi
EOF
```

**3. Deploy with Helm**

```bash
# Create namespace
kubectl create namespace proxy10x

# Deploy
helm install proxy10x ./proxy10x \
  -n proxy10x \
  -f values-prod.yaml

# Verify deployment
kubectl -n proxy10x get pods
kubectl -n proxy10x get svc
```

**4. Monitor deployment**

```bash
# Watch pod status
kubectl -n proxy10x get pods -w

# Check logs
kubectl -n proxy10x logs -f deployment/proxy10x

# Access dashboard
kubectl -n proxy10x port-forward svc/proxy10x 8080:8080
# Visit http://localhost:8080
```

**5. Update deployment**

```bash
# Update values
helm upgrade proxy10x ./proxy10x \
  -n proxy10x \
  -f values-prod.yaml
```

### Manual Kubernetes Deployment (Without Helm)

See `infra/helm-charts/proxy10x/templates/` for raw Kubernetes manifests.

---

## Docker Swarm Deployment

### Initialize Swarm

```bash
# Initialize manager node
docker swarm init

# Or join existing swarm
docker swarm join --token SWMTKN-xxx <manager-ip>:2377
```

### Deploy Stack

**1. Create compose file for Swarm**

```yaml
version: '3.8'

services:
  proxy10x:
    image: bwalia/proxy10x:latest
    ports:
      - target: 80
        published: 80
        protocol: tcp
        mode: host
      - target: 443
        published: 443
        protocol: tcp
        mode: host
      - target: 8080
        published: 8080
        protocol: tcp
        mode: host
    volumes:
      - proxy10x-data:/opt/nginx/data
      - proxy10x-certs:/etc/resty-auto-ssl
    environment:
      NGINX_CONFIG_DIR: /opt/nginx
      REDIS_HOST: redis
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 5
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 512M
    networks:
      - proxy10x-net

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    deploy:
      replicas: 1
      restart_policy:
        condition: on-failure
    networks:
      - proxy10x-net

volumes:
  proxy10x-data:
    driver: local
  proxy10x-certs:
    driver: local
  redis-data:
    driver: local

networks:
  proxy10x-net:
    driver: overlay
```

**2. Deploy stack**

```bash
docker stack deploy -c docker-compose.yml proxy10x
```

**3. Verify deployment**

```bash
# View services
docker service ls

# View tasks
docker service ps proxy10x_proxy10x

# View logs
docker service logs -f proxy10x_proxy10x
```

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NGINX_CONFIG_DIR` | `/opt/nginx` | Configuration directory |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `SSL_STAGING` | `false` | Use Let's Encrypt staging |
| `SSL_OCSP_STAPLING` | `true` | Enable OCSP stapling |
| `WORKER_PROCESSES` | `auto` | Nginx worker processes |
| `WORKER_CONNECTIONS` | `2048` | Nginx worker connections |

### Volume Mounts

| Volume | Purpose | Path |
|--------|---------|------|
| `proxy10x-data` | Configuration & data | `/opt/nginx/data` |
| `proxy10x-certs` | SSL certificates | `/etc/resty-auto-ssl` |
| `redis-data` | Redis persistence | `/data` (Redis only) |

---

## Backup & Recovery

### Backup Configuration

```bash
# Backup volumes
docker run --rm \
  -v proxy10x-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/proxy10x-data.tar.gz -C /data .

# Backup Redis
docker exec proxy10x-redis \
  redis-cli BGSAVE
docker cp proxy10x-redis:/data/dump.rdb ./redis-backup.rdb
```

### Restore Configuration

```bash
# Restore volumes
docker run --rm \
  -v proxy10x-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/proxy10x-data.tar.gz -C /data

# Restore Redis (copy dump.rdb and restart)
docker cp ./redis-backup.rdb proxy10x-redis:/data/dump.rdb
docker restart proxy10x-redis
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs proxy10x

# Test nginx config
docker run --rm -v proxy10x-data:/opt/nginx/data \
  bwalia/proxy10x:latest openresty -t

# Check port availability
sudo netstat -tlnp | grep -E ':80|:443|:8080'
```

### High Memory Usage

```bash
# Monitor resources
docker stats proxy10x

# Reduce workers in settings.json
"worker_processes": "2"
```

### SSL Certificate Issues

```bash
# Check certificates
docker exec proxy10x ls -la /etc/resty-auto-ssl/certs

# Check certificate validity
docker exec proxy10x openssl x509 \
  -in /etc/resty-auto-ssl/certs/example.com.crt \
  -text -noout
```

### Redis Connection Issues

```bash
# Test Redis connection
docker exec proxy10x redis-cli -h redis ping

# Check Redis logs
docker logs proxy10x-redis

# Restart Redis
docker restart proxy10x-redis
```

### Nginx Reload Issues

```bash
# Reload configuration
docker exec proxy10x openresty -s reload

# Restart container
docker restart proxy10x
```

---

## Performance Tuning

### Increase File Descriptors

```bash
# On host machine
sudo sysctl -w fs.file-max=2097152

# Permanently
echo "fs.file-max = 2097152" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Enable Swap

```bash
# Allocate 2GB swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Docker Network Optimization

```bash
# Use host network for performance (production only)
docker run -d \
  --network host \
  bwalia/proxy10x:latest
```

---

## Security Best Practices

1. **Use specific image tags**
   ```bash
   docker run bwalia/proxy10x:abc123 # Not :latest
   ```

2. **Run as non-root**
   ```bash
   docker run --user www-data bwalia/proxy10x:latest
   ```

3. **Use read-only filesystem**
   ```bash
   docker run --read-only \
     --tmpfs /tmp \
     --tmpfs /var/run \
     bwalia/proxy10x:latest
   ```

4. **Restrict capabilities**
   ```bash
   docker run \
     --cap-drop=ALL \
     --cap-add=NET_BIND_SERVICE \
     bwalia/proxy10x:latest
   ```

5. **Enable SELinux (if available)**
   ```bash
   docker run --security-opt label=type:svirt_apache_t \
     bwalia/proxy10x:latest
   ```

6. **Regular updates**
   ```bash
   docker pull bwalia/proxy10x:latest
   docker-compose up -d  # Redeploy with latest
   ```

---

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [OpenResty Documentation](https://openresty.org/)
- [Proxy10x GitHub Issues](https://github.com/proxy10x/proxy10x/issues)

---

## Support

For issues and questions:
1. Check [Proxy10x GitHub Issues](https://github.com/proxy10x/proxy10x/issues)
2. Review Docker logs: `docker logs proxy10x`
3. Test Nginx: `docker exec proxy10x openresty -t`
4. Check container health: `docker inspect proxy10x`
