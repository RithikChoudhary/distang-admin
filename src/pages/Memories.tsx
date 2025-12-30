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
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  createdAt: string;
}

export default function Memories() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 24, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    loadMemories();
  }, [pagination.page, typeFilter]);

  const loadMemories = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getMemories({
        page: pagination.page,
        limit: pagination.limit,
        type: typeFilter,
      });
      setMemories(res.data.data.memories);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Memories</h1>
          <p className="text-gray-400 mt-1">Browse and manage shared memories</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-violet-500 focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{pagination.total}</p>
            <p className="text-gray-400 text-sm">Total Memories</p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-500 border-t-transparent"></div>
          </div>
        ) : memories.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">
            No memories found
          </div>
        ) : (
          memories.map((memory) => (
            <div
              key={memory._id}
              className="aspect-square relative group cursor-pointer overflow-hidden rounded-xl bg-gray-800"
              onClick={() => setSelectedMemory(memory)}
            >
              <img
                src={memory.thumbnailUrl || memory.url}
                alt={memory.caption || 'Memory'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-sm font-medium truncate">
                    {memory.uploadedBy?.name || 'Unknown'}
                  </p>
                  <p className="text-gray-300 text-xs">
                    {format(new Date(memory.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>

              {/* Type indicator */}
              {memory.type === 'video' && (
                <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1.5">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          ))
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

      {/* Memory Modal */}
      {selectedMemory && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedMemory(null)}
        >
          <div 
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedMemory(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image */}
            <img
              src={selectedMemory.url}
              alt={selectedMemory.caption || 'Memory'}
              className="w-full max-h-[70vh] object-contain rounded-lg"
            />

            {/* Info bar */}
            <div className="bg-gray-800 rounded-lg mt-4 p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {selectedMemory.uploadedBy?.profilePhoto ? (
                  <img
                    src={selectedMemory.uploadedBy.profilePhoto}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center text-white font-medium">
                    {selectedMemory.uploadedBy?.name?.charAt(0) || '?'}
                  </div>
                )}
                <div>
                  <p className="text-white font-medium">{selectedMemory.uploadedBy?.name || 'Unknown'}</p>
                  <p className="text-gray-400 text-sm">
                    {format(new Date(selectedMemory.createdAt), 'MMMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => deleteMemory(selectedMemory._id)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete Memory
              </button>
            </div>

            {/* Caption */}
            {selectedMemory.caption && (
              <p className="text-gray-300 mt-4 text-center">{selectedMemory.caption}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
