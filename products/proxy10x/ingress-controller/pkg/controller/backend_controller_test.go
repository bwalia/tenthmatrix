package controller

import (
	"context"
	"testing"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/tools/record"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"

	proxy10xv1alpha1 "github.com/proxy10x/proxy10x/ingress-controller/pkg/apis/proxy10x/v1alpha1"
)

// mockConfigUpdater is a test double for ConfigUpdater.
type mockConfigUpdater struct {
	updatedBackends map[string]BackendConfig
	deletedBackends []string
}

func newMockConfigUpdater() *mockConfigUpdater {
	return &mockConfigUpdater{
		updatedBackends: make(map[string]BackendConfig),
	}
}

func (m *mockConfigUpdater) UpdateBackend(_ context.Context, name string, config BackendConfig) error {
	m.updatedBackends[name] = config
	return nil
}

func (m *mockConfigUpdater) DeleteBackend(_ context.Context, name string) error {
	m.deletedBackends = append(m.deletedBackends, name)
	return nil
}

func stringPtr(s string) *string {
	return &s
}

func TestMatchesIngressClass(t *testing.T) {
	tests := []struct {
		name              string
		controllerClass   string
		resourceClassName *string
		expected          bool
	}{
		{
			name:              "controller has no class configured - matches everything",
			controllerClass:   "",
			resourceClassName: stringPtr("proxy10x"),
			expected:          true,
		},
		{
			name:              "controller has no class, resource has no class",
			controllerClass:   "",
			resourceClassName: nil,
			expected:          true,
		},
		{
			name:              "resource has no class set - matches any controller",
			controllerClass:   "proxy10x",
			resourceClassName: nil,
			expected:          true,
		},
		{
			name:              "resource has empty class - matches any controller",
			controllerClass:   "proxy10x",
			resourceClassName: stringPtr(""),
			expected:          true,
		},
		{
			name:              "matching ingress class",
			controllerClass:   "proxy10x",
			resourceClassName: stringPtr("proxy10x"),
			expected:          true,
		},
		{
			name:              "non-matching ingress class",
			controllerClass:   "proxy10x",
			resourceClassName: stringPtr("nginx"),
			expected:          false,
		},
		{
			name:              "different controller class - non-matching",
			controllerClass:   "other-controller",
			resourceClassName: stringPtr("proxy10x"),
			expected:          false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := &Proxy10xBackendReconciler{
				IngressClass: tt.controllerClass,
			}
			result := r.matchesIngressClass(tt.resourceClassName)
			if result != tt.expected {
				t.Errorf("matchesIngressClass() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestReconcile_IngressClassFiltering(t *testing.T) {
	scheme := runtime.NewScheme()
	_ = proxy10xv1alpha1.AddToScheme(scheme)

	tests := []struct {
		name            string
		controllerClass string
		backend         *proxy10xv1alpha1.Proxy10xBackend
		expectUpdate    bool
	}{
		{
			name:            "matching class processes the backend",
			controllerClass: "proxy10x",
			backend: &proxy10xv1alpha1.Proxy10xBackend{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-backend",
					Namespace: "default",
				},
				Spec: proxy10xv1alpha1.Proxy10xBackendSpec{
					IngressClassName: stringPtr("proxy10x"),
					Upstreams: []proxy10xv1alpha1.Upstream{
						{Host: "10.0.0.1", Port: 8080},
					},
					LoadBalancing: "round-robin",
				},
			},
			expectUpdate: true,
		},
		{
			name:            "non-matching class skips the backend",
			controllerClass: "proxy10x",
			backend: &proxy10xv1alpha1.Proxy10xBackend{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-backend",
					Namespace: "default",
				},
				Spec: proxy10xv1alpha1.Proxy10xBackendSpec{
					IngressClassName: stringPtr("nginx"),
					Upstreams: []proxy10xv1alpha1.Upstream{
						{Host: "10.0.0.1", Port: 8080},
					},
					LoadBalancing: "round-robin",
				},
			},
			expectUpdate: false,
		},
		{
			name:            "no class on resource is processed",
			controllerClass: "proxy10x",
			backend: &proxy10xv1alpha1.Proxy10xBackend{
				ObjectMeta: metav1.ObjectMeta{
					Name:      "test-backend",
					Namespace: "default",
				},
				Spec: proxy10xv1alpha1.Proxy10xBackendSpec{
					Upstreams: []proxy10xv1alpha1.Upstream{
						{Host: "10.0.0.1", Port: 8080},
					},
					LoadBalancing: "round-robin",
				},
			},
			expectUpdate: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			client := fake.NewClientBuilder().
				WithScheme(scheme).
				WithObjects(tt.backend).
				WithStatusSubresource(tt.backend).
				Build()

			updater := newMockConfigUpdater()
			recorder := record.NewFakeRecorder(10)

			r := &Proxy10xBackendReconciler{
				Client:           client,
				Scheme:           scheme,
				Recorder:         recorder,
				IngressClass:     tt.controllerClass,
				LuaConfigUpdater: updater,
			}

			req := ctrl.Request{
				NamespacedName: types.NamespacedName{
					Name:      tt.backend.Name,
					Namespace: tt.backend.Namespace,
				},
			}

			_, err := r.Reconcile(context.Background(), req)
			if err != nil {
				t.Fatalf("Reconcile() error = %v", err)
			}

			_, updated := updater.updatedBackends[tt.backend.Name]
			if updated != tt.expectUpdate {
				t.Errorf("backend updated = %v, want %v", updated, tt.expectUpdate)
			}
		})
	}
}

func TestReconcile_DeletedBackend(t *testing.T) {
	scheme := runtime.NewScheme()
	_ = proxy10xv1alpha1.AddToScheme(scheme)

	// No backend object exists - simulates deletion
	client := fake.NewClientBuilder().
		WithScheme(scheme).
		Build()

	updater := newMockConfigUpdater()
	recorder := record.NewFakeRecorder(10)

	r := &Proxy10xBackendReconciler{
		Client:           client,
		Scheme:           scheme,
		Recorder:         recorder,
		IngressClass:     "proxy10x",
		LuaConfigUpdater: updater,
	}

	req := ctrl.Request{
		NamespacedName: types.NamespacedName{
			Name:      "deleted-backend",
			Namespace: "default",
		},
	}

	_, err := r.Reconcile(context.Background(), req)
	if err != nil {
		t.Fatalf("Reconcile() error = %v", err)
	}

	if len(updater.deletedBackends) != 1 || updater.deletedBackends[0] != "deleted-backend" {
		t.Errorf("expected deleted-backend to be deleted, got %v", updater.deletedBackends)
	}
}
