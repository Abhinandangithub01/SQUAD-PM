import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  MagnifyingGlassIcon,
  HashtagIcon,
  PlusIcon,
  UserGroupIcon,
  BellIcon,
  BellSlashIcon,
  EllipsisVerticalIcon,
  PhoneIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { Menu } from '@headlessui/react';
import amplifyDataService from '../services/amplifyDataService';
import { useAuth } from '../contexts/AuthContext';
import Avatar from './Avatar';
import { formatDateTime } from '../utils/helpers';
import toast from 'react-hot-toast';

const EnhancedChat = () => {
  const { projectId, channelId } = useParams();
  const [message, setMessage] = useState('');
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch channels
  const { data: channelsData } = useQuery({
    queryKey: ['channels', projectId],
    queryFn: async () => {
      const result = await amplifyDataService.channels.list({ projectId });
      return result.success ? result.data : [];
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch messages for selected channel
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', channelId || selectedChannel?.id],
    queryFn: async () => {
      const result = await amplifyDataService.messages.list({ 
        channelId: channelId || selectedChannel?.id 
      });
      return result.success ? result.data : [];
    },
    enabled: !!(channelId || selectedChannel?.id),
    refetchInterval: 2000, // Refresh every 2 seconds for real-time feel
  });

  // Fetch channel members
  const { data: membersData } = useQuery({
    queryKey: ['channel-members', channelId || selectedChannel?.id],
    queryFn: async () => {
      const result = await amplifyDataService.channels.getMembers({ 
        channelId: channelId || selectedChannel?.id 
      });
      return result.success ? result.data : [];
    },
    enabled: !!(channelId || selectedChannel?.id),
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      const result = await amplifyDataService.messages.create({
        channelId: channelId || selectedChannel?.id,
        content: messageData.content,
        userId: user?.id,
        attachments: messageData.attachments || [],
        mentions: messageData.mentions || [],
      });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries(['messages']);
      scrollToBottom();
    },
    onError: () => {
      toast.error('Failed to send message');
    },
  });

  // Create channel mutation
  const createChannelMutation = useMutation({
    mutationFn: async (channelData) => {
      const result = await amplifyDataService.channels.create({
        ...channelData,
        projectId,
        createdById: user?.id,
      });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['channels']);
      toast.success('Channel created successfully');
    },
  });

  // React to message mutation
  const reactToMessageMutation = useMutation({
    mutationFn: async ({ messageId, emoji }) => {
      const result = await amplifyDataService.messages.addReaction({
        messageId,
        emoji,
        userId: user?.id,
      });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['messages']);
    },
  });

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messagesData]);

  // Set initial channel
  useEffect(() => {
    if (channelsData && channelsData.length > 0 && !selectedChannel && !channelId) {
      setSelectedChannel(channelsData[0]);
    }
  }, [channelsData, selectedChannel, channelId]);

  // Handle typing indicator
  useEffect(() => {
    if (message.length > 0 && !isTyping) {
      setIsTyping(true);
      // Send typing indicator to server
      amplifyDataService.channels.sendTypingIndicator({
        channelId: channelId || selectedChannel?.id,
        userId: user?.id,
      });
    } else if (message.length === 0 && isTyping) {
      setIsTyping(false);
    }
  }, [message]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Parse @mentions
    const mentions = [];
    const mentionRegex = /@(\w+)/g;
    let match;
    while ((match = mentionRegex.exec(message)) !== null) {
      mentions.push(match[1]);
    }

    sendMessageMutation.mutate({
      content: message,
      mentions,
    });
  };

  const handleCreateChannel = () => {
    const name = prompt('Enter channel name:');
    if (name) {
      createChannelMutation.mutate({
        name: name.toLowerCase().replace(/\s+/g, '-'),
        displayName: name,
        type: 'PUBLIC',
      });
    }
  };

  const handleReaction = (messageId, emoji) => {
    reactToMessageMutation.mutate({ messageId, emoji });
  };

  const currentChannel = channelId 
    ? channelsData?.find(c => c.id === channelId) 
    : selectedChannel;

  const messages = messagesData || [];
  const channels = channelsData || [];
  const members = membersData || [];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Channels */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Channels</h2>
            <button
              onClick={handleCreateChannel}
              className="p-1.5 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search channels..."
              className="w-full px-3 py-2 pl-9 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto p-2">
          {channels
            .filter(channel => 
              !searchQuery || 
              channel.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map(channel => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                  (currentChannel?.id === channel.id)
                    ? 'bg-blue-100 text-blue-900'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <HashtagIcon className="h-5 w-5 flex-shrink-0" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium truncate">{channel.name}</p>
                  {channel.unread_count > 0 && (
                    <span className="inline-block px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {channel.unread_count}
                    </span>
                  )}
                </div>
              </button>
            ))}
        </div>

        {/* Online Members */}
        <div className="p-4 border-t border-gray-200">
          <h4 className="text-xs font-semibold text-gray-600 mb-2">
            ONLINE ({members.filter(m => m.online).length})
          </h4>
          <div className="flex -space-x-2">
            {members.filter(m => m.online).slice(0, 5).map(member => (
              <div key={member.id} className="relative">
                <Avatar user={member} size="sm" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
              </div>
            ))}
            {members.filter(m => m.online).length > 5 && (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                +{members.filter(m => m.online).length - 5}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentChannel ? (
          <>
            {/* Chat Header */}
            <div className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <HashtagIcon className="h-6 w-6 text-gray-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {currentChannel.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {members.length} members
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Call Buttons */}
                <button
                  onClick={() => toast.success('Voice call coming soon!')}
                  className="p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  title="Voice Call"
                >
                  <PhoneIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => toast.success('Video call coming soon!')}
                  className="p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  title="Video Call"
                >
                  <VideoCameraIcon className="h-5 w-5" />
                </button>

                {/* Channel Menu */}
                <Menu as="div" className="relative">
                  <Menu.Button className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                    <EllipsisVerticalIcon className="h-5 w-5" />
                  </Menu.Button>
                  <Menu.Items className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          className={`${active ? 'bg-gray-100' : ''} flex items-center px-4 py-2 text-sm text-gray-700 w-full text-left`}
                        >
                          <BellIcon className="h-4 w-4 mr-2" />
                          Mute notifications
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          className={`${active ? 'bg-gray-100' : ''} flex items-center px-4 py-2 text-sm text-gray-700 w-full text-left`}
                        >
                          <UserGroupIcon className="h-4 w-4 mr-2" />
                          View members
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Menu>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                    <p className="text-sm text-gray-500">Loading messages...</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <HashtagIcon className="h-16 w-16 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 font-medium">No messages yet</p>
                    <p className="text-sm text-gray-400 mt-1">Be the first to send a message!</p>
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isOwnMessage = msg.userId === user?.id;
                  const showAvatar = index === 0 || messages[index - 1].userId !== msg.userId;
                  const isConsecutive = index > 0 && messages[index - 1].userId === msg.userId;

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start space-x-3 ${isConsecutive ? 'mt-1' : 'mt-4'} group`}
                    >
                      {/* Avatar */}
                      <div className="w-10">
                        {showAvatar && (
                          <Avatar user={msg.user} size="md" />
                        )}
                      </div>

                      {/* Message Content */}
                      <div className="flex-1 min-w-0">
                        {showAvatar && (
                          <div className="flex items-baseline space-x-2 mb-1">
                            <span className="text-sm font-semibold text-gray-900">
                              {msg.user?.first_name} {msg.user?.last_name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDateTime(msg.created_at)}
                            </span>
                          </div>
                        )}

                        <div className={`inline-block max-w-2xl ${
                          isOwnMessage 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white border border-gray-200'
                        } rounded-lg px-4 py-2 shadow-sm`}>
                          <p className={`text-sm ${isOwnMessage ? 'text-white' : 'text-gray-900'}`}>
                            {msg.content}
                          </p>

                          {/* Attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {msg.attachments.map((attachment, i) => (
                                <a
                                  key={i}
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex items-center space-x-2 p-2 rounded ${
                                    isOwnMessage ? 'bg-blue-700' : 'bg-gray-50'
                                  } hover:opacity-80 transition-opacity`}
                                >
                                  <PaperClipIcon className="h-4 w-4" />
                                  <span className="text-xs truncate">{attachment.name}</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Reactions */}
                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                          <div className="flex items-center space-x-1 mt-1">
                            {Object.entries(msg.reactions).map(([emoji, users]) => (
                              <button
                                key={emoji}
                                onClick={() => handleReaction(msg.id, emoji)}
                                className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs ${
                                  users.includes(user?.id)
                                    ? 'bg-blue-100 border border-blue-300'
                                    : 'bg-gray-100 border border-gray-200 hover:bg-gray-200'
                                } transition-colors`}
                              >
                                <span>{emoji}</span>
                                <span className="text-gray-600">{users.length}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Message Actions */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setShowEmojiPicker(msg.id)}
                          className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                          title="Add reaction"
                        >
                          <FaceSmileIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
              
              {/* Typing Indicator */}
              {typingUsers.length > 0 && (
                <div className="flex items-center space-x-2 text-sm text-gray-500 italic">
                  <div className="flex space-x-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span>
                    {typingUsers.length === 1 
                      ? `${typingUsers[0].name} is typing...`
                      : `${typingUsers.length} people are typing...`
                    }
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
                <div className="flex-1">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder={`Message #${currentChannel?.name}...`}
                    rows={1}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    title="Attach file"
                  >
                    <PaperClipIcon className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    title="Add emoji"
                  >
                    <FaceSmileIcon className="h-5 w-5" />
                  </button>
                  <button
                    type="submit"
                    disabled={!message.trim() || sendMessageMutation.isLoading}
                    className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <HashtagIcon className="h-20 w-20 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Welcome to Chat
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Select a channel to start messaging
              </p>
              <button
                onClick={handleCreateChannel}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Channel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Channel Info */}
      {currentChannel && (
        <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Channel Info</h3>
          
          {/* Channel Details */}
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1">DESCRIPTION</p>
              <p className="text-sm text-gray-700">
                {currentChannel.description || 'No description'}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">
                MEMBERS ({members.length})
              </p>
              <div className="space-y-2">
                {members.map(member => (
                  <div key={member.id} className="flex items-center space-x-2">
                    <div className="relative">
                      <Avatar user={member} size="sm" />
                      {member.online && (
                        <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {member.first_name} {member.last_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {member.online ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedChat;
