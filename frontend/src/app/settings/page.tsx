'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, Button, Badge } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { apiClient, extractErrorMessage } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { User, Shield, Database, LogOut, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  const [backendStatus, setBackendStatus] = useState<'checking' | 'healthy' | 'offline'>('checking');
  const [seedMessage, setSeedMessage] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await apiClient.healthCheck();
        setBackendStatus('healthy');
      } catch {
        setBackendStatus('offline');
      }
    };
    checkHealth();
  }, []);

  const handleSeedCategories = async () => {
    try {
      setIsSeeding(true);
      setSeedMessage(null);
      const res = await apiClient.seedDefaultCategories();
      setSeedMessage(`Successfully initialized ${res.data.length} standard budget & expense categories.`);
    } catch (err) {
      setSeedMessage(extractErrorMessage(err, 'Failed to initialize default categories.'));
    } finally {
      setIsSeeding(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <MainLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div>
          <h1 className="heading-page">Application Settings</h1>
          <p className="text-sm text-finroq-muted mt-1">
            Manage your account identity, system preferences, and financial category initialization.
          </p>
        </div>

        {/* User Identity Profile */}
        <Card className="bg-white border-finroq-border">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-finroq-border">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-finroq-mint rounded-xl text-finroq-forest">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h2 className="heading-card">User Profile</h2>
                <p className="text-xs text-finroq-muted">Authenticated account credentials</p>
              </div>
            </div>
            {isAuthenticated ? (
              <Badge variant="success">Authenticated</Badge>
            ) : (
              <Badge variant="warning">Guest Mode</Badge>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <span className="label-supporting">Full Name</span>
              <p className="font-semibold text-finroq-text mt-0.5">
                {user?.full_name || 'Not provided'}
              </p>
            </div>

            <div>
              <span className="label-supporting">Email Address</span>
              <p className="font-semibold text-finroq-text mt-0.5">
                {user?.email || 'guest@finroq.local'}
              </p>
            </div>

            <div>
              <span className="label-supporting">Account Identifier</span>
              <p className="font-mono text-xs text-finroq-text mt-0.5">
                {user ? `USR-${user.id}` : 'N/A'}
              </p>
            </div>

            <div>
              <span className="label-supporting">Account Status</span>
              <p className="font-semibold text-finroq-positive mt-0.5">
                {user?.is_active ? 'Active & Verified' : 'Standard'}
              </p>
            </div>
          </div>
        </Card>

        {/* Data & System Initialization */}
        <Card className="bg-white border-finroq-border">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-finroq-border">
            <div className="p-3 bg-finroq-sage/50 rounded-xl text-finroq-forest">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h2 className="heading-card">Category Initialization</h2>
              <p className="text-xs text-finroq-muted">Default system taxonomies and categorization</p>
            </div>
          </div>

          <p className="text-sm text-finroq-muted mb-4">
            Pre-populate your tenant with standard financial categories (Groceries, Housing, Utilities, Salary, Investments) for budgeting and transaction tagging.
          </p>

          {seedMessage && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-finroq-positive text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>{seedMessage}</span>
            </div>
          )}

          <Button
            variant="secondary"
            onClick={handleSeedCategories}
            loading={isSeeding}
            disabled={isSeeding}
            className="flex items-center gap-2 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {isSeeding ? 'Initializing...' : 'Seed Default Categories'}
          </Button>
        </Card>

        {/* System & Connectivity Status */}
        <Card className="bg-white border-finroq-border">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-finroq-border">
            <div className="p-3 bg-slate-100 rounded-xl text-slate-700">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h2 className="heading-card">System & Telemetry</h2>
              <p className="text-xs text-finroq-muted">Architecture environment & status</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 text-sm">
            <div>
              <span className="label-supporting">Application</span>
              <p className="font-semibold text-finroq-text mt-0.5">FINROQ v0.1.0</p>
            </div>
            <div>
              <span className="label-supporting">Backend API</span>
              <div className="mt-0.5">
                {backendStatus === 'checking' && <Badge variant="info">Checking...</Badge>}
                {backendStatus === 'healthy' && <Badge variant="success">Online & Connected</Badge>}
                {backendStatus === 'offline' && <Badge variant="danger">Offline / Unreachable</Badge>}
              </div>
            </div>
            <div>
              <span className="label-supporting">Calculations Engine</span>
              <p className="font-semibold text-finroq-positive mt-0.5">Python Decimal Arbitrary Precision</p>
            </div>
          </div>
        </Card>

        {/* Session Security */}
        {isAuthenticated && (
          <Card className="bg-white border-red-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="heading-card text-finroq-negative flex items-center gap-2">
                  <LogOut className="h-5 w-5" />
                  Terminate Session
                </h3>
                <p className="text-xs text-finroq-muted mt-1">
                  Securely clear authentication tokens and log out of FINROQ.
                </p>
              </div>
              <Button
                variant="danger"
                onClick={handleLogout}
                className="self-start sm:self-auto"
              >
                Sign Out
              </Button>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
