import React, { useState, useRef, useEffect, Fragment } from 'react';
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
  PhoneIcon,
  VideoCameraIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import amplifyDataService from '../services/amplifyDataService';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { formatChatTime, truncateText } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import Avatar from '../components/Avatar';
import CreateTaskModal from '../components/CreateTaskModal';
import CallModal from '../components/CallModal';
import FloatingCallWidget from '../components/FloatingCallWidget';
import CreateChannelModal from '../components/CreateChannelModal';
import { Menu, Transition } from '@headlessui/react';
import toast from 'react-hot-toast';

const Chat = () => {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [message, setMessage] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProjects, setExpandedProjects] = useState(new Set());
  const [activeTab, setActiveTab] = useState('channels'); // 'channels' or 'dms'
  const [showCallModal, setShowCallModal] = useState(false);
  const [callTarget, setCallTarget] = useState(null);
  const [showFloatingCall, setShowFloatingCall] = useState(false);
  const [activeCallData, setActiveCallData] = useState(null);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();
  const { socket, joinChannel, leaveChannel, sendMessage } = useSocket();
  const { user } = useAuth();

  // Fetch channels from database
  const { data: channelsData, isLoading: channelsLoading } = useQuery({
    queryKey: ['channels'],
    queryFn: async () => {
      try {
        const result = await amplifyDataService.chat.listChannels();
        if (!result.success) {
          console.error('Failed to fetch channels:', result.error);
          return { channels: [] };
        }

        // If no channels exist, create default ones
        if (!result.data || result.data.length === 0) {
          if (user && user.id) {
            const defaultChannels = [
              { 
                name: 'general', 
                description: 'General discussion', 
                type: 'GENERAL', 
                createdById: user.id 
                // projectId omitted - not needed for general channels
              },
              { 
                name: 'team', 
                description: 'Team updates', 
                type: 'GENERAL', 
                createdById: user.id 
              },
              { 
                name: 'random', 
                description: 'Random chat', 
                type: 'GENERAL', 
                createdById: user.id 
              },
            ];

            const createdChannels = [];
            for (const channelData of defaultChannels) {
              try {
                const createResult = await amplifyDataService.chat.getOrCreateChannel(channelData);
                if (createResult.success) {
                  createdChannels.push(createResult.data);
                } else {
                  console.error('Failed to create channel:', channelData.name, createResult.error);
                }
              } catch (error) {
                console.error('Error creating channel:', channelData.name, error);
              }
            }

            return { channels: createdChannels };
          }
        }

        return { channels: result.data || [] };
      } catch (error) {
        console.error('Channel fetch error:', error);
        return { channels: [] };
      }
    },
    enabled: !!user,
  });

  // Fetch users for DMs
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      // TODO: Implement user list with Amplify
      return { users: [] };
    },
  });

  // Auto-select first channel on mount
  useEffect(() => {
    if (!selectedChannel && channelsData?.channels?.length > 0) {
      setSelectedChannel(channelsData.channels[0]);
    }
  }, [channelsData, selectedChannel]);

  // Fetch messages for selected channel
  const { data: messagesData, isLoading: messagesLoading, error: messagesError } = useQuery({
    queryKey: ['messages', selectedChannel?.id],
    queryFn: async () => {
      if (!selectedChannel) return [];
      try {
        const result = await amplifyDataService.chat.getMessages(selectedChannel.id);
        if (!result.success) {
          console.error('Failed to fetch messages:', result.error);
          return []; // Return empty array instead of throwing
        }
        return result.data;
      } catch (error) {
        console.error('Message fetch error:', error);
        return []; // Return empty array on error
      }
    },
    enabled: !!selectedChannel,
    refetchInterval: false,
    retry: 1, // Only retry once
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      if (!user || !user.id) {
        throw new Error('User must be logged in to send messages');
      }
      if (!selectedChannel || !selectedChannel.id) {
        throw new Error('No channel selected');
      }
      if (!messageData.content || !messageData.content.trim()) {
        throw new Error('Message cannot be empty');
      }

      const result = await amplifyDataService.chat.sendMessage({
        content: messageData.content.trim(),
        channelId: selectedChannel.id,
        userId: user.id,
        // Note: projectId is not in Message schema
      });
      
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      setMessage('');
      queryClient.invalidateQueries(['messages', selectedChannel?.id]);
      
      // Send real-time message via socket
      if (socket && selectedChannel?.id) {
        sendMessage(selectedChannel.id, message);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send message');
    },
  });

  // Socket event handlers
  useEffect(() => {
    if (!socket || !channelId) return;

    joinChannel(channelId);

    const handleNewMessage = (message) => {
      queryClient.invalidateQueries(['chat', 'messages', channelId]);
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

  const startCall = (targetUser, channelId = null) => {
    if (!targetUser) {
      toast.error('No user selected for call');
      return;
    }
    
    setActiveCallData({
      participantName: `${targetUser.first_name} ${targetUser.last_name}`,
      participantId: targetUser.id,
      channelId: channelId,
      status: 'Connecting...',
      type: 'direct'
    });
    setShowFloatingCall(true);
    toast.success(`Starting call with ${targetUser.first_name} ${targetUser.last_name}`);
  };

  const startChannelCall = (channel) => {
    // For channel calls, we can implement a group call or select a specific user
    if (!channel) {
      toast.error('No channel selected for call');
      return;
    }
    
    setActiveCallData({
      participantName: channel.name,
      participantId: channel.id,
      channelId: channel.id,
      status: 'Connecting to channel...',
      type: 'channel'
    });
    setShowFloatingCall(true);
    toast.success(`Starting call for ${channel.name}`);
  };

  // Call control handlers
  const handleEndCall = () => {
    setShowFloatingCall(false);
    setActiveCallData(null);
    toast.success('Call ended');
  };

  const handleToggleMute = (isMuted) => {
    toast.info(isMuted ? 'Microphone muted' : 'Microphone unmuted');
  };

  const handleToggleVideo = (isVideoOn) => {
    toast.info(isVideoOn ? 'Video turned on' : 'Video turned off');
  };

  const handleToggleScreenShare = (isSharing) => {
    toast.info(isSharing ? 'Screen sharing started' : 'Screen sharing stopped');
  };

  const handleToggleSpeaker = (isSpeakerOn) => {
    toast.info(isSpeakerOn ? 'Speaker turned on' : 'Speaker turned off');
  };

  const handleOpenChat = () => {
    toast.info('Opening chat...');
  };

  const handleOpenSettings = () => {
    toast.info('Opening call settings...');
  };

  const filteredUsers = usersData?.users?.filter(user => 
    user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="h-screen flex bg-white">
      <div className="flex-1 flex bg-white overflow-hidden">
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

            {/* Tabs */}
            <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('channels')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'channels'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <HashtagIcon className="h-4 w-4 inline mr-2" />
                Channels
              </button>
              <button
                onClick={() => setActiveTab('dms')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'dms'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <UserIcon className="h-4 w-4 inline mr-2" />
                DMs
              </button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={activeTab === 'channels' ? 'Search channels...' : 'Search users...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Channels/DMs List */}
          <div className="flex-1 overflow-y-auto">
            {(activeTab === 'channels' ? channelsLoading : usersLoading) ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <div className="p-2 space-y-4">
                {activeTab === 'channels' ? (
                  // Channels Content
                  <>
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
                              onCall={() => startChannelCall(channel)}
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
                              onCall={(channel) => startChannelCall(channel)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {filteredChannels.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No channels found</p>
                      </div>
                    )}
                  </>
                ) : (
                  // DMs Content
                  <>
                    <div className="flex items-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <UserIcon className="h-4 w-4 mr-2" />
                      Direct Messages
                    </div>
                    <div className="space-y-1">
                      {filteredUsers.map((user) => (
                        <UserItem
                          key={user.id}
                          user={user}
                          onClick={() => navigate(`/chat/dm/${user.id}`)}
                          onCall={() => startCall(user)}
                        />
                      ))}
                    </div>
                    
                    {filteredUsers.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No users found</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {channelId ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <HashtagIcon className="h-5 w-5 text-gray-400" />
                      <h3 className="font-semibold text-gray-900">
                        {selectedChannel?.name || 'Loading...'}
                      </h3>
                    </div>
                    <span className="text-sm text-gray-500">
                      {selectedChannel?.description}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {selectedChannel?.member_count || 0} members
                    </span>
                    <button
                      onClick={() => startChannelCall(selectedChannel)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                      title="Start call"
                    >
                      <PhoneIcon className="h-5 w-5" />
                    </button>
                    <Menu as="div" className="relative">
                      <Menu.Button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                        <EllipsisVerticalIcon className="h-5 w-5" />
                      </Menu.Button>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                className={`${
                                  active ? 'bg-gray-100' : ''
                                } block w-full px-4 py-2 text-left text-sm text-gray-700`}
                                onClick={() => toast.info('Channel info')}
                              >
                                Channel Info
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                className={`${
                                  active ? 'bg-gray-100' : ''
                                } block w-full px-4 py-2 text-left text-sm text-gray-700`}
                                onClick={() => toast.info('Mute notifications')}
                              >
                                Mute Notifications
                              </button>
                            )}
                          </Menu.Item>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : messagesData?.messages?.length > 0 ? (
                  messagesData.messages.map((msg) => (
                    <MessageItem key={msg.id} message={msg} />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No messages yet. Start the conversation!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={`Message #${selectedChannel?.name || 'channel'}`}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                        disabled={sendMessageMutation.isLoading}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
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
                    className="p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PaperAirplaneIcon className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <HashtagIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Welcome to Chat
                </h3>
                <p className="text-gray-500">
                  Select a channel to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateChannelModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
      
      <CallModal
        isOpen={showCallModal}
        onClose={() => setShowCallModal(false)}
        targetUser={callTarget}
      />

      {/* Floating Call Widget */}
      <FloatingCallWidget
        isVisible={showFloatingCall}
        onClose={() => setShowFloatingCall(false)}
        callData={activeCallData}
        onEndCall={handleEndCall}
        onToggleMute={handleToggleMute}
        onToggleVideo={handleToggleVideo}
        onToggleScreenShare={handleToggleScreenShare}
        onToggleSpeaker={handleToggleSpeaker}
        onOpenChat={handleOpenChat}
        onOpenSettings={handleOpenSettings}
      />
    </div>
  );
};

// Channel Item Component
const ChannelItem = ({ channel, isActive, onClick, onCall }) => (
  <div
    className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
      isActive
        ? 'bg-primary-100 text-primary-900'
        : 'text-gray-700 hover:bg-gray-100'
    }`}
    onClick={onClick}
  >
    <div className="flex items-center space-x-2 flex-1 min-w-0">
      <HashtagIcon className="h-4 w-4 flex-shrink-0" />
      <span className="text-sm font-medium truncate">{channel.name}</span>
      {channel.unread_count > 0 && (
        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
          {channel.unread_count}
        </span>
      )}
    </div>
    <button
      onClick={(e) => {
        e.stopPropagation();
        onCall();
      }}
      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 rounded transition-opacity"
      title="Start call"
    >
      <PhoneIcon className="h-4 w-4" />
    </button>
  </div>
);

// User Item Component for DMs
const UserItem = ({ user, onClick, onCall }) => (
  <div
    className="group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-gray-700 hover:bg-gray-100 transition-colors"
    onClick={onClick}
  >
    <div className="flex items-center space-x-3 flex-1 min-w-0">
      <Avatar user={user} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {user.first_name} {user.last_name}
        </p>
        <p className="text-xs text-gray-500 truncate">{user.email}</p>
      </div>
    </div>
    <button
      onClick={(e) => {
        e.stopPropagation();
        onCall();
      }}
      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 rounded transition-opacity"
      title="Start call"
    >
      <PhoneIcon className="h-4 w-4" />
    </button>
  </div>
);

// Project Channel Group Component
const ProjectChannelGroup = ({ project, isExpanded, onToggle, activeChannelId, onChannelClick, onCall }) => (
  <div>
    <div
      className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-gray-700 hover:bg-gray-100 transition-colors"
      onClick={onToggle}
    >
      <div className="flex items-center space-x-2">
        {isExpanded ? (
          <ChevronDownIcon className="h-4 w-4" />
        ) : (
          <ChevronRightIcon className="h-4 w-4" />
        )}
        <UserGroupIcon className="h-4 w-4" />
        <span className="text-sm font-medium">{project.name}</span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onCall(project);
        }}
        className="p-1 text-gray-400 hover:text-gray-600 rounded"
        title="Start call"
      >
        <PhoneIcon className="h-4 w-4" />
      </button>
    </div>
    {isExpanded && project.subChannels && (
      <div className="ml-6 space-y-1">
        {project.subChannels.map((subChannel) => (
          <ChannelItem
            key={subChannel.id}
            channel={subChannel}
            isActive={subChannel.id === activeChannelId}
            onClick={() => onChannelClick(subChannel.id)}
            onCall={() => onCall(subChannel)}
          />
        ))}
      </div>
    )}
  </div>
);

// Message Item Component
const MessageItem = ({ message }) => (
  <div className="flex items-start space-x-3">
    <Avatar user={message.user} size="sm" />
    <div className="flex-1 min-w-0">
      <div className="flex items-center space-x-2 mb-1">
        <span className="text-sm font-medium text-gray-900">
          {message.user?.first_name} {message.user?.last_name}
        </span>
        <span className="text-xs text-gray-500">
          {formatChatTime(message.created_at)}
        </span>
      </div>
      <p className="text-sm text-gray-700 whitespace-pre-wrap">
        {message.content}
      </p>
    </div>
  </div>
);

export default Chat;
