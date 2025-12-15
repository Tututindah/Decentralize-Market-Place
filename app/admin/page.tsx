'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/app/src/components/ThemeProvider';
import Header from '@/app/src/components/Header';
import { Footer } from '@/app/src/components/Footer';
import { ADMIN_CONFIG, getArbiterAddress } from '@/app/src/config/admin.config';
import { supabase } from '@/app/src/lib/supabase';
import type { Database } from '@/app/src/lib/database.types';

type Escrow = Database['public']['Tables']['escrows']['Row'];

interface EscrowStats {
  total: number;
  created: number;
  locked: number;
  released: number;
  disputed: number;
  refunded: number;
}

interface PlatformStats {
  totalUsers: number;
  totalJobs: number;
  totalEscrows: number;
  totalVolume: number;
  activeDisputes: number;
}

export default function AdminDashboard() {
  const { isDarkMode } = useTheme()
  const [escrowStats, setEscrowStats] = useState<EscrowStats>({
    total: 0,
    created: 0,
    locked: 0,
    released: 0,
    disputed: 0,
    refunded: 0,
  });

  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    totalUsers: 0,
    totalJobs: 0,
    totalEscrows: 0,
    totalVolume: 0,
    activeDisputes: 0,
  });

  const [disputedEscrows, setDisputedEscrows] = useState<Escrow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  async function fetchAdminStats() {
    try {
      setLoading(true);

      // Fetch escrow statistics
      const { data, error: escrowError } = await supabase
        .from('escrows')
        .select('*');

      if (escrowError) throw escrowError;

      const escrows = (data || []) as Escrow[];

      const stats: EscrowStats = {
        total: escrows.length,
        created: escrows.filter(e => e.status === 'CREATED').length,
        locked: escrows.filter(e => e.status === 'LOCKED').length,
        released: escrows.filter(e => e.status === 'RELEASED').length,
        disputed: escrows.filter(e => e.status === 'DISPUTED').length,
        refunded: escrows.filter(e => e.status === 'REFUNDED').length,
      };

      setEscrowStats(stats);

      // Fetch disputed escrows
      const disputed = escrows.filter(e => e.status === 'DISPUTED');
      setDisputedEscrows(disputed);

      // Fetch total users
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Fetch total jobs
      const { count: jobCount } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true });

      // Calculate total volume
      const totalVolume = escrows?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

      setPlatformStats({
        totalUsers: userCount || 0,
        totalJobs: jobCount || 0,
        totalEscrows: escrows?.length || 0,
        totalVolume: totalVolume / 1_000_000, // Convert to USDM
        activeDisputes: stats.disputed,
      });

    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleResolveDispute(escrowId: string, action: 'release' | 'refund') {
    try {
      // In production, this would trigger the actual blockchain transaction
      // with arbiter signature for either release to freelancer or refund to employer

      const newStatus = action === 'release' ? 'RELEASED' : 'REFUNDED';

      const { error } = await (supabase
        .from('escrows') as any)
        .update({ status: newStatus })
        .eq('id', escrowId);

      if (error) throw error;

      alert(`Dispute resolved: ${action}. Transaction would be sent on-chain with arbiter signature.`);
      fetchAdminStats(); // Refresh stats
    } catch (error: any) {
      alert(`Error resolving dispute: ${error.message}`);
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen transition-colors ${
        isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
      }`}>
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-xl">Loading admin dashboard...</div>
        </div>
        <Footer isDarkMode={isDarkMode} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
    }`}>
      <Header />
      <div className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Platform arbitration and management</p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900">Arbiter Address:</p>
            <p className="text-xs font-mono text-blue-700 mt-1 break-all">
              {getArbiterAddress()}
            </p>
          </div>
        </div>

        {/* Platform Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard title="Total Users" value={platformStats.totalUsers} color="blue" />
          <StatCard title="Total Jobs" value={platformStats.totalJobs} color="green" />
          <StatCard title="Total Escrows" value={platformStats.totalEscrows} color="purple" />
          <StatCard
            title="Total Volume"
            value={`${platformStats.totalVolume.toFixed(2)} USDM`}
            color="yellow"
          />
          <StatCard
            title="Active Disputes"
            value={platformStats.activeDisputes}
            color="red"
            highlight={platformStats.activeDisputes > 0}
          />
        </div>

        {/* Escrow Statistics */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Escrow Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <EscrowStatBadge label="Total" value={escrowStats.total} color="gray" />
            <EscrowStatBadge label="Created" value={escrowStats.created} color="blue" />
            <EscrowStatBadge label="Locked" value={escrowStats.locked} color="yellow" />
            <EscrowStatBadge label="Released" value={escrowStats.released} color="green" />
            <EscrowStatBadge label="Disputed" value={escrowStats.disputed} color="red" />
            <EscrowStatBadge label="Refunded" value={escrowStats.refunded} color="orange" />
          </div>
        </div>

        {/* Disputed Escrows */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Disputed Escrows
            {disputedEscrows.length > 0 && (
              <span className="ml-2 text-sm text-red-600">({disputedEscrows.length} active)</span>
            )}
          </h2>

          {disputedEscrows.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No active disputes</p>
              <p className="text-sm mt-2">All escrows are running smoothly!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {disputedEscrows.map((escrow) => (
                <div
                  key={escrow.id}
                  className="border border-red-200 rounded-lg p-6 bg-red-50"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">
                        Escrow #{escrow.id.substring(0, 8)}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Job ID: {escrow.job_id}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-full">
                      DISPUTED
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Employer</p>
                      <p className="text-xs font-mono text-gray-700 truncate">
                        {escrow.employer_id}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Freelancer</p>
                      <p className="text-xs font-mono text-gray-700 truncate">
                        {escrow.freelancer_id}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Amount:</span>{' '}
                      {(escrow.amount / 1_000_000).toFixed(2)} USDM
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Disputed At:</span>{' '}
                      {escrow.disputed_at ? new Date(escrow.disputed_at).toLocaleString() : 'N/A'}
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => handleResolveDispute(escrow.id, 'release')}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                      ✓ Release to Freelancer
                    </button>
                    <button
                      onClick={() => handleResolveDispute(escrow.id, 'refund')}
                      className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                    >
                      ↩ Refund to Employer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Admin Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Configuration</h2>
          <div className="space-y-3">
            <ConfigRow label="Platform Fee" value={`${ADMIN_CONFIG.platformFeePercentage}%`} />
            <ConfigRow
              label="Min Escrow Amount"
              value={`${(ADMIN_CONFIG.minEscrowAmount / 1_000_000).toFixed(2)} USDM`}
            />
            <ConfigRow
              label="Max Escrow Amount"
              value={`${(ADMIN_CONFIG.maxEscrowAmount / 1_000_000).toLocaleString()} USDM`}
            />
            <ConfigRow label="Network" value="Cardano Preprod" />
            <ConfigRow label="Smart Contract Version" value="Plutus V3" />
          </div>
        </div>
      </div>
      </div>
      <Footer isDarkMode={isDarkMode} />
    </div>
  );
}

function StatCard({ title, value, color, highlight }: {
  title: string;
  value: string | number;
  color: string;
  highlight?: boolean;
}) {
  const colors = {
    blue: 'bg-blue-100 text-blue-900 border-blue-200',
    green: 'bg-green-100 text-green-900 border-green-200',
    purple: 'bg-purple-100 text-purple-900 border-purple-200',
    yellow: 'bg-yellow-100 text-yellow-900 border-yellow-200',
    red: 'bg-red-100 text-red-900 border-red-200',
  };

  const highlightClass = highlight ? 'ring-4 ring-red-400 animate-pulse' : '';

  return (
    <div className={`${colors[color as keyof typeof colors]} border rounded-lg p-6 ${highlightClass}`}>
      <p className="text-sm font-medium opacity-80 mb-2">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

function EscrowStatBadge({ label, value, color }: {
  label: string;
  value: number;
  color: string;
}) {
  const colors = {
    gray: 'bg-gray-100 text-gray-800 border-gray-300',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
  };

  return (
    <div className={`${colors[color as keyof typeof colors]} border rounded-lg p-4 text-center`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium mt-1">{label}</p>
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
      <span className="text-gray-700 font-medium">{label}</span>
      <span className="text-gray-900 font-semibold">{value}</span>
    </div>
  );
}

