import React, { useState, useEffect, useRef } from 'react';
import { 
  PhoneIcon, 
  PhoneXMarkIcon, 
  MicrophoneIcon, 
  SpeakerWaveIcon,
  ComputerDesktopIcon,
  XMarkIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon
} from '@heroicons/react/24/outline';
import Peer from 'simple-peer';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const CallModal = ({ isOpen, onClose, targetUser, taskId }) => {
  const [stream, setStream] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState('');
  const [callerSignal, setCallerSignal] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();
  const socket = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (!isOpen) return;

    // Get user media (audio only initially)
    navigator.mediaDevices.getUserMedia({ 
      video: false, 
      audio: true 
    }).then((currentStream) => {
      setStream(currentStream);
      if (myVideo.current) {
        myVideo.current.srcObject = currentStream;
      }
    }).catch((err) => {
      console.error('Error accessing media devices:', err);
      toast.error('Could not access microphone');
    });

    // Socket event listeners
    if (socket) {
      socket.on('callUser', ({ from, name: callerName, signal }) => {
        setReceivingCall(true);
        setCaller(callerName);
        setCallerSignal(signal);
      });

      socket.on('callAccepted', (signal) => {
        setCallAccepted(true);
        if (connectionRef.current) {
          connectionRef.current.signal(signal);
        }
      });

      socket.on('callEnded', () => {
        setCallEnded(true);
        if (connectionRef.current) {
          connectionRef.current.destroy();
        }
        endCall();
      });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (socket) {
        socket.off('callUser');
        socket.off('callAccepted');
        socket.off('callEnded');
      }
    };
  }, [isOpen, socket, stream]);

  const callUser = () => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream
    });

    peer.on('signal', (data) => {
      socket.emit('callUser', {
        userToCall: targetUser.id,
        signalData: data,
        from: user.id,
        name: `${user.first_name} ${user.last_name}`,
        taskId: taskId
      });
    });

    peer.on('stream', (currentStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = currentStream;
      }
    });

    connectionRef.current = peer;
  };

  const answerCall = () => {
    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream
    });

    peer.on('signal', (data) => {
      socket.emit('answerCall', { signal: data, to: caller });
    });

    peer.on('stream', (currentStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = currentStream;
      }
    });

    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  const endCall = () => {
    setCallEnded(true);
    if (connectionRef.current) {
      connectionRef.current.destroy();
    }
    socket.emit('endCall', { to: targetUser?.id });
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    setCallAccepted(false);
    setReceivingCall(false);
    onClose();
  };

  const toggleMute = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = async () => {
    try {
      if (!isVideoEnabled) {
        // Enable video
        const videoStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        setStream(videoStream);
        if (myVideo.current) {
          myVideo.current.srcObject = videoStream;
        }
        
        // Replace stream in peer connection
        if (connectionRef.current && connectionRef.current.streams) {
          connectionRef.current.replaceTrack(
            stream.getVideoTracks()[0],
            videoStream.getVideoTracks()[0],
            stream
          );
        }
        
        setIsVideoEnabled(true);
      } else {
        // Disable video
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.stop();
          setIsVideoEnabled(false);
        }
      }
    } catch (err) {
      console.error('Error toggling video:', err);
      toast.error('Could not access camera');
    }
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      // Replace video track with screen share
      if (connectionRef.current) {
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = connectionRef.current.streams[0].getVideoTracks()[0];
        
        if (sender) {
          connectionRef.current.replaceTrack(sender, videoTrack, stream);
        }
      }

      if (myVideo.current) {
        myVideo.current.srcObject = screenStream;
      }

      setIsScreenSharing(true);

      // Listen for screen share end
      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

    } catch (err) {
      console.error('Error starting screen share:', err);
      toast.error('Could not start screen sharing');
    }
  };

  const stopScreenShare = async () => {
    try {
      // Get camera stream back
      const cameraStream = await navigator.mediaDevices.getUserMedia({ 
        video: isVideoEnabled, 
        audio: true 
      });

      if (connectionRef.current) {
        const videoTrack = cameraStream.getVideoTracks()[0];
        const sender = stream.getVideoTracks()[0];
        
        if (sender && videoTrack) {
          connectionRef.current.replaceTrack(sender, videoTrack, stream);
        }
      }

      if (myVideo.current) {
        myVideo.current.srcObject = cameraStream;
      }

      setStream(cameraStream);
      setIsScreenSharing(false);
    } catch (err) {
      console.error('Error stopping screen share:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {callAccepted ? 'In Call' : receivingCall ? 'Incoming Call' : 'Starting Call'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Video Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* My Video */}
          <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
            <video
              ref={myVideo}
              muted
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
              You {isScreenSharing && '(Screen)'}
            </div>
          </div>

          {/* Other User's Video */}
          <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
            {callAccepted ? (
              <video
                ref={userVideo}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <PhoneIcon className="h-8 w-8" />
                  </div>
                  <p>{receivingCall ? 'Incoming call...' : 'Connecting...'}</p>
                </div>
              </div>
            )}
            {targetUser && (
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                {targetUser.first_name} {targetUser.last_name}
              </div>
            )}
          </div>
        </div>

        {/* Call Controls */}
        <div className="flex items-center justify-center space-x-4">
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            className={`p-3 rounded-full ${
              isMuted ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'
            } hover:bg-opacity-80 transition-colors`}
          >
            <MicrophoneIcon className="h-5 w-5" />
          </button>

          {/* Video Button */}
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full ${
              isVideoEnabled ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            } hover:bg-opacity-80 transition-colors`}
          >
            {isVideoEnabled ? (
              <VideoCameraIcon className="h-5 w-5" />
            ) : (
              <VideoCameraSlashIcon className="h-5 w-5" />
            )}
          </button>

          {/* Screen Share Button */}
          <button
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            className={`p-3 rounded-full ${
              isScreenSharing ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
            } hover:bg-opacity-80 transition-colors`}
          >
            <ComputerDesktopIcon className="h-5 w-5" />
          </button>

          {/* Answer/Call Button */}
          {receivingCall && !callAccepted ? (
            <button
              onClick={answerCall}
              className="p-3 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
            >
              <PhoneIcon className="h-5 w-5" />
            </button>
          ) : !callAccepted ? (
            <button
              onClick={callUser}
              className="p-3 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              <PhoneIcon className="h-5 w-5" />
            </button>
          ) : null}

          {/* End Call Button */}
          <button
            onClick={endCall}
            className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            <PhoneXMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Call Status */}
        {receivingCall && !callAccepted && (
          <div className="mt-4 text-center">
            <p className="text-gray-600">
              Incoming call from {caller}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallModal;
