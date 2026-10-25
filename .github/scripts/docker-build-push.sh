#!/usr/bin/env bash
# Build and push an image, tagged <tag> and latest.
#   docker-build-push.sh <dockerfile> <context> <image> <tag> [--pull]
# On the k3s1 ARC runners it builds on the shared BuildKit server
# (diy-tax-return-infra clusters/k3s/ci-runners/buildkit.yaml), whose layer cache
# survives ephemeral runners; elsewhere it falls back to plain docker build/push.
# Expects `docker login` to have been done already (buildx forwards the creds).
set -euo pipefail
dockerfile=$1 context=$2 image=$3 tag=$4 pull=${5:-}
BUILDKIT=tcp://buildkitd.arc-runners.svc.cluster.local:1234
if getent hosts buildkitd.arc-runners.svc.cluster.local >/dev/null 2>&1; then
  docker buildx inspect k3s-buildkit >/dev/null 2>&1 || docker buildx create --name k3s-buildkit --driver remote "$BUILDKIT" >/dev/null
  echo "Building on shared BuildKit ($BUILDKIT)"
  docker buildx build --builder k3s-buildkit ${pull:+--pull} -f "$dockerfile" \
    -t "$image:$tag" -t "$image:latest" --push "$context"
else
  echo "Building with the local docker daemon"
  docker build ${pull:+--pull} -f "$dockerfile" -t "$image:$tag" "$context"
  docker tag "$image:$tag" "$image:latest"
  docker push "$image:$tag"
  docker push "$image:latest"
fi
echo "Pushed $image:$tag and latest"
