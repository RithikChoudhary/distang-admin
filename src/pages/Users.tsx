import { useEffect, useState } from 'react';
import { adminApi } from '../services/api';
import { format } from 'date-fns';

interface User {
  _id: string;
  uniqueId: string;
  username: string;
  email: string;
  name: string;
  profilePhoto?: string;
  isVerified: boolean;
  isBanned?: boolean;
  coupleId?: string;
  createdAt: string;
  lastActive?: string;
  messageCount?: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface UserDetail {
  user: User;
  couple: any;
  partner: any;
  stats: {
    messageCount: number;
    memoryCount: number;
    lastMood: any;
  };
  recentMessages: any[];
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [pagination.page, statusFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (pagination.page === 1) {
        loadUsers();
      } else {
        setPagination(p => ({ ...p, page: 1 }));
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        search,
        status: statusFilter,
      });
      setUsers(res.data.data.users);
      setPagination(res.data.data.pagination);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewUser = async (userId: string) => {
    try {
      setActionLoading(true);
      const res = await adminApi.getUser(userId);
      setSelectedUser(res.data.data);
      setShowModal(true);
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleBan = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'unban' : 'ban'} this user?`)) return;
    
    try {
      await adminApi.updateUser(userId, { isBanned: !currentStatus });
      loadUsers();
      if (selectedUser?.user._id === userId) {
        setSelectedUser({
          ...selectedUser,
          user: { ...selectedUser.user, isBanned: !currentStatus }
        });
      }
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const toggleVerify = async (userId: string, currentStatus: boolean) => {
    try {
      await adminApi.updateUser(userId, { isVerified: !currentStatus });
      loadUsers();
      if (selectedUser?.user._id === userId) {
        setSelectedUser({
          ...selectedUser,
          user: { ...selectedUser.user, isVerified: !currentStatus }
        });
      }
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) return;
    
    try {
      await adminApi.deleteUser(userId);
      setShowModal(false);
      loadUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const getStatusBadge = (user: User) => {
    if (user.isBanned) {
      return <span className="px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 rounded-full">Banned</span>;
    }
    if (user.coupleId) {
      return <span className="px-2 py-1 text-xs font-medium bg-pink-500/20 text-pink-400 rounded-full">Paired</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium bg-gray-500/20 text-gray-400 rounded-full">Single</span>;
  };

  const getActivityStatus = (lastActive?: string) => {
    if (!lastActive) return { text: 'Never', color: 'text-gray-500' };
    
    const diff = Date.now() - new Date(lastActive).getTime();
    const hours = diff / 3600000;
    
    if (hours < 1) return { text: 'Online', color: 'text-green-400' };
    if (hours < 24) return { text: `${Math.floor(hours)}h ago`, color: 'text-yellow-400' };
    if (hours < 168) return { text: `${Math.floor(hours / 24)}d ago`, color: 'text-orange-400' };
    return { text: 'Inactive', color: 'text-red-400' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Users</h1>
          <p className="text-gray-400 mt-1">Manage and monitor all registered users</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{pagination.total}</p>
          <p className="text-gray-400 text-sm">Total Users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email, username, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-700 focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-violet-500 focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="active">Active (24h)</option>
          <option value="inactive">Inactive (7d+)</option>
          <option value="paired">Paired</option>
          <option value="single">Single</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">User</th>
                <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">ID</th>
                <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Status</th>
                <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Activity</th>
                <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Messages</th>
                <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Joined</th>
                <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-500 border-t-transparent"></div>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const activity = getActivityStatus(user.lastActive);
                  return (
                    <tr key={user._id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {user.profilePhoto ? (
                              <img
                                src={user.profilePhoto}
                                alt={user.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-medium">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            {user.isVerified && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-white font-medium">{user.name}</p>
                            <p className="text-gray-400 text-sm">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-300 font-mono text-sm">{user.uniqueId}</span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(user)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={activity.color}>{activity.text}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-300">{user.messageCount || 0}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-400 text-sm">
                          {format(new Date(user.createdAt), 'MMM d, yyyy')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => viewUser(user._id)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => toggleBan(user._id, user.isBanned || false)}
                            className={`p-2 rounded-lg transition-colors ${user.isBanned ? 'text-green-400 hover:bg-green-500/20' : 'text-orange-400 hover:bg-orange-500/20'}`}
                            title={user.isBanned ? 'Unban' : 'Ban'}
                          >
                            {user.isBanned ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => deleteUser(user._id)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700">
            <p className="text-gray-400 text-sm">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
              >
                Previous
              </button>
              <span className="text-gray-400">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">User Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Profile Section */}
              <div className="flex items-center gap-4">
                {selectedUser.user.profilePhoto ? (
                  <img
                    src={selectedUser.user.profilePhoto}
                    alt={selectedUser.user.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
                    {selectedUser.user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    {selectedUser.user.name}
                    {selectedUser.user.isVerified && (
                      <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </h3>
                  <p className="text-gray-400">@{selectedUser.user.username}</p>
                  <p className="text-gray-400 text-sm">{selectedUser.user.email}</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-white">{selectedUser.stats.messageCount}</p>
                  <p className="text-gray-400 text-sm">Messages</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-white">{selectedUser.stats.memoryCount}</p>
                  <p className="text-gray-400 text-sm">Memories</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-white">{selectedUser.stats.lastMood?.mood || '—'}</p>
                  <p className="text-gray-400 text-sm">Last Mood</p>
                </div>
              </div>

              {/* Partner Info */}
              {selectedUser.partner && (
                <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-4">
                  <p className="text-pink-400 text-sm font-medium mb-2">💑 Paired with</p>
                  <div className="flex items-center gap-3">
                    {selectedUser.partner.profilePhoto ? (
                      <img
                        src={selectedUser.partner.profilePhoto}
                        alt={selectedUser.partner.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center text-white font-medium">
                        {selectedUser.partner.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-white font-medium">{selectedUser.partner.name}</p>
                      <p className="text-gray-400 text-sm">{selectedUser.partner.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">User ID</p>
                  <p className="text-white font-mono">{selectedUser.user.uniqueId}</p>
                </div>
                <div>
                  <p className="text-gray-400">Joined</p>
                  <p className="text-white">{format(new Date(selectedUser.user.createdAt), 'MMMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-gray-400">Last Active</p>
                  <p className="text-white">
                    {selectedUser.user.lastActive 
                      ? format(new Date(selectedUser.user.lastActive), 'MMM d, yyyy h:mm a')
                      : 'Never'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Status</p>
                  <p className={selectedUser.user.isBanned ? 'text-red-400' : 'text-green-400'}>
                    {selectedUser.user.isBanned ? 'Banned' : 'Active'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => toggleVerify(selectedUser.user._id, selectedUser.user.isVerified)}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    selectedUser.user.isVerified
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {selectedUser.user.isVerified ? 'Remove Verification' : 'Verify User'}
                </button>
                <button
                  onClick={() => toggleBan(selectedUser.user._id, selectedUser.user.isBanned || false)}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    selectedUser.user.isBanned
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  {selectedUser.user.isBanned ? 'Unban User' : 'Ban User'}
                </button>
                <button
                  onClick={() => deleteUser(selectedUser.user._id)}
                  className="py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
