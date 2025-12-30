import { useEffect, useState } from 'react';
import { adminApi } from '../services/api';
import { format } from 'date-fns';

interface Message {
  _id: string;
  senderId: {
    _id: string;
    name: string;
    email: string;
    profilePhoto?: string;
  };
  coupleId: string;
  type: 'text' | 'image' | 'voice';
  content?: string;
  imageUrl?: string;
  voiceUrl?: string;
  duration?: number;
  createdAt: string;
}

export default function Messages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    text: 0,
    image: 0,
    voice: 0,
  });

  useEffect(() => {
    loadMessages();
  }, [pagination.page, typeFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (pagination.page === 1) {
        loadMessages();
      } else {
        setPagination(p => ({ ...p, page: 1 }));
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getMessages({
        page: pagination.page,
        limit: pagination.limit,
        search,
        type: typeFilter,
      });
      setMessages(res.data.data.messages);
      setPagination(res.data.data.pagination);
      
      // Calculate stats from first load
      if (!typeFilter && !search) {
        setStats({
          total: res.data.data.pagination.total,
          text: 0,
          image: 0,
          voice: 0,
        });
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    try {
      await adminApi.deleteMessage(messageId);
      loadMessages();
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'image':
        return '📷';
      case 'voice':
        return '🎤';
      default:
        return '💬';
    }
  };

  const getMessageContent = (message: Message) => {
    switch (message.type) {
      case 'image':
        return (
          <div className="mt-2">
            <img
              src={message.imageUrl}
              alt="Message image"
              className="max-w-xs rounded-lg"
            />
          </div>
        );
      case 'voice':
        return (
          <div className="mt-2 flex items-center gap-2 text-violet-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            <span className="text-sm">{message.duration || 0}s voice message</span>
          </div>
        );
      default:
        return (
          <p className="text-gray-300 mt-1">{message.content}</p>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Messages</h1>
          <p className="text-gray-400 mt-1">Monitor all conversations across the platform</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{pagination.total.toLocaleString()}</p>
            <p className="text-gray-400 text-sm">Total Messages</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div 
          className={`bg-gray-800/50 rounded-xl p-4 border cursor-pointer transition-colors ${!typeFilter ? 'border-violet-500' : 'border-gray-700 hover:border-gray-600'}`}
          onClick={() => setTypeFilter('')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">All Messages</p>
              <p className="text-2xl font-bold text-white">{pagination.total.toLocaleString()}</p>
            </div>
            <span className="text-3xl">📨</span>
          </div>
        </div>
        <div 
          className={`bg-gray-800/50 rounded-xl p-4 border cursor-pointer transition-colors ${typeFilter === 'text' ? 'border-blue-500' : 'border-gray-700 hover:border-gray-600'}`}
          onClick={() => setTypeFilter('text')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Text</p>
              <p className="text-2xl font-bold text-blue-400">💬</p>
            </div>
            <span className="text-3xl opacity-50">💬</span>
          </div>
        </div>
        <div 
          className={`bg-gray-800/50 rounded-xl p-4 border cursor-pointer transition-colors ${typeFilter === 'image' ? 'border-pink-500' : 'border-gray-700 hover:border-gray-600'}`}
          onClick={() => setTypeFilter('image')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Images</p>
              <p className="text-2xl font-bold text-pink-400">📷</p>
            </div>
            <span className="text-3xl opacity-50">📷</span>
          </div>
        </div>
        <div 
          className={`bg-gray-800/50 rounded-xl p-4 border cursor-pointer transition-colors ${typeFilter === 'voice' ? 'border-emerald-500' : 'border-gray-700 hover:border-gray-600'}`}
          onClick={() => setTypeFilter('voice')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Voice</p>
              <p className="text-2xl font-bold text-emerald-400">🎤</p>
            </div>
            <span className="text-3xl opacity-50">🎤</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search message content..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-700 focus:border-violet-500 focus:outline-none"
        />
      </div>

      {/* Messages List */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        <div className="divide-y divide-gray-700">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-500 border-t-transparent"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No messages found
            </div>
          ) : (
            messages.map((message) => (
              <div key={message._id} className="p-4 hover:bg-gray-700/30 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Sender Avatar */}
                  <div className="flex-shrink-0">
                    {message.senderId?.profilePhoto ? (
                      <img
                        src={message.senderId.profilePhoto}
                        alt={message.senderId.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-medium">
                        {message.senderId?.name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{message.senderId?.name || 'Unknown'}</span>
                      <span className="text-xl">{getMessageIcon(message.type)}</span>
                      <span className="text-gray-500 text-sm">
                        {format(new Date(message.createdAt), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    {getMessageContent(message)}
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => deleteMessage(message._id)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Delete message"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700">
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
      </div>
    </div>
  );
}
