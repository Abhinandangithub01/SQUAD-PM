import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  EllipsisVerticalIcon,
  HashtagIcon,
  UserGroupIcon,
  FaceSmileIcon,
  PaperClipIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { Menu } from '@headlessui/react';
import api from '../utils/api';
import { useSocket } from '../contexts/SocketContext';
import { formatChatTime, truncateText } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import Avatar from '../components/Avatar';
import CreateChannelModal from '../components/CreateChannelModal';
import toast from 'react-hot-toast';

const Chat = () => {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [message, setMessage] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProjects, setExpandedProjects] = useState(new Set());
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();
  const { socket, joinChannel, leaveChannel, sendMessage } = useSocket();

  // Fetch channels
  const { data: channelsData, isLoading: channelsLoading } = useQuery({
    queryKey: ['chat', 'channels'],
    queryFn: async () => {
      const response = await api.get('/chat/channels');
      return response.data;
    },
  });

  // Fetch messages for selected channel
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['chat', 'messages', channelId],
    queryFn: async () => {
      const response = await api.get(`/chat/channels/${channelId}/messages`);
      return response.data;
    },
    enabled: !!channelId,
    refetchInterval: false,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ channelId, content, type = 'text', replyTo = null }) => {
      const response = await api.post(`/chat/channels/${channelId}/messages`, {
        content,
        type,
        reply_to: replyTo,
      });
      return response.data;
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries(['chat', 'messages', channelId]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to send message');
    },
  });

  // Join/leave channels on selection
  useEffect(() => {
    if (channelId) {
      joinChannel(channelId);
      const channel = channelsData?.channels?.find(c => c.id === channelId);
      setSelectedChannel(channel);
      
      return () => leaveChannel(channelId);
    }
  }, [channelId, channelsData, joinChannel, leaveChannel]);

  // Listen for real-time messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      queryClient.setQueryData(['chat', 'messages', channelId], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          messages: [...oldData.messages, newMessage]
        };
      });
    };

    socket.on('new_message', handleNewMessage);
    return () => socket.off('new_message', handleNewMessage);
  }, [socket, channelId, queryClient]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData?.messages]);

  // Auto-select first channel if none selected
  useEffect(() => {
    if (!channelId && channelsData?.channels?.length > 0) {
      navigate(`/chat/${channelsData.channels[0].id}`, { replace: true });
    }
  }, [channelId, channelsData, navigate]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !channelId) return;

    sendMessageMutation.mutate({
      channelId,
      content: message.trim(),
    });
  };

  const filteredChannels = channelsData?.channels?.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Group channels by type and organize hierarchically
  const generalChannels = filteredChannels.filter(channel => channel.type === 'public');
  const projectChannels = filteredChannels.filter(channel => channel.type === 'project');
  const subChannels = filteredChannels.filter(channel => channel.type === 'project-sub');
  
  // Group sub-channels by their parent project
  const projectsWithSubChannels = projectChannels.map(project => ({
    ...project,
    subChannels: subChannels.filter(sub => sub.parent_channel_id === project.id)
  }));

  const toggleProjectExpansion = (projectId) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  return (
    <div className="h-full flex bg-white p-6">
      <div className="flex-1 flex bg-white rounded-xl shadow-soft overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Chat</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto">
          {channelsLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="sm" />
            </div>
          ) : (
            <div className="p-2 space-y-4">
              {/* General Channels */}
              {generalChannels.length > 0 && (
                <div>
                  <div className="flex items-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <HashtagIcon className="h-4 w-4 mr-2" />
                    General Channels
                  </div>
                  <div className="space-y-1">
                    {generalChannels.map((channel) => (
                      <ChannelItem
                        key={channel.id}
                        channel={channel}
                        isActive={channel.id === channelId}
                        onClick={() => navigate(`/chat/${channel.id}`)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Project Channels */}
              {projectsWithSubChannels.length > 0 && (
                <div>
                  <div className="flex items-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <UserGroupIcon className="h-4 w-4 mr-2" />
                    Project Channels
                  </div>
                  <div className="space-y-2">
                    {projectsWithSubChannels.map((project) => (
                      <ProjectChannelGroup
                        key={project.id}
                        project={project}
                        isExpanded={expandedProjects.has(project.id)}
                        onToggle={() => toggleProjectExpansion(project.id)}
                        activeChannelId={channelId}
                        onChannelClick={(id) => navigate(`/chat/${id}`)}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {filteredChannels.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <HashtagIcon className="h-8 w-8 mx-auto" />
                  </div>
                  <p className="text-sm text-gray-500">
                    {searchQuery ? 'No channels found' : 'No channels yet'}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                    >
                      Create your first channel
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChannel ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {selectedChannel.type === 'direct' ? (
                      <UserGroupIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <HashtagIcon className="h-5 w-5 text-gray-400" />
                    )}
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedChannel.name}
                    </h3>
                  </div>
                  {selectedChannel.description && (
                    <span className="text-sm text-gray-500">
                      {selectedChannel.description}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {selectedChannel.member_count} members
                  </span>
                  <Menu as="div" className="relative">
                    <Menu.Button className="p-1 rounded-full text-gray-400 hover:text-gray-600">
                      <EllipsisVerticalIcon className="h-5 w-5" />
                    </Menu.Button>
                    <Menu.Items className="dropdown-menu">
                      <Menu.Item>
                        <button className="dropdown-item">
                          Channel Settings
                        </button>
                      </Menu.Item>
                      <Menu.Item>
                        <button className="dropdown-item">
                          View Members
                        </button>
                      </Menu.Item>
                    </Menu.Items>
                  </Menu>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : messagesData?.messages?.length > 0 ? (
                <>
                  {messagesData.messages.map((message, index) => (
                    <MessageItem
                      key={message.id}
                      message={message}
                      showAvatar={
                        index === 0 || 
                        messagesData.messages[index - 1].user_id !== message.user_id ||
                        new Date(message.created_at).getTime() - new Date(messagesData.messages[index - 1].created_at).getTime() > 300000 // 5 minutes
                      }
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="text-gray-400 mb-4">
                      <HashtagIcon className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Welcome to #{selectedChannel.name}
                    </h3>
                    <p className="text-gray-500">
                      This is the beginning of your conversation.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
                <div className="flex-1">
                  <div className="relative">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      placeholder={`Message #${selectedChannel.name}`}
                      rows={1}
                      className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      style={{ minHeight: '44px', maxHeight: '120px' }}
                    />
                    <div className="absolute right-2 bottom-2 flex items-center space-x-1">
                      <button
                        type="button"
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      >
                        <PaperClipIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      >
                        <FaceSmileIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!message.trim() || sendMessageMutation.isLoading}
                  className="p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendMessageMutation.isLoading ? (
                    <LoadingSpinner size="sm" color="white" />
                  ) : (
                    <PaperAirplaneIcon className="h-4 w-4" />
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <HashtagIcon className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Welcome to Chat
              </h3>
              <p className="text-gray-500 mb-6">
                Select a channel to start messaging with your team.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Channel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Channel Modal */}
      <CreateChannelModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          queryClient.invalidateQueries(['chat', 'channels']);
        }}
      />
      </div>
    </div>
  );
};


const MessageItem = ({ message, showAvatar }) => {
  return (
    <div className={`flex space-x-3 ${showAvatar ? '' : 'ml-11'}`}>
      {showAvatar && (
        <div className="flex-shrink-0">
          <Avatar
            user={{
              first_name: message.first_name,
              last_name: message.last_name,
              avatar_url: message.avatar_url,
            }}
            size="sm"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        {showAvatar && (
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium text-gray-900">
              {message.first_name} {message.last_name}
            </span>
            <span className="text-xs text-gray-500">
              {formatChatTime(message.created_at)}
            </span>
          </div>
        )}
        <div className="text-sm text-gray-700 whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    </div>
  );
};

const ChannelItem = ({ channel, isActive, onClick, isProjectChannel = false, className = "" }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-150 ${
        isActive 
          ? 'bg-primary-100 text-primary-700' 
          : 'text-gray-700 hover:bg-gray-100'
      } ${className}`}
    >
      <div className="flex-shrink-0">
        {channel.type === 'direct' ? (
          <UserGroupIcon className="h-4 w-4" />
        ) : channel.type === 'project' ? (
          <div className="h-4 w-4 bg-primary-500 rounded text-white flex items-center justify-center text-xs font-bold">
            P
          </div>
        ) : (
          <HashtagIcon className="h-4 w-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {channel.name}
        </p>
        {isProjectChannel && channel.project_name && (
          <p className="text-xs text-gray-400 truncate">
            {channel.project_name}
          </p>
        )}
        {channel.last_message && (
          <p className="text-xs text-gray-500 truncate">
            {truncateText(channel.last_message, 30)}
          </p>
        )}
      </div>
      <div className="flex-shrink-0 text-xs text-gray-400">
        {channel.last_message_at && formatChatTime(channel.last_message_at)}
      </div>
    </button>
  );
};

// Component for hierarchical project channel groups
const ProjectChannelGroup = ({ project, isExpanded, onToggle, activeChannelId, onChannelClick }) => {
  return (
    <div className="space-y-1">
      {/* Main Project Channel */}
      <div className="flex items-center">
        <button
          onClick={onToggle}
          className="p-1 hover:bg-gray-100 rounded mr-1"
        >
          {isExpanded ? (
            <ChevronDownIcon className="h-3 w-3 text-gray-400" />
          ) : (
            <ChevronRightIcon className="h-3 w-3 text-gray-400" />
          )}
        </button>
        <ChannelItem
          channel={project}
          isActive={project.id === activeChannelId}
          onClick={() => onChannelClick(project.id)}
          isProjectChannel={true}
          className="flex-1"
        />
      </div>

      {/* Sub-channels */}
      {isExpanded && project.subChannels && project.subChannels.length > 0 && (
        <div className="ml-6 space-y-1">
          {project.subChannels.map((subChannel) => (
            <SubChannelItem
              key={subChannel.id}
              channel={subChannel}
              isActive={subChannel.id === activeChannelId}
              onClick={() => onChannelClick(subChannel.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Component for sub-channels with different styling
const SubChannelItem = ({ channel, isActive, onClick }) => {
  const getChannelIcon = (channelName) => {
    switch (channelName.toLowerCase()) {
      case 'ui-design':
        return '🎨';
      case 'testing':
        return '🧪';
      case 'requirements':
        return '📋';
      case 'issues':
        return '🐛';
      case 'content-creation':
        return '✍️';
      case 'analytics':
        return '📊';
      default:
        return '#';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-2 px-3 py-1.5 rounded-md text-left transition-colors duration-150 text-sm ${
        isActive 
          ? 'bg-primary-100 text-primary-700' 
          : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      <span className="text-xs">{getChannelIcon(channel.name)}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {channel.name}
        </p>
        {channel.last_message && (
          <p className="text-xs text-gray-400 truncate">
            {truncateText(channel.last_message, 25)}
          </p>
        )}
      </div>
      <div className="flex-shrink-0 text-xs text-gray-400">
        {channel.last_message_at && formatChatTime(channel.last_message_at)}
      </div>
    </button>
  );
};

export default Chat;
