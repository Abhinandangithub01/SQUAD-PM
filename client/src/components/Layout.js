import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import MantineSidebar from './MantineSidebar';
import NotificationPanel from './NotificationPanel';
import { useTheme } from '../contexts/ThemeContext';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const { isDarkMode } = useTheme();

  const handleNotificationClick = () => {
    setNotificationPanelOpen(true);
  };
  const handleNotificationClose = () => {
    setNotificationPanelOpen(false);
  };

  return (
    <>
      <MantineSidebar onNotificationClick={handleNotificationClick}>
        <Outlet />
      </MantineSidebar>

      {/* Notification Panel */}
      <NotificationPanel 
        isOpen={notificationPanelOpen}
        onClose={handleNotificationClose}
      />
    </>
  );
};

export default Layout;
