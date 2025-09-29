import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import NotificationPanel from './NotificationPanel';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);

  const handleNotificationClick = () => {
    setNotificationPanelOpen(true);
  };

  const handleNotificationClose = () => {
    setNotificationPanelOpen(false);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        open={sidebarOpen} 
        setOpen={setSidebarOpen}
        onNotificationClick={handleNotificationClick}
      />
      
      {/* Main content - Full screen */}
      <div className="flex flex-col flex-1 overflow-hidden md:ml-20">
        {/* Page content - Full height */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Notification Panel */}
      <NotificationPanel 
        isOpen={notificationPanelOpen}
        onClose={handleNotificationClose}
      />
    </div>
  );
};

export default Layout;
