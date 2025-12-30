import { useEffect, useState } from 'react';
import { adminApi } from '../services/api';
import { format } from 'date-fns';

interface Partner {
  _id: string;
  name: string;
  email: string;
  uniqueId: string;
  profilePhoto?: string;
  lastActive?: string;
}

interface Couple {
  _id: string;
  partner1: Partner;
  partner2: Partner;
  status: string;
  createdAt: string;
  relationshipStartDate?: string;
  messageCount?: number;
  memoryCount?: number;
}

interface CoupleDetail {
  couple: Couple;
  stats: {
    messageCount: number;
    memoryCount: number;
    daysActive: number;
  };
  recentMessages: any[];
  messageActivity: { _id: string; count: number }[];
}

export default function Couples() {
  const [couples, setCouples] = useState<Couple[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCouple, setSelectedCouple] = useState<CoupleDetail | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadCouples();
  }, [pagination.page]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (pagination.page === 1) {
        loadCouples();
      } else {
        setPagination(p => ({ ...p, page: 1 }));
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const loadCouples = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getCouples({
        page: pagination.page,
        limit: pagination.limit,
        search,
      });
      setCouples(res.data.data.couples);
      setPagination(res.data.data.pagination);
    } catch (error) {
      console.error('Failed to load couples:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewCouple = async (coupleId: string) => {
    try {
      const res = await adminApi.getCouple(coupleId);
      setSelectedCouple(res.data.data);
      setShowModal(true);
    } catch (error) {
      console.error('Failed to load couple:', error);
    }
  };

  const breakupCouple = async (coupleId: string) => {
    if (!confirm('Are you sure you want to break up this couple? This action cannot be undone.')) return;
    
    try {
      await adminApi.deleteCouple(coupleId);
      setShowModal(false);
      loadCouples();
    } catch (error) {
      console.error('Failed to break up couple:', error);
    }
  };

  const getActivityLevel = (messageCount?: number) => {
    if (!messageCount) return { level: 'Low', color: 'text-gray-400', bg: 'bg-gray-500/20' };
    if (messageCount > 1000) return { level: 'Very High', color: 'text-green-400', bg: 'bg-green-500/20' };
    if (messageCount > 500) return { level: 'High', color: 'text-emerald-400', bg: 'bg-emerald-500/20' };
    if (messageCount > 100) return { level: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    return { level: 'Low', color: 'text-orange-400', bg: 'bg-orange-500/20' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Couples</h1>
          <p className="text-gray-400 mt-1">Monitor and manage couple relationships</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{pagination.total}</p>
          <p className="text-gray-400 text-sm">Active Couples</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by partner name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-700 focus:border-violet-500 focus:outline-none"
        />
      </div>

      {/* Couples Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-500 border-t-transparent"></div>
          </div>
        ) : couples.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">
            No couples found
          </div>
        ) : (
          couples.map((couple) => {
            const activity = getActivityLevel(couple.messageCount);
            return (
              <div
                key={couple._id}
                className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 hover:border-pink-500/50 transition-colors cursor-pointer"
                onClick={() => viewCouple(couple._id)}
              >
                {/* Partners */}
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="text-center">
                    {couple.partner1?.profilePhoto ? (
                      <img
                        src={couple.partner1.profilePhoto}
                        alt={couple.partner1.name}
                        className="w-14 h-14 rounded-full object-cover mx-auto ring-2 ring-pink-500"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-lg mx-auto ring-2 ring-pink-500">
                        {couple.partner1?.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <p className="text-white text-sm font-medium mt-2 truncate max-w-[80px]">
                      {couple.partner1?.name || 'Unknown'}
                    </p>
                  </div>
                  <div className="text-pink-400 text-2xl">💕</div>
                  <div className="text-center">
                    {couple.partner2?.profilePhoto ? (
                      <img
                        src={couple.partner2.profilePhoto}
                        alt={couple.partner2.name}
                        className="w-14 h-14 rounded-full object-cover mx-auto ring-2 ring-pink-500"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg mx-auto ring-2 ring-pink-500">
                        {couple.partner2?.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <p className="text-white text-sm font-medium mt-2 truncate max-w-[80px]">
                      {couple.partner2?.name || 'Unknown'}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-gray-700/50 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-white">{couple.messageCount || 0}</p>
                    <p className="text-gray-400 text-xs">Messages</p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-white">{couple.memoryCount || 0}</p>
                    <p className="text-gray-400 text-xs">Memories</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${activity.bg} ${activity.color}`}>
                    {activity.level}
                  </span>
                  <span className="text-gray-400">
                    {format(new Date(couple.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
            disabled={pagination.page === 1}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
          >
            Previous
          </button>
          <span className="text-gray-400 px-4">
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
      )}

      {/* Couple Detail Modal */}
      {showModal && selectedCouple && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Couple Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Partners Display */}
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  {selectedCouple.couple.partner1?.profilePhoto ? (
                    <img
                      src={selectedCouple.couple.partner1.profilePhoto}
                      alt=""
                      className="w-24 h-24 rounded-full object-cover mx-auto ring-4 ring-pink-500"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-3xl mx-auto ring-4 ring-pink-500">
                      {(selectedCouple.couple.partner1 as any)?.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <p className="text-white font-semibold mt-3">{(selectedCouple.couple.partner1 as any)?.name}</p>
                  <p className="text-gray-400 text-sm">{(selectedCouple.couple.partner1 as any)?.email}</p>
                </div>
                <div className="text-4xl">💕</div>
                <div className="text-center">
                  {selectedCouple.couple.partner2?.profilePhoto ? (
                    <img
                      src={selectedCouple.couple.partner2.profilePhoto}
                      alt=""
                      className="w-24 h-24 rounded-full object-cover mx-auto ring-4 ring-violet-500"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-bold text-3xl mx-auto ring-4 ring-violet-500">
                      {(selectedCouple.couple.partner2 as any)?.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <p className="text-white font-semibold mt-3">{(selectedCouple.couple.partner2 as any)?.name}</p>
                  <p className="text-gray-400 text-sm">{(selectedCouple.couple.partner2 as any)?.email}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-white">{selectedCouple.stats.messageCount}</p>
                  <p className="text-blue-300 text-sm">Total Messages</p>
                </div>
                <div className="bg-gradient-to-br from-pink-600/20 to-pink-800/20 border border-pink-500/30 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-white">{selectedCouple.stats.memoryCount}</p>
                  <p className="text-pink-300 text-sm">Shared Memories</p>
                </div>
                <div className="bg-gradient-to-br from-violet-600/20 to-violet-800/20 border border-violet-500/30 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-white">{selectedCouple.stats.daysActive}</p>
                  <p className="text-violet-300 text-sm">Days Together</p>
                </div>
              </div>

              {/* Recent Messages */}
              <div>
                <h3 className="text-white font-semibold mb-3">Recent Messages</h3>
                <div className="bg-gray-700/30 rounded-xl p-4 max-h-60 overflow-y-auto space-y-2">
                  {selectedCouple.recentMessages.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">No messages yet</p>
                  ) : (
                    selectedCouple.recentMessages.map((msg, index) => (
                      <div key={index} className="flex items-start gap-3 p-2 hover:bg-gray-700/30 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                          {(msg.senderId as any)?.name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-300 text-sm">
                            {msg.type === 'text' ? msg.content : `[${msg.type}]`}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            {format(new Date(msg.createdAt), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => breakupCouple(selectedCouple.couple._id)}
                  className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  💔 Break Up Couple
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
