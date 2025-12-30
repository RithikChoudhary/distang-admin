import { useState, useEffect } from 'react';
import { adminApi } from '../services/api';

interface Stats {
  totalUsers: number;
  totalCouples: number;
  totalMemories: number;
  totalMessages: number;
  activeUsers: number;
  newUsersToday: number;
  newCouplesToday: number;
}

const defaultStats: Stats = {
  totalUsers: 0,
  totalCouples: 0,
  totalMemories: 0,
  totalMessages: 0,
  activeUsers: 0,
  newUsersToday: 0,
  newCouplesToday: 0,
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, healthRes] = await Promise.all([
        adminApi.getStats().catch(() => ({ data: { data: defaultStats } })),
        adminApi.getHealth().catch(() => ({ data: null })),
      ]);
      
      setStats(statsRes.data.data || defaultStats);
      setHealth(healthRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: 'bg-blue-500' },
    { label: 'Total Couples', value: stats.totalCouples, icon: '💕', color: 'bg-pink-500' },
    { label: 'Memories Shared', value: stats.totalMemories, icon: '📸', color: 'bg-purple-500' },
    { label: 'Messages Sent', value: stats.totalMessages, icon: '💬', color: 'bg-green-500' },
    { label: 'Active Today', value: stats.activeUsers, icon: '🟢', color: 'bg-teal-500' },
    { label: 'New Users Today', value: stats.newUsersToday, icon: '✨', color: 'bg-yellow-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500">Overview of your Codex Couples app</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4"
          >
            <div className={`w-14 h-14 ${stat.color} rounded-xl flex items-center justify-center text-2xl`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {stat.value.toLocaleString()}
              </p>
              <p className="text-gray-500 text-sm">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* System Health */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">System Health</h2>
        <div className="flex items-center gap-4">
          <div className={`w-4 h-4 rounded-full ${health ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className={health ? 'text-green-600' : 'text-red-600'}>
            {health ? 'All systems operational' : 'System offline or error'}
          </span>
        </div>
        {health && (
          <div className="mt-4 text-sm text-gray-500">
            <p>Environment: {health.environment}</p>
            <p>Last checked: {new Date(health.timestamp).toLocaleString()}</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => loadData()}
            className="p-4 border rounded-lg hover:bg-gray-50 transition text-left"
          >
            <span className="text-2xl">🔄</span>
            <p className="mt-2 font-medium text-gray-800">Refresh Data</p>
          </button>
          <button className="p-4 border rounded-lg hover:bg-gray-50 transition text-left">
            <span className="text-2xl">📊</span>
            <p className="mt-2 font-medium text-gray-800">Export Report</p>
          </button>
          <button className="p-4 border rounded-lg hover:bg-gray-50 transition text-left">
            <span className="text-2xl">🧹</span>
            <p className="mt-2 font-medium text-gray-800">Clear Cache</p>
          </button>
          <button className="p-4 border rounded-lg hover:bg-gray-50 transition text-left">
            <span className="text-2xl">📧</span>
            <p className="mt-2 font-medium text-gray-800">Send Broadcast</p>
          </button>
        </div>
      </div>
    </div>
  );
}

