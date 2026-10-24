# Proxy10x Ingress Controller - Quick Start Guide

This guide will help you get Proxy10x Ingress Controller up and running in minutes.

## Prerequisites

- Kubernetes cluster 1.20+ (or kind/k3s/minikube for testing)
- kubectl configured
- Helm 3+ installed
- Docker (for building images)

## Option 1: Quick Test with kind

The fastest way to test Proxy10x Ingress Controller:

```bash
# Clone the repository
cd ingress-controller

# Create kind cluster and deploy
make quick-test

# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=proxy10x -n proxy10x-system --timeout=300s

# Check status
kubectl get pods -n proxy10x-system
```

## Option 2: Deploy to a Remote K3s Cluster

If you have a remote K3s cluster, point kubectl at it first:

```bash
# Set your kubeconfig to the remote K3s cluster
export KUBECONFIG=~/.kube/k3s-<your-server>.yaml

# Verify connectivity
kubectl get nodes
```

Then follow the build and deploy steps below.

## Option 3: Build and Deploy from Source

### Step 1: Build the Images

```bash
cd ingress-controller

# Build both controller and OpenResty images
make docker-build

# Or build and push to registry
make docker-buildx TAG=1.0.0
```

### Step 2: Install CRDs

```bash
# Install the Proxy10x Custom Resource Definitions
kubectl apply -f deploy/crds/
```

### Step 3: Deploy with Helm

The default install works out of the box (ServiceMonitor is disabled by default):

```bash
helm install proxy10x deploy/helm/ \
  --namespace proxy10x-system \
  --create-namespace
```

**Optional: Enable Prometheus ServiceMonitor**

If you want metrics scraping via Prometheus Operator, first install the CRD:

**Option A — Install just the CRD (lightweight):**

```bash
kubectl apply -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/main/example/prometheus-operator-crd/monitoring.coreos.com_servicemonitors.yaml

helm install proxy10x deploy/helm/ \
  --namespace proxy10x-system \
  --create-namespace \
  --set observability.prometheus.serviceMonitor.enabled=true
```

**Option B — Install the full Prometheus stack:**

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install kube-prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace

helm install proxy10x deploy/helm/ \
  --namespace proxy10x-system \
  --create-namespace \
  --set observability.prometheus.serviceMonitor.enabled=true
```

### Step 4: Verify Installation

```bash
# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=proxy10x-ingress-controller \
  -n proxy10x-system --timeout=300s

# Check pods
kubectl get pods -n proxy10x-system
```

Expected output:
```
NAME                                              READY   STATUS    RESTARTS   AGE
proxy10x-controller-xxxxxxxxx-xxxxx               1/1     Running   0          30s
proxy10x-controller-xxxxxxxxx-xxxxx               1/1     Running   0          30s
proxy10x-openresty-xxxxxxxxx-xxxxx                1/1     Running   0          30s
proxy10x-openresty-xxxxxxxxx-xxxxx                1/1     Running   0          30s
proxy10x-openresty-xxxxxxxxx-xxxxx                1/1     Running   0          30s
```

If pods are not starting, check events:

```bash
kubectl get events -n proxy10x-system --sort-by='.lastTimestamp'
kubectl describe pod -n proxy10x-system -l app.kubernetes.io/name=proxy10x-ingress-controller
```

## Step 5: Create Your First Backend

Create a file `my-backend.yaml`:

```yaml
apiVersion: proxy10x.io/v1alpha1
kind: Proxy10xBackend
metadata:
  name: echo-backend
  namespace: default
spec:
  upstreams:
    - host: echo-server.default.svc.cluster.local
      port: 8080
      weight: 1
  loadBalancing: round-robin
  healthCheck:
    enabled: true
    path: /health
    interval: 5
    timeout: 3
    expectedStatus: 200
```

Apply it:

```bash
kubectl apply -f my-backend.yaml

# Check backend status
kubectl get proxy10xbackend echo-backend -o yaml
```

## Step 6: Deploy a Test Application

```bash
# Deploy echo server for testing
kubectl create deployment echo-server --image=ealen/echo-server:latest
kubectl expose deployment echo-server --port=8080

# Wait for it to be ready
kubectl wait --for=condition=ready pod -l app=echo-server --timeout=60s
```

## Step 7: Create a Route (Optional)

For more advanced routing, create a Proxy10xRoute:

```yaml
apiVersion: proxy10x.io/v1alpha1
kind: Proxy10xRoute
metadata:
  name: echo-route
  namespace: default
spec:
  host: echo.local
  paths:
    - path: /
      pathType: Prefix
      backend:
        name: echo-backend
  rateLimit:
    requestsPerSecond: 100
    burst: 20
```

Apply it:

```bash
kubectl apply -f my-route.yaml
```

## Step 8: Test the Ingress

```bash
# Get the LoadBalancer IP (or NodePort in kind)
export INGRESS_IP=$(kubectl get svc proxy10x-openresty -n proxy10x-system -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# If using NodePort (kind/minikube/k3s without LB):
export INGRESS_PORT=$(kubectl get svc proxy10x-openresty -n proxy10x-system -o jsonpath='{.spec.ports[0].nodePort}')
export INGRESS_HOST=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[0].address}')

