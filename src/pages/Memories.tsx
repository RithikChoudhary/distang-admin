import { useEffect, useState } from 'react';
import { adminApi } from '../services/api';
import { format } from 'date-fns';

interface Memory {
  _id: string;
  uploadedBy: {
    _id: string;
    name: string;
    email: string;
    profilePhoto?: string;
  };
  coupleId: string;
  title: string;
  description?: string;
  imageUrl?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  date: string;
  createdAt: string;
}

interface Couple {
  _id: string;
  partner1: { _id: string; name: string; profilePhoto?: string };
  partner2: { _id: string; name: string; profilePhoto?: string };
  memoryCount?: number;
}

export default function Memories() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [couples, setCouples] = useState<Couple[]>([]);
  const [selectedCouple, setSelectedCouple] = useState<string>('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

  useEffect(() => {
    loadCouples();
  }, []);

  useEffect(() => {
    loadMemories();
  }, [pagination.page, selectedCouple]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (pagination.page === 1) {
        loadMemories();
      } else {
        setPagination(p => ({ ...p, page: 1 }));
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const loadCouples = async () => {
    try {
      const res = await adminApi.getCouples({ limit: 100 });
      setCouples(res.data.data.couples || []);
    } catch (error) {
      console.error('Failed to load couples:', error);
    }
  };

  const loadMemories = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getMemories({
        page: pagination.page,
        limit: pagination.limit,
        search,
        coupleId: selectedCouple,
      });
      setMemories(res.data.data.memories || []);
      setPagination(res.data.data.pagination);
    } catch (error) {
      console.error('Failed to load memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMemory = async (memoryId: string) => {
    if (!confirm('Are you sure you want to delete this memory?')) return;
    
    try {
      await adminApi.deleteMemory(memoryId);
      setSelectedMemory(null);
      loadMemories();
    } catch (error) {
      console.error('Failed to delete memory:', error);
    }
  };

  const getCoupleLabel = (couple: Couple) => {
    return `${couple.partner1?.name || 'User 1'} & ${couple.partner2?.name || 'User 2'}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Memories</h1>
          <p className="text-gray-400 mt-1">Browse couple memories and photos</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{pagination.total.toLocaleString()}</p>
          <p className="text-gray-400 text-sm">
            {selectedCouple ? 'Filtered Memories' : 'Total Memories'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Couple Selector */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Select Couple</label>
          <select
            value={selectedCouple}
            onChange={(e) => {
              setSelectedCouple(e.target.value);
              setPagination(p => ({ ...p, page: 1 }));
            }}
            className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-violet-500 focus:outline-none"
          >
            <option value="">All Couples</option>
            {couples.map(couple => (
              <option key={couple._id} value={couple._id}>
                {getCoupleLabel(couple)} ({couple.memoryCount || 0} memories)
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Search</label>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search memories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-700 focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Selected Couple Info */}
      {selectedCouple && (
        <div className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-4">
          {(() => {
            const couple = couples.find(c => c._id === selectedCouple);
            if (!couple) return null;
            return (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {couple.partner1?.profilePhoto ? (
                      <img src={couple.partner1.profilePhoto} className="w-10 h-10 rounded-full border-2 border-pink-500" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center text-white font-bold border-2 border-pink-500">
                        {couple.partner1?.name?.charAt(0) || '?'}
                      </div>
                    )}
                    {couple.partner2?.profilePhoto ? (
                      <img src={couple.partner2.profilePhoto} className="w-10 h-10 rounded-full border-2 border-violet-500" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold border-2 border-violet-500">
                        {couple.partner2?.name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium">{getCoupleLabel(couple)}</p>
                    <p className="text-gray-400 text-sm">{couple.memoryCount || 0} total memories</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCouple('')}
                  className="text-gray-400 hover:text-white"
                >
                  Clear filter
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* Memories Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-500 border-t-transparent"></div>
        </div>
      ) : memories.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-gray-800/50 rounded-xl">
          {selectedCouple ? 'No memories for this couple' : 'No memories found'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {memories.map((memory) => (
            <div
              key={memory._id}
              onClick={() => setSelectedMemory(memory)}
              className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden hover:border-violet-500 transition-colors cursor-pointer group"
            >
              {/* Image */}
              <div className="aspect-square bg-gray-700 relative">
                {memory.imageUrl ? (
                  <img
                    src={memory.imageUrl}
                    alt={memory.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-6xl">📷</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white font-medium">View Details</span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="text-white font-medium truncate">{memory.title}</h3>
                <div className="flex items-center gap-2 mt-2">
                  {memory.uploadedBy?.profilePhoto ? (
                    <img
                      src={memory.uploadedBy.profilePhoto}
                      alt={memory.uploadedBy.name}
                      className="w-5 h-5 rounded-full"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs">
                      {memory.uploadedBy?.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <span className="text-gray-400 text-sm truncate">{memory.uploadedBy?.name || 'Unknown'}</span>
                </div>
                <p className="text-gray-500 text-xs mt-2">
                  {format(new Date(memory.date || memory.createdAt), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 bg-gray-800/50 rounded-xl">
          <p className="text-gray-400 text-sm">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
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

      {/* Memory Detail Modal */}
      {selectedMemory && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedMemory(null)}>
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            {/* Image */}
            {selectedMemory.imageUrl && (
              <div className="aspect-video bg-gray-800">
                <img
                  src={selectedMemory.imageUrl}
                  alt={selectedMemory.title}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">{selectedMemory.title}</h2>
                <button
                  onClick={() => setSelectedMemory(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {selectedMemory.description && (
                <p className="text-gray-300 mb-4">{selectedMemory.description}</p>
              )}

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  {selectedMemory.uploadedBy?.profilePhoto ? (
                    <img
                      src={selectedMemory.uploadedBy.profilePhoto}
                      alt={selectedMemory.uploadedBy.name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white">
                      {selectedMemory.uploadedBy?.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <div>
                    <p className="text-white">{selectedMemory.uploadedBy?.name || 'Unknown'}</p>
                    <p className="text-gray-500">{selectedMemory.uploadedBy?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {format(new Date(selectedMemory.date || selectedMemory.createdAt), 'MMMM d, yyyy')}
                </div>

                {selectedMemory.location?.address && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {selectedMemory.location.address}
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6 pt-4 border-t border-gray-800">
                <button
                  onClick={() => deleteMemory(selectedMemory._id)}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  Delete Memory
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
