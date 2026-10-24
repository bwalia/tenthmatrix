{{/*
Expand the name of the chart.
*/}}
{{- define "registry10x.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "registry10x.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "registry10x.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "registry10x.labels" -}}
helm.sh/chart: {{ include "registry10x.chart" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: registry10x
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
{{- end }}

{{/*
Registry selector labels
*/}}
{{- define "registry10x.registry.selectorLabels" -}}
app.kubernetes.io/name: {{ include "registry10x.name" . }}-registry
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: registry
{{- end }}

{{/*
Registry labels
*/}}
{{- define "registry10x.registry.labels" -}}
{{ include "registry10x.labels" . }}
{{ include "registry10x.registry.selectorLabels" . }}
{{- end }}

{{/*
Auth selector labels
*/}}
{{- define "registry10x.auth.selectorLabels" -}}
app.kubernetes.io/name: {{ include "registry10x.name" . }}-auth
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: auth
{{- end }}

{{/*
Auth labels
*/}}
{{- define "registry10x.auth.labels" -}}
{{ include "registry10x.labels" . }}
{{ include "registry10x.auth.selectorLabels" . }}
{{- end }}

{{/*
Service account name
*/}}
{{- define "registry10x.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "registry10x.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Registry image
*/}}
{{- define "registry10x.registry.image" -}}
{{- $tag := default .Chart.AppVersion .Values.registry.image.tag -}}
{{- printf "%s:%s" .Values.registry.image.repository $tag }}
{{- end }}

{{/*
Auth image
*/}}
{{- define "registry10x.auth.image" -}}
{{- $tag := default .Chart.AppVersion .Values.auth.image.tag -}}
{{- printf "%s:%s" .Values.auth.image.repository $tag }}
{{- end }}

{{/*
Secret name for JWT signing keys
*/}}
{{- define "registry10x.jwt.secretName" -}}
{{- if .Values.jwt.existingSecret }}
{{- .Values.jwt.existingSecret }}
{{- else }}
{{- printf "%s-jwt" (include "registry10x.fullname" .) }}
{{- end }}
{{- end }}

{{/*
Secret name for S3 credentials
*/}}
{{- define "registry10x.s3.secretName" -}}
{{- if .Values.storage.s3.existingSecret }}
{{- .Values.storage.s3.existingSecret }}
{{- else }}
{{- printf "%s-s3" (include "registry10x.fullname" .) }}
{{- end }}
{{- end }}

{{/*
Secret name for GCS credentials
*/}}
{{- define "registry10x.gcs.secretName" -}}
{{- if .Values.storage.gcs.existingSecret }}
{{- .Values.storage.gcs.existingSecret }}
{{- else }}
{{- printf "%s-gcs" (include "registry10x.fullname" .) }}
{{- end }}
{{- end }}

{{/*
Secret name for Azure credentials
*/}}
{{- define "registry10x.azure.secretName" -}}
{{- if .Values.storage.azure.existingSecret }}
{{- .Values.storage.azure.existingSecret }}
{{- else }}
{{- printf "%s-azure" (include "registry10x.fullname" .) }}
{{- end }}
{{- end }}

{{/*
ConfigMap name
*/}}
{{- define "registry10x.configMapName" -}}
{{- printf "%s-config" (include "registry10x.fullname" .) }}
{{- end }}

{{/*
Upstream registry secret name
*/}}
{{/*
Validate JWT signing key configuration.
Fails the render if no signing key source is configured in production.
*/}}
{{- define "registry10x.jwt.validate" -}}
{{- if and (not .Values.jwt.existingSecret) (not .Values.jwt.signingKey) }}
{{- fail "SECURITY: jwt.existingSecret or jwt.signingKey must be set. Running without real signing keys is not supported. Generate keys with: openssl genrsa -out signing.pem 2048 && openssl rsa -in signing.pem -pubout -out verification.pem" }}
{{- end }}
{{- end }}

{{/*
Postgres (scanner metadata store).
*/}}
{{- define "registry10x.postgres.fullname" -}}
{{- printf "%s-postgres" (include "registry10x.fullname" .) -}}
{{- end }}

{{- define "registry10x.postgres.selectorLabels" -}}
app.kubernetes.io/name: {{ include "registry10x.name" . }}-postgres
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: postgres
{{- end }}

{{- define "registry10x.postgres.labels" -}}
{{ include "registry10x.labels" . }}
{{ include "registry10x.postgres.selectorLabels" . }}
{{- end }}

{{- define "registry10x.postgres.secretName" -}}
{{- if .Values.postgres.existingSecret }}
{{- .Values.postgres.existingSecret }}
{{- else }}
{{- printf "%s-postgres" (include "registry10x.fullname" .) -}}
{{- end }}
{{- end }}

{{/*
Resolve a postgres password. Priority: user-supplied → existing in-cluster
secret → fresh 24-char random. The lookup preserves the generated password
across helm upgrades so the registry doesn't break after re-render.
*/}}
{{- define "registry10x.postgres.password" -}}
{{- if .Values.postgres.password -}}
{{- .Values.postgres.password -}}
{{- else -}}
  {{- $secretName := printf "%s-postgres" (include "registry10x.fullname" .) -}}
  {{- $existing := lookup "v1" "Secret" .Release.Namespace $secretName -}}
  {{- if and $existing $existing.data (index $existing.data "password") -}}
    {{- index $existing.data "password" | b64dec -}}
  {{- else -}}
    {{- randAlphaNum 24 -}}
  {{- end -}}
{{- end -}}
{{- end }}

{{- define "registry10x.scanner.postgresUrl" -}}
{{- $user := .Values.postgres.username | default "registry10x" -}}
{{- $db := .Values.postgres.database | default "registry10x" -}}
{{- $host := printf "%s.%s.svc.cluster.local" (include "registry10x.postgres.fullname" .) .Release.Namespace -}}
{{- printf "postgres://%s:$(REGISTRY10X_POSTGRES_PASSWORD)@%s:5432/%s?sslmode=disable" $user $host $db -}}
{{- end }}

{{/*
Redis (scanner ephemeral result cache).
*/}}
{{- define "registry10x.redis.fullname" -}}
{{- printf "%s-redis" (include "registry10x.fullname" .) -}}
{{- end }}

{{- define "registry10x.redis.selectorLabels" -}}
app.kubernetes.io/name: {{ include "registry10x.name" . }}-redis
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: redis
{{- end }}

{{- define "registry10x.redis.labels" -}}
{{ include "registry10x.labels" . }}
{{ include "registry10x.redis.selectorLabels" . }}
{{- end }}

{{- define "registry10x.scanner.redisUrl" -}}
{{- $host := printf "%s.%s.svc.cluster.local" (include "registry10x.redis.fullname" .) .Release.Namespace -}}
{{- printf "redis://%s:6379" $host -}}
{{- end }}

{{/*
Upstream registry secret name
*/}}
{{- define "registry10x.upstream.secretName" -}}
{{- $fullname := index . 0 -}}
{{- $name := index . 1 -}}
{{- $upstream := index . 2 -}}
{{- if $upstream.existingSecret }}
{{- $upstream.existingSecret }}
{{- else }}
{{- printf "%s-upstream-%s" $fullname ($name | replace "." "-") }}
{{- end }}
{{- end }}