# Test the endpoint
curl -H "Host: echo.local" http://$INGRESS_IP/
# or with NodePort:
curl -H "Host: echo.local" http://$INGRESS_HOST:$INGRESS_PORT/
```

## Using Standard Ingress Resources

Proxy10x is compatible with standard Kubernetes Ingress resources:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: echo-ingress
  annotations:
    proxy10x.io/load-balancing: "round-robin"
    proxy10x.io/rate-limit: "100"
spec:
  ingressClassName: proxy10x
  rules:
    - host: echo.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: echo-server
                port:
                  number: 8080
```

## Helm Values Reference

Key values you can override with `--set`:

| Value | Default | Description |
|-------|---------|-------------|
| `controller.replicas` | `1` | Number of controller replicas |
| `controller.image.tag` | `latest` | Controller image tag |
| `openresty.replicas` | `3` | Number of OpenResty proxy replicas |
| `openresty.image.tag` | `latest` | OpenResty image tag |
| `openresty.useBuiltinConfig` | `true` | Use image's built-in nginx.conf (recommended) |
| `openresty.service.type` | `LoadBalancer` | Service type (`LoadBalancer`, `NodePort`, `ClusterIP`) |
| `openresty.autoscaling.enabled` | `true` | Enable HPA |
| `observability.prometheus.enabled` | `true` | Enable Prometheus metrics |
| `observability.prometheus.serviceMonitor.enabled` | `false` | Create ServiceMonitor CRs (requires Prometheus Operator) |
| `certManager.enabled` | `false` | Enable cert-manager integration (creates self-signed cert when disabled) |
| `ingressClass.isDefaultClass` | `false` | Make Proxy10x the default ingress class |

## Monitoring

### View Controller Logs

```bash
kubectl logs -n proxy10x-system -l app.kubernetes.io/component=controller -f
```

### View OpenResty Logs

```bash
kubectl logs -n proxy10x-system -l app.kubernetes.io/component=proxy -f
```

### Access Prometheus Metrics

```bash
# Controller metrics
kubectl port-forward -n proxy10x-system svc/proxy10x-controller-metrics 8080:8080
curl http://localhost:8080/metrics

# OpenResty metrics
kubectl port-forward -n proxy10x-system svc/proxy10x-openresty 9145:9145
curl http://localhost:9145/metrics
```

## Troubleshooting

### ServiceMonitor CRD Error

```
no matches for kind "ServiceMonitor" in version "monitoring.coreos.com/v1"
```

You enabled `observability.prometheus.serviceMonitor.enabled=true` but your cluster doesn't have the Prometheus Operator CRDs. Either:
- Remove the `--set` to use the default (`false`)
- Or install the CRD first: `kubectl apply -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/main/example/prometheus-operator-crd/monitoring.coreos.com_servicemonitors.yaml`

### Check Controller Status

```bash
kubectl get pods -n proxy10x-system
kubectl logs -n proxy10x-system -l app.kubernetes.io/component=controller
```

### Check Backend Health

```bash
# View backend status
kubectl get proxy10xbackend -A

# Describe backend for details
kubectl describe proxy10xbackend echo-backend

# Check OpenResty API
kubectl port-forward -n proxy10x-system svc/proxy10x-openresty 8080:8080
curl http://localhost:8080/api/internal/backends
```

### Common Issues

**Issue: Pods not starting**

```bash
# Check events
kubectl get events -n proxy10x-system --sort-by='.lastTimestamp'

# Check pod describe
kubectl describe pod -n proxy10x-system <pod-name>
```

**Issue: Backend not updating**

```bash
# Check controller logs
kubectl logs -n proxy10x-system -l app.kubernetes.io/component=controller

# Verify API connectivity
kubectl exec -n proxy10x-system deploy/proxy10x-controller -- \
  curl http://proxy10x-openresty:8080/healthz
```

**Issue: LoadBalancer pending (K3s / bare metal)**

K3s includes ServiceLB (formerly Klipper) by default. If `EXTERNAL-IP` stays `<pending>`:

```bash
# Check if ServiceLB is running
kubectl get pods -n kube-system -l app=svclb-proxy10x-openresty

# Alternatively, switch to NodePort
helm upgrade proxy10x deploy/helm/ \
  --namespace proxy10x-system \
  --set openresty.service.type=NodePort
```

## Upgrade

```bash
helm upgrade proxy10x deploy/helm/ \
  --namespace proxy10x-system \
  --set controller.image.tag=latest \
  --set openresty.image.tag=latest
```

## Cleanup

```bash
# Delete all resources
helm uninstall proxy10x -n proxy10x-system
kubectl delete namespace proxy10x-system
kubectl delete -f deploy/crds/

# Or with kind cluster
make quick-cleanup
```

## Next Steps

1. Read the [full documentation](./README.md)
2. Explore [advanced features](./docs/examples/)
3. Set up [cert-manager integration](./docs/cert-manager.md)
4. Configure [observability](./docs/observability.md)

## Getting Help

- GitHub Issues: https://github.com/bwalia/tenthmatrix/issues
- Documentation: https://docs.proxy10x.com
- Examples: [./docs/examples/](./docs/examples/)
