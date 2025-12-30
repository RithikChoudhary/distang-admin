import { useEffect, useState } from 'react';
import { adminApi } from '../services/api';
import { format } from 'date-fns';

interface SystemHealth {
  server: {
    status: string;
    uptime: number;
    nodeVersion: string;
    environment: string;
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
  };
  database: {
    status: string;
    name: string;
    host: string;
    collections: {
      users: number;
      couples: number;
      messages: number;
      memories: number;
    };
    size: number;
    storageSize: number;
  };
  timestamp: string;
}

export default function System() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadHealth = async () => {
    try {
      const res = await adminApi.getSystemHealth();
      setHealth(res.data.data);
    } catch (error) {
      console.error('Failed to load system health:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return bytes + ' B';
  };

  const exportData = async (type: 'users' | 'couples' | 'messages' | 'memories') => {
    try {
      setExporting(type);
      const res = await adminApi.exportData(type);
      const data = res.data.data;
      
      // Create and download JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `distang-${type}-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-500 border-t-transparent"></div>
      </div>
    );
  }

  const memoryPercent = health?.server.memoryUsage
    ? ((health.server.memoryUsage.heapUsed / health.server.memoryUsage.heapTotal) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">System Health</h1>
          <p className="text-gray-400 mt-1">Monitor server status and database health</p>
        </div>
        <button
          onClick={loadHealth}
          className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400">Server Status</span>
            <span className={`w-3 h-3 rounded-full ${health?.server.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></span>
          </div>
          <p className="text-2xl font-bold text-green-400 capitalize">{health?.server.status}</p>
          <p className="text-gray-500 text-sm mt-1">Uptime: {formatUptime(health?.server.uptime || 0)}</p>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400">Database</span>
            <span className={`w-3 h-3 rounded-full ${health?.database.status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></span>
          </div>
          <p className="text-2xl font-bold text-blue-400 capitalize">{health?.database.status}</p>
          <p className="text-gray-500 text-sm mt-1">{health?.database.host}</p>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400">Memory Usage</span>
          </div>
          <p className="text-2xl font-bold text-white">{memoryPercent}%</p>
          <div className="mt-2 bg-gray-700 rounded-full h-2">
            <div
              className="bg-violet-500 h-2 rounded-full transition-all"
              style={{ width: `${memoryPercent}%` }}
            ></div>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            {formatBytes(health?.server.memoryUsage?.heapUsed || 0)} / {formatBytes(health?.server.memoryUsage?.heapTotal || 0)}
          </p>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400">Environment</span>
          </div>
          <p className="text-2xl font-bold text-white capitalize">{health?.server.environment}</p>
          <p className="text-gray-500 text-sm mt-1">Node {health?.server.nodeVersion}</p>
        </div>
      </div>

      {/* Database Stats */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <h2 className="text-xl font-bold text-white mb-4">Database Collections</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{health?.database.collections.users.toLocaleString()}</p>
                <p className="text-gray-400 text-sm">Users</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{health?.database.collections.couples.toLocaleString()}</p>
                <p className="text-gray-400 text-sm">Couples</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{health?.database.collections.messages.toLocaleString()}</p>
                <p className="text-gray-400 text-sm">Messages</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{health?.database.collections.memories.toLocaleString()}</p>
                <p className="text-gray-400 text-sm">Memories</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Database size: <span className="text-white">{formatBytes(health?.database.size || 0)}</span>
            {' • '}
            Storage: <span className="text-white">{formatBytes(health?.database.storageSize || 0)}</span>
          </div>
          <p className="text-sm text-gray-500">
            Last updated: {health?.timestamp ? format(new Date(health.timestamp), 'h:mm:ss a') : '-'}
          </p>
        </div>
      </div>

      {/* Data Export */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <h2 className="text-xl font-bold text-white mb-2">Data Export</h2>
        <p className="text-gray-400 mb-4">Export data for backup or compliance purposes</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['users', 'couples', 'messages', 'memories'] as const).map((type) => (
            <button
              key={type}
              onClick={() => exportData(type)}
              disabled={exporting !== null}
              className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors capitalize"
            >
              {exporting === type ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              Export {type}
            </button>
          ))}
        </div>
      </div>

      {/* Server Info */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <h2 className="text-xl font-bold text-white mb-4">Server Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">Node.js Version</span>
              <span className="text-white font-mono">{health?.server.nodeVersion}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">Environment</span>
              <span className="text-white capitalize">{health?.server.environment}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">Uptime</span>
              <span className="text-white">{formatUptime(health?.server.uptime || 0)}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">Heap Used</span>
              <span className="text-white">{formatBytes(health?.server.memoryUsage?.heapUsed || 0)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">Heap Total</span>
              <span className="text-white">{formatBytes(health?.server.memoryUsage?.heapTotal || 0)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">RSS Memory</span>
              <span className="text-white">{formatBytes(health?.server.memoryUsage?.rss || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

