import { useEffect, useState } from 'react';
import { adminApi } from '../services/api';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface Stats {
  overview: {
    totalUsers: number;
    totalCouples: number;
    totalMemories: number;
    totalMessages: number;
    verifiedUsers: number;
    verificationRate: string;
  };
  activity: {
    activeUsers24h: number;
    activeUsers1h: number;
    messagesWeek: number;
    memoriesWeek: number;
    avgMessagesPerDay: number;
  };
  growth: {
    newUsersToday: number;
    newUsersYesterday: number;
    newUsersWeek: number;
    newUsersMonth: number;
    newCouplesToday: number;
    userGrowthRate: string;
  };
  messageTypes: Record<string, number>;
}

interface Analytics {
  userSignups: { _id: string; count: number }[];
  couplesFormed: { _id: string; count: number }[];
  messagesPerDay: { _id: string; count: number }[];
  activeUsersPerDay: { _id: string; count: number }[];
  retention: {
    thisWeekActive: number;
    lastWeekActive: number;
    retentionRate: string;
  };
}

interface Activity {
  type: string;
  icon: string;
  message: string;
  timestamp: string;
  data: any;
}

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Load stats first (most important)
      const statsRes = await adminApi.getStats();
      setStats(statsRes.data.data);
      
      // Then load analytics and activity (these might fail on new deployments)
      try {
        const [analyticsRes, activityRes] = await Promise.all([
          adminApi.getAnalytics(timeRange),
          adminApi.getActivityFeed(20),
        ]);
        setAnalytics(analyticsRes.data.data);
        setActivities(activityRes.data.data || []);
      } catch (analyticsError) {
        console.warn('Analytics/Activity not available yet:', analyticsError);
        // These are optional, don't fail the whole dashboard
      }
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="text-red-400 text-lg mb-4">⚠️ {error}</div>
        <button
          onClick={loadData}
          className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  const pieData = stats?.messageTypes
    ? Object.entries(stats.messageTypes).map(([name, value]) => ({ name, value }))
    : [];

  const chartData = analytics?.userSignups.map((item, index) => ({
    date: formatDate(item._id),
    users: item.count,
    couples: analytics.couplesFormed[index]?.count || 0,
    messages: analytics.messagesPerDay[index]?.count || 0,
    active: analytics.activeUsersPerDay[index]?.count || 0,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Welcome back! Here's what's happening with Distang.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-violet-500 focus:outline-none"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button
            onClick={loadData}
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-gradient-to-br from-violet-600 to-violet-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-violet-200 text-sm font-medium">Total Users</p>
              <p className="text-3xl font-bold text-white mt-1">{formatNumber(stats?.overview.totalUsers || 0)}</p>
              <p className="text-violet-200 text-sm mt-2">
                <span className="text-green-300">+{stats?.growth.newUsersToday}</span> today
              </p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Active Couples */}
        <div className="bg-gradient-to-br from-pink-600 to-pink-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-200 text-sm font-medium">Active Couples</p>
              <p className="text-3xl font-bold text-white mt-1">{formatNumber(stats?.overview.totalCouples || 0)}</p>
              <p className="text-pink-200 text-sm mt-2">
                <span className="text-green-300">+{stats?.growth.newCouplesToday}</span> today
              </p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm font-medium">Total Messages</p>
              <p className="text-3xl font-bold text-white mt-1">{formatNumber(stats?.overview.totalMessages || 0)}</p>
              <p className="text-blue-200 text-sm mt-2">
                <span className="text-green-300">{stats?.activity.avgMessagesPerDay}/day</span> avg
              </p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-200 text-sm font-medium">Active Users (24h)</p>
              <p className="text-3xl font-bold text-white mt-1">{formatNumber(stats?.activity.activeUsers24h || 0)}</p>
              <p className="text-emerald-200 text-sm mt-2">
                <span className="text-yellow-300">{stats?.activity.activeUsers1h}</span> online now
              </p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">User Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="users" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorUsers)" name="New Users" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Activity Chart */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Daily Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Bar dataKey="messages" fill="#3b82f6" name="Messages" radius={[4, 4, 0, 0]} />
              <Bar dataKey="active" fill="#10b981" name="Active Users" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message Types */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Message Types</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Stats */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <span className="text-gray-300">Verification Rate</span>
              <span className="text-white font-semibold">{stats?.overview.verificationRate}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <span className="text-gray-300">Growth Rate</span>
              <span className={`font-semibold ${stats?.growth.userGrowthRate?.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
                {stats?.growth.userGrowthRate}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <span className="text-gray-300">Retention Rate</span>
              <span className="text-white font-semibold">{analytics?.retention.retentionRate}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <span className="text-gray-300">Total Memories</span>
              <span className="text-white font-semibold">{formatNumber(stats?.overview.totalMemories || 0)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <span className="text-gray-300">Weekly Messages</span>
              <span className="text-white font-semibold">{formatNumber(stats?.activity.messagesWeek || 0)}</span>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
            {activities.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-2 hover:bg-gray-700/30 rounded-lg transition-colors">
                <span className="text-xl">{activity.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-300 text-sm truncate">{activity.message}</p>
                  <p className="text-gray-500 text-xs">{formatTime(activity.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
