import { useEffect, useState } from 'react';
import { adminApi } from '../services/api';
import { format } from 'date-fns';

interface LogEntry {
  method: string;
  url: string;
  status: number;
  duration: number;
  ip: string;
  timestamp: string;
  userAgent?: string;
}

interface Stats {
  total: number;
  errors: number;
  errorRate: string;
  avgDuration: number;
  topEndpoints: Array<{
    endpoint: string;
    count: number;
    errors: number;
    avgDuration: number;
  }>;
}

export default function ApiLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'errors' | 'slow'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadLogs();
    
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(loadLogs, 5000); // Refresh every 5 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadLogs = async () => {
    try {
      const res = await adminApi.getApiLogs(500);
      setLogs(res.data.data.logs);
      setStats(res.data.data.stats);
    } catch (error) {
      console.error('Failed to load API logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 500) return 'text-red-400 bg-red-500/20';
    if (status >= 400) return 'text-orange-400 bg-orange-500/20';
    if (status >= 300) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-green-400 bg-green-500/20';
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-blue-400';
      case 'POST': return 'text-green-400';
      case 'PUT': return 'text-yellow-400';
      case 'PATCH': return 'text-orange-400';
      case 'DELETE': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'errors') return log.status >= 400;
    if (filter === 'slow') return log.duration > 1000;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">API Monitoring</h1>
          <p className="text-gray-400 mt-1">Real-time API request logs and performance metrics</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-gray-300">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 rounded bg-gray-700 border-gray-600"
            />
            Auto-refresh
          </label>
          <button
            onClick={loadLogs}
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <p className="text-gray-400 text-sm">Total Requests</p>
          <p className="text-3xl font-bold text-white mt-1">{stats?.total || 0}</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <p className="text-gray-400 text-sm">Errors</p>
          <p className="text-3xl font-bold text-red-400 mt-1">{stats?.errors || 0}</p>
          <p className="text-gray-500 text-sm">{stats?.errorRate}</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <p className="text-gray-400 text-sm">Avg Response Time</p>
          <p className="text-3xl font-bold text-blue-400 mt-1">{stats?.avgDuration || 0}ms</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <p className="text-gray-400 text-sm">Status</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-2xl font-bold text-green-400">Live</span>
          </div>
        </div>
      </div>

      {/* Top Endpoints */}
      {stats?.topEndpoints && stats.topEndpoints.length > 0 && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Top Endpoints</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm">
                  <th className="pb-3">Endpoint</th>
                  <th className="pb-3">Requests</th>
                  <th className="pb-3">Errors</th>
                  <th className="pb-3">Avg Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {stats.topEndpoints.map((ep, i) => (
                  <tr key={i}>
                    <td className="py-2 font-mono text-sm text-white">{ep.endpoint}</td>
                    <td className="py-2 text-gray-300">{ep.count}</td>
                    <td className="py-2">
                      <span className={ep.errors > 0 ? 'text-red-400' : 'text-gray-500'}>
                        {ep.errors}
                      </span>
                    </td>
                    <td className="py-2">
                      <span className={ep.avgDuration > 500 ? 'text-orange-400' : 'text-green-400'}>
                        {Math.round(ep.avgDuration)}ms
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'errors', 'slow'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg capitalize transition-colors ${
              filter === f
                ? 'bg-violet-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {f === 'slow' ? 'Slow (>1s)' : f}
          </button>
        ))}
      </div>

      {/* Logs Table */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50 sticky top-0">
              <tr className="text-left text-gray-400 text-sm">
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Endpoint</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 font-mono text-sm">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No logs found
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, i) => (
                  <tr key={i} className="hover:bg-gray-700/30">
                    <td className="px-4 py-2 text-gray-400">
                      {format(new Date(log.timestamp), 'HH:mm:ss')}
                    </td>
                    <td className={`px-4 py-2 font-semibold ${getMethodColor(log.method)}`}>
                      {log.method}
                    </td>
                    <td className="px-4 py-2 text-white truncate max-w-[300px]" title={log.url}>
                      {log.url}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className={`px-4 py-2 ${log.duration > 500 ? 'text-orange-400' : 'text-gray-300'}`}>
                      {log.duration}ms
                    </td>
                    <td className="px-4 py-2 text-gray-500 truncate max-w-[120px]" title={log.ip}>
                      {log.ip}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

