import React from 'react';

const VersionInfo = ({ className = "" }) => {
  const version = process.env.REACT_APP_VERSION || '1.0.0';
  const buildTimestamp = process.env.REACT_APP_BUILD_TIMESTAMP || 'development';
  const environment = process.env.REACT_APP_ENVIRONMENT || 'development';
  
  // Only show in development or when explicitly requested
  if (environment === 'production' && !window.location.search.includes('debug=true')) {
    return null;
  }

  const buildDate = new Date().toISOString();

  return (
    <div className={`fixed bottom-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg z-50 ${className}`}>
      <div>v{version}</div>
      <div>Build: {buildTimestamp.substring(0, 7)}</div>
      <div>Env: {environment}</div>
      <div>Deployed: {buildDate.substring(0, 16)}</div>
    </div>
  );
};

export default VersionInfo;
