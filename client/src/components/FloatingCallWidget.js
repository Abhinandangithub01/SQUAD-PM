import React, { useState, useEffect, useRef } from 'react';
import {
  PhoneIcon,
  PhoneXMarkIcon,
  MicrophoneIcon,
  VideoCameraIcon,
  ComputerDesktopIcon,
  SpeakerWaveIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  MinusIcon,
  XMarkIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import {
  MicrophoneIcon as MicrophoneIconSolid,
  VideoCameraIcon as VideoCameraIconSolid,
  SpeakerWaveIcon as SpeakerWaveIconSolid,
} from '@heroicons/react/24/solid';

const FloatingCallWidget = ({ 
  isVisible, 
  onClose, 
  callData = {}, 
  onEndCall,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onToggleSpeaker,
  onOpenChat,
  onOpenSettings
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const widgetRef = useRef(null);
  const intervalRef = useRef(null);

  // Start call timer
  useEffect(() => {
    if (isVisible) {
      intervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setCallDuration(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isVisible]);

  // Format call duration
  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle drag functionality
  const handleMouseDown = (e) => {
    if (e.target.closest('.control-button')) return;
    
    setIsDragging(true);
    const rect = widgetRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Keep widget within viewport
    const maxX = window.innerWidth - (isMinimized ? 200 : 320);
    const maxY = window.innerHeight - (isMinimized ? 80 : 200);
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Control handlers
  const handleMute = () => {
    setIsMuted(!isMuted);
    onToggleMute?.(!isMuted);
  };

  const handleVideo = () => {
    setIsVideoOn(!isVideoOn);
    onToggleVideo?.(!isVideoOn);
  };

  const handleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
    onToggleScreenShare?.(!isScreenSharing);
  };

  const handleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    onToggleSpeaker?.(!isSpeakerOn);
  };

  const handleEndCall = () => {
    onEndCall?.();
    onClose?.();
  };

  if (!isVisible) return null;

  return (
    <div
      ref={widgetRef}
      className={`fixed z-[10000] bg-white rounded-xl shadow-2xl border border-gray-200 transition-all duration-300 select-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{
        left: position.x,
        top: position.y,
        width: isMinimized ? '200px' : '320px',
        height: isMinimized ? '80px' : 'auto'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-t-xl">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <div>
            <h3 className="font-semibold text-sm">
              {callData.participantName || 'Active Call'}
            </h3>
            {!isMinimized && (
              <p className="text-xs text-primary-100 flex items-center">
                <ClockIcon className="h-3 w-3 mr-1" />
                {formatDuration(callDuration)}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="control-button p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            <MinusIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="control-button p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
            title="Close widget"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Minimized View */}
      {isMinimized && (
        <div className="p-3 flex items-center justify-between">
          <div className="text-xs text-gray-600">
            {formatDuration(callDuration)}
          </div>
          <button
            onClick={handleEndCall}
            className="control-button p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            title="End call"
          >
            <PhoneXMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Expanded View */}
      {!isMinimized && (
        <div className="p-4 space-y-4">
          {/* Participant Info */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-white font-semibold text-lg">
                {callData.participantName?.charAt(0) || 'U'}
              </span>
            </div>
            <h4 className="font-medium text-gray-900">
              {callData.participantName || 'Unknown User'}
            </h4>
            <p className="text-sm text-gray-500">
              {callData.status || 'Connected'}
            </p>
          </div>

          {/* Call Controls */}
          <div className="grid grid-cols-4 gap-2">
            {/* Mute */}
            <button
              onClick={handleMute}
              className={`control-button p-3 rounded-lg transition-colors ${
                isMuted 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <MicrophoneIconSolid className="h-5 w-5" />
              ) : (
                <MicrophoneIcon className="h-5 w-5" />
              )}
            </button>

            {/* Video */}
            <button
              onClick={handleVideo}
              className={`control-button p-3 rounded-lg transition-colors ${
                !isVideoOn 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={isVideoOn ? 'Turn off video' : 'Turn on video'}
            >
              {isVideoOn ? (
                <VideoCameraIcon className="h-5 w-5" />
              ) : (
                <VideoCameraIconSolid className="h-5 w-5" />
              )}
            </button>

            {/* Screen Share */}
            <button
              onClick={handleScreenShare}
              className={`control-button p-3 rounded-lg transition-colors ${
                isScreenSharing 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
            >
              <ComputerDesktopIcon className="h-5 w-5" />
            </button>

            {/* Speaker */}
            <button
              onClick={handleSpeaker}
              className={`control-button p-3 rounded-lg transition-colors ${
                isSpeakerOn 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={isSpeakerOn ? 'Turn off speaker' : 'Turn on speaker'}
            >
              {isSpeakerOn ? (
                <SpeakerWaveIconSolid className="h-5 w-5" />
              ) : (
                <SpeakerWaveIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Additional Controls */}
          <div className="flex justify-center space-x-2">
            <button
              onClick={onOpenChat}
              className="control-button p-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              title="Open chat"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4" />
            </button>
            
            <button
              onClick={onOpenSettings}
              className="control-button p-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              title="Call settings"
            >
              <Cog6ToothIcon className="h-4 w-4" />
            </button>
            
            <button
              className="control-button p-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              title="Participants"
            >
              <UserGroupIcon className="h-4 w-4" />
            </button>
          </div>

          {/* End Call Button */}
          <button
            onClick={handleEndCall}
            className="control-button w-full p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            <PhoneXMarkIcon className="h-5 w-5 inline mr-2" />
            End Call
          </button>
        </div>
      )}
    </div>
  );
};

export default FloatingCallWidget;
