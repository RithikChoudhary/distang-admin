import { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { format } from 'date-fns';

interface Memory {
  _id: string;
  coupleId: string;
  uploadedBy: {
    name: string;
    email: string;
  };
  imagePath: string;
  caption?: string;
  createdAt: string;
}

const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:8000' 
  : 'https://api.codex-couples.com';

export default function Memories() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    loadMemories();
  }, [page]);

  const loadMemories = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getMemories(page, 24);
      setMemories(response.data.data.memories || []);
      setTotalPages(response.data.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Failed to load memories:', error);
      setMemories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (memoryId: string) => {
    if (!window.confirm('Are you sure you want to delete this memory?')) {
      return;
    }

    try {
      await adminApi.deleteMemory(memoryId);
      setMemories(memories.filter((m) => m._id !== memoryId));
    } catch (error) {
      console.error('Failed to delete memory:', error);
      alert('Failed to delete memory');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Memories</h1>
        <p className="text-gray-500">View and manage shared photos</p>
      </div>

      {/* Memories Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="spinner" />
          </div>
        ) : memories.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No memories found
          </div>
        ) : (
          memories.map((memory) => (
            <div
              key={memory._id}
              className="bg-white rounded-lg shadow-sm overflow-hidden group relative"
            >
              <img
                src={`${API_BASE_URL}${memory.imagePath}`}
                alt={memory.caption || 'Memory'}
                className="w-full h-40 object-cover cursor-pointer"
                onClick={() => setSelectedImage(`${API_BASE_URL}${memory.imagePath}`)}
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                <button
                  onClick={() => setSelectedImage(`${API_BASE_URL}${memory.imagePath}`)}
                  className="px-3 py-1 bg-white text-gray-800 rounded text-sm hover:bg-gray-100"
                >
                  View
                </button>
                <button
                  onClick={() => handleDelete(memory._id)}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
              <div className="p-2">
                <p className="text-xs text-gray-500 truncate">
                  {memory.uploadedBy?.name || 'Unknown'}
                </p>
                <p className="text-xs text-gray-400">
                  {format(new Date(memory.createdAt), 'MMM d')}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Image Viewer Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 text-white text-2xl hover:text-gray-300"
          >
            ✕
          </button>
          <img
            src={selectedImage}
            alt="Memory"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

