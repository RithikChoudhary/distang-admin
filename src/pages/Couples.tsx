import { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { format } from 'date-fns';

interface Couple {
  _id: string;
  user1: {
    _id: string;
    name: string;
    email: string;
    uniqueId: string;
  };
  user2: {
    _id: string;
    name: string;
    email: string;
    uniqueId: string;
  };
  status: string;
  createdAt: string;
  anniversaryDate?: string;
}

export default function Couples() {
  const [couples, setCouples] = useState<Couple[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadCouples();
  }, [page]);

  const loadCouples = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getCouples(page, 20);
      setCouples(response.data.data.couples || []);
      setTotalPages(response.data.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Failed to load couples:', error);
      setCouples([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBreakup = async (coupleId: string) => {
    if (!window.confirm('Are you sure you want to end this relationship? This will unpair both users.')) {
      return;
    }

    try {
      await adminApi.deleteCouple(coupleId);
      setCouples(couples.filter((c) => c._id !== coupleId));
    } catch (error) {
      console.error('Failed to break up couple:', error);
      alert('Failed to process breakup');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Couples</h1>
        <p className="text-gray-500">Manage connected couples</p>
      </div>

      {/* Couples Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 flex justify-center py-12">
            <div className="spinner" />
          </div>
        ) : couples.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-gray-500">
            No couples found
          </div>
        ) : (
          couples.map((couple) => (
            <div key={couple._id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">💕</span>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  couple.status === 'active' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {couple.status}
                </span>
              </div>

              <div className="flex items-center gap-4 mb-4">
                {/* User 1 */}
                <div className="flex-1 text-center">
                  <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-2 text-xl font-bold text-pink-600">
                    {couple.user1?.name?.charAt(0) || '?'}
                  </div>
                  <p className="font-medium text-gray-800 truncate">
                    {couple.user1?.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {couple.user1?.email || '-'}
                  </p>
                </div>

                <div className="text-2xl">❤️</div>

                {/* User 2 */}
                <div className="flex-1 text-center">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2 text-xl font-bold text-blue-600">
                    {couple.user2?.name?.charAt(0) || '?'}
                  </div>
                  <p className="font-medium text-gray-800 truncate">
                    {couple.user2?.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {couple.user2?.email || '-'}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Connected: {format(new Date(couple.createdAt), 'MMM d, yyyy')}
                </div>
                <button
                  onClick={() => handleBreakup(couple._id)}
                  className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                >
                  End Relationship
                </button>
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
    </div>
  );
}

