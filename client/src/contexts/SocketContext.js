import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && token) {
      // Initialize socket connection
      const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      // Global event listeners
      newSocket.on('notification', (notification) => {
        toast.success(notification.message, {
          duration: 5000,
        });
      });

      newSocket.on('error', (error) => {
        toast.error(error.message || 'Something went wrong');
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
      };
    } else {
      // Clean up socket if not authenticated
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [isAuthenticated, token]);

  const joinProject = (projectId) => {
    if (socket && projectId) {
      socket.emit('join_project', projectId);
    }
  };

  const leaveProject = (projectId) => {
    if (socket && projectId) {
      socket.emit('leave_project', projectId);
    }
  };

  const joinChannel = (channelId) => {
    if (socket && channelId) {
      socket.emit('join_channel', channelId);
    }
  };

  const leaveChannel = (channelId) => {
    if (socket && channelId) {
      socket.emit('leave_channel', channelId);
    }
  };

  const sendMessage = (channelId, content, type = 'text', replyTo = null) => {
    if (socket && channelId && content) {
      socket.emit('send_message', {
        channelId,
        content,
        type,
        replyTo
      });
    }
  };

  const updateTask = (projectId, task) => {
    if (socket && projectId && task) {
      socket.emit('task_update', {
        projectId,
        task
      });
    }
  };

  const updateKanban = (projectId, update) => {
    if (socket && projectId && update) {
      socket.emit('kanban_update', {
        projectId,
        update
      });
    }
  };

  const value = {
    socket,
    isConnected,
    joinProject,
    leaveProject,
    joinChannel,
    leaveChannel,
    sendMessage,
    updateTask,
    updateKanban,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
