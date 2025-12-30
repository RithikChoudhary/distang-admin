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
  messageType: 'text' | 'image' | 'voice' | 'location';
  message: string;
  createdAt: string;
}

interface Couple {
  _id: string;
  partner1: { _id: string; name: string; profilePhoto?: string };
  partner2: { _id: string; name: string; profilePhoto?: string };
  messageCount?: number;
}

export default function Messages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [couples, setCouples] = useState<Couple[]>([]);
  const [selectedCouple, setSelectedCouple] = useState<string>('');
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    loadCouples();
  }, []);

  useEffect(() => {
    loadMessages();
  }, [pagination.page, typeFilter, selectedCouple]);

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

  const loadCouples = async () => {
    try {
      const res = await adminApi.getCouples({ limit: 100 });
      setCouples(res.data.data.couples || []);
    } catch (error) {
      console.error('Failed to load couples:', error);
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getMessages({
        page: pagination.page,
        limit: pagination.limit,
        search,
        type: typeFilter,
        coupleId: selectedCouple,
      });
      setMessages(res.data.data.messages || []);
      setPagination(res.data.data.pagination);
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

  const getMessageIcon = (messageType: string) => {
    switch (messageType) {
      case 'image': return '📷';
      case 'voice': return '🎤';
      case 'location': return '📍';
      default: return '💬';
    }
  };

  const getMessageContent = (msg: Message) => {
    switch (msg.messageType) {
      case 'image':
        return (
          <div className="mt-2">
            <span className="text-violet-400">📷 Image message</span>
          </div>
        );
      case 'voice':
        return (
          <div className="mt-2 flex items-center gap-2 text-violet-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            <span className="text-sm">Voice message</span>
          </div>
        );
      case 'location':
        return <p className="text-gray-300 mt-1">📍 Location shared</p>;
      default:
        return <p className="text-gray-300 mt-1">{msg.message}</p>;
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
          <h1 className="text-3xl font-bold text-white">Messages</h1>
          <p className="text-gray-400 mt-1">Monitor conversations by couple</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{pagination.total.toLocaleString()}</p>
          <p className="text-gray-400 text-sm">
            {selectedCouple ? 'Filtered Messages' : 'Total Messages'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                {getCoupleLabel(couple)} ({couple.messageCount || 0} messages)
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Message Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-violet-500 focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="text">💬 Text</option>
            <option value="image">📷 Images</option>
            <option value="voice">🎤 Voice</option>
          </select>
        </div>

        {/* Search */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Search Content</label>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search messages..."
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
                    <p className="text-gray-400 text-sm">{couple.messageCount || 0} total messages</p>
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

      {/* Messages List */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        <div className="divide-y divide-gray-700">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-500 border-t-transparent"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              {selectedCouple ? 'No messages for this couple' : 'No messages found'}
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
                      <span className="text-xl">{getMessageIcon(message.messageType)}</span>
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
