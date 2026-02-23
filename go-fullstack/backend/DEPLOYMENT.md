# Deployment Guide

This guide covers deploying the Go Fullstack Backend to various platforms.

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [Kubernetes Deployment](#kubernetes-deployment)
4. [AWS ECS Deployment](#aws-ecs-deployment)
5. [Environment Variables](#environment-variables)
6. [Health Checks](#health-checks)
7. [Monitoring](#monitoring)

## Local Development

### Prerequisites

- Go 1.22+
- PostgreSQL 15+
- Redis 7+

### Quick Start

1. **Start dependencies**:
   ```bash
   docker run -d --name postgres -p 5432:5432 \
     -e POSTGRES_PASSWORD=postgres postgres:15-alpine

   docker run -d --name redis -p 6379:6379 redis:7-alpine
   ```

2. **Set environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run the application**:
   ```bash
   make run
   # or with hot reload
   make dev
   ```

### Using Docker Compose

```bash
# Start all services
make docker-run

# Stop all services
make docker-stop

# Clean up (including volumes)
make docker-clean
```

## Docker Deployment

### Build the Image

```bash
docker build -t go-fullstack-backend:1.0.0 .
```

### Run with Docker

```bash
docker run -d \
  --name backend \
  -p 8080:8080 \
  -e DATABASE_URL="postgres://user:pass@host:5432/todos?sslmode=disable" \
  -e REDIS_URL="redis://host:6379/0" \
  -e GIN_MODE="release" \
  --restart unless-stopped \
  go-fullstack-backend:1.0.0
```

### Push to Registry

```bash
# Tag for registry
docker tag go-fullstack-backend:1.0.0 your-registry.com/go-fullstack-backend:1.0.0

# Push to registry
docker push your-registry.com/go-fullstack-backend:1.0.0
```

## Kubernetes Deployment

### Create Secrets

```bash
kubectl create secret generic backend-secrets \
  --from-literal=database-url='postgres://user:pass@postgres:5432/todos?sslmode=require' \
  --from-literal=redis-url='redis://redis:6379/0'
```

### Deployment Manifest

Create `k8s-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: go-backend
  labels:
    app: go-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: go-backend
  template:
    metadata:
      labels:
        app: go-backend
    spec:
      containers:
      - name: backend
        image: your-registry.com/go-fullstack-backend:1.0.0
        ports:
        - containerPort: 8080
          name: http
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: backend-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: backend-secrets
              key: redis-url
        - name: PORT
          value: "8080"
        - name: GIN_MODE
          value: "release"
        resources:
          requests:
            memory: "64Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 30
          timeoutSeconds: 5
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 10
          timeoutSeconds: 3
---
apiVersion: v1
kind: Service
metadata:
  name: go-backend
spec:
  selector:
    app: go-backend
  ports:
  - port: 80
    targetPort: 8080
    protocol: TCP
  type: LoadBalancer
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: go-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: go-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Deploy to Kubernetes

```bash
# Apply the deployment
kubectl apply -f k8s-deployment.yaml

# Check status
kubectl get pods -l app=go-backend
kubectl get svc go-backend

# View logs
kubectl logs -l app=go-backend --tail=100 -f
```

## AWS ECS Deployment

### Prerequisites

- AWS CLI configured
- ECR repository created
- ECS cluster created

### Push to ECR

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag and push
docker tag go-fullstack-backend:1.0.0 \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/go-backend:1.0.0

docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/go-backend:1.0.0
```

### Task Definition

Create `task-definition.json`:

```json
{
  "family": "go-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/go-backend:1.0.0",
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "PORT",
          "value": "8080"
        },
        {
          "name": "GIN_MODE",
          "value": "release"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:backend/database-url"
        },
        {
          "name": "REDIS_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:backend/redis-url"
        }
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      },
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/go-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Deploy to ECS

```bash
# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create or update service
aws ecs create-service \
  --cluster production \
  --service-name go-backend \
  --task-definition go-backend:1 \
  --desired-count 3 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=backend,containerPort=8080"
```

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@host:5432/todos?sslmode=require` |
| `REDIS_URL` | Redis connection string | `redis://:password@host:6379/0` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP server port | `8080` |
| `GIN_MODE` | Gin mode (debug/release) | `release` |

### Security Best Practices

1. **Never commit secrets** to version control
2. **Use secret managers** in production (AWS Secrets Manager, HashiCorp Vault)
3. **Enable SSL/TLS** for database connections (`sslmode=require`)
4. **Use environment-specific** secrets (dev, staging, prod)
5. **Rotate secrets** regularly

## Health Checks

The `/health` endpoint provides:

- **HTTP 200**: All services healthy
- **HTTP 503**: One or more services unhealthy

### Response Format

```json
{
  "status": "healthy",
  "services": {
    "database": "healthy",
    "redis": "healthy"
  },
  "time": "2024-01-15T10:30:00Z"
}
```

### Load Balancer Configuration

#### AWS ALB Target Group

```bash
# Health check configuration
Protocol: HTTP
Path: /health
Port: 8080
Healthy threshold: 2
Unhealthy threshold: 3
Timeout: 5 seconds
Interval: 30 seconds
Success codes: 200
```

#### Kubernetes Probes

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10
```

## Monitoring

### Metrics to Monitor

1. **Application Metrics**
   - Request rate (requests/second)
   - Response time (p50, p95, p99)
   - Error rate (4xx, 5xx)
   - Cache hit rate

2. **Infrastructure Metrics**
   - CPU utilization
   - Memory usage
   - Network I/O
   - Disk I/O

3. **Database Metrics**
   - Connection pool usage
   - Query performance
   - Slow queries

4. **Redis Metrics**
   - Memory usage
   - Cache hit rate
   - Key eviction rate

### Logging

The application logs to stdout in the following format:

```
2024/01/15 10:30:00 Initializing database connection...
2024/01/15 10:30:00 Database connection pool established
2024/01/15 10:30:00 Redis connection established
2024/01/15 10:30:00 Starting server on port 8080...
[GIN] 2024/01/15 - 10:30:15 | 200 |   2.3ms | 10.0.0.1 | GET "/api/todos"
```

### Log Aggregation

#### CloudWatch Logs (AWS)

```bash
aws logs tail /ecs/go-backend --follow
```

#### ELK Stack

Configure Filebeat to ship logs to Elasticsearch:

```yaml
filebeat.inputs:
- type: container
  paths:
    - '/var/lib/docker/containers/*/*.log'
  processors:
  - add_kubernetes_metadata:
      host: ${NODE_NAME}
      matchers:
      - logs_path:
          logs_path: "/var/lib/docker/containers/"

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
```

## Performance Tuning

### Connection Pools

#### PostgreSQL

```go
config.MaxConns = 25        // Maximum connections
config.MinConns = 5         // Minimum idle connections
config.MaxConnLifetime = 1h // Connection lifetime
config.MaxConnIdleTime = 30m // Idle connection timeout
```

#### Redis

```go
opts.PoolSize = 10      // Connection pool size
opts.MinIdleConns = 5   // Minimum idle connections
opts.MaxRetries = 3     // Retry failed commands
```

### Caching Strategy

- List endpoint cached for 60 seconds
- Cache invalidation on create/update/delete
- X-Cache header indicates hit/miss

### Resource Limits

#### Kubernetes

```yaml
resources:
  requests:
    memory: "64Mi"
    cpu: "100m"
  limits:
    memory: "256Mi"
    cpu: "500m"
```

#### ECS

```json
"cpu": "256",
"memory": "512"
```

## Troubleshooting

### Common Issues

1. **Database connection timeout**
   - Check network connectivity
   - Verify database credentials
   - Check security group rules

2. **Redis connection failed**
   - Verify Redis is running
   - Check Redis URL format
   - Confirm network access

3. **High memory usage**
   - Check connection pool sizes
   - Monitor goroutine leaks
   - Review cache configuration

4. **Slow queries**
   - Add database indexes
   - Optimize query patterns
   - Enable query logging

### Debug Mode

Enable debug mode for verbose logging:

```bash
export GIN_MODE=debug
```

### Health Check Debugging

```bash
# Check health endpoint
curl http://localhost:8080/health | jq

# Check with timeout
curl --max-time 5 http://localhost:8080/health
```

## Rollback Procedures

### Kubernetes

```bash
# Rollback to previous version
kubectl rollout undo deployment/go-backend

# Rollback to specific revision
kubectl rollout undo deployment/go-backend --to-revision=2

# Check rollout status
kubectl rollout status deployment/go-backend
```

### ECS

```bash
# Update service to previous task definition
aws ecs update-service \
  --cluster production \
  --service go-backend \
  --task-definition go-backend:1
```

### Docker

```bash
# Stop current container
docker stop backend

# Start previous version
docker run -d --name backend \
  -p 8080:8080 \
  -e DATABASE_URL="..." \
  -e REDIS_URL="..." \
  go-fullstack-backend:0.9.0
```

## Backup and Recovery

### Database Backups

```bash
# Create backup
pg_dump -h localhost -U postgres todos > backup.sql

# Restore backup
psql -h localhost -U postgres todos < backup.sql
```

### Redis Persistence

Enable RDB snapshots in redis.conf:

```
save 900 1
save 300 10
save 60 10000
```

## Security Checklist

- [ ] Environment variables stored securely
- [ ] Database uses SSL/TLS
- [ ] Redis uses authentication
- [ ] Container runs as non-root user
- [ ] Secrets not in Docker images
- [ ] Network policies configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] SQL injection protection verified
- [ ] CORS properly configured
- [ ] Security headers set
- [ ] Dependencies regularly updated

## Support

For issues and questions:
- Check the [README](README.md)
- Review application logs
- Check health endpoint
- Open an issue on GitHub
