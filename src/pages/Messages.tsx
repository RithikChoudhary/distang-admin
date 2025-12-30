import { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { format } from 'date-fns';

interface Message {
  _id: string;
  coupleId: string;
  senderId: {
    _id: string;
    name: string;
    email: string;
  };
  message: string;
  messageType: string;
  createdAt: string;
}

export default function Messages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [coupleFilter, setCoupleFilter] = useState('');

  useEffect(() => {
    loadMessages();
  }, [page, coupleFilter]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getMessages(page, 50, coupleFilter);
      setMessages(response.data.data.messages || []);
      setTotalPages(response.data.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      await adminApi.deleteMessage(messageId);
      setMessages(messages.filter((m) => m._id !== messageId));
    } catch (error) {
      console.error('Failed to delete message:', error);
      alert('Failed to delete message');
    }
  };

  const getMessagePreview = (message: Message) => {
    if (message.messageType === 'image') return '📷 Image';
    if (message.messageType === 'voice') return '🎤 Voice message';
    if (message.messageType === 'question') return '❓ Question';
    return message.message.length > 100 
      ? message.message.substring(0, 100) + '...' 
      : message.message;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
          <p className="text-gray-500">View chat messages between couples</p>
        </div>

        <input
          type="text"
          value={coupleFilter}
          onChange={(e) => setCoupleFilter(e.target.value)}
          placeholder="Filter by Couple ID..."
          className="px-4 py-2 border rounded-lg w-64 focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none"
        />
      </div>

      {/* Messages Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Sender</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Message</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Type</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Date</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="spinner mx-auto" />
                </td>
              </tr>
            ) : messages.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No messages found
                </td>
              </tr>
            ) : (
              messages.map((msg) => (
                <tr key={msg._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-800">
                        {msg.senderId?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {msg.senderId?.email || '-'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 max-w-md">
                    <p className="truncate">{getMessagePreview(msg)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      msg.messageType === 'text' ? 'bg-gray-100 text-gray-700' :
                      msg.messageType === 'image' ? 'bg-purple-100 text-purple-700' :
                      msg.messageType === 'voice' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {msg.messageType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {format(new Date(msg.createdAt), 'MMM d, HH:mm')}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDelete(msg._id)}
                      className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

