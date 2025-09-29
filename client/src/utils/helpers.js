import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';

// Date formatting utilities
export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
  if (!date) return '';
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, formatStr);
};

export const formatDateTime = (date) => {
  if (!date) return '';
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, 'MMM dd, yyyy HH:mm');
};

export const formatRelativeTime = (date) => {
  if (!date) return '';
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(parsedDate)) {
    return format(parsedDate, 'HH:mm');
  } else if (isYesterday(parsedDate)) {
    return 'Yesterday';
  } else {
    return formatDistanceToNow(parsedDate, { addSuffix: true });
  }
};

export const formatChatTime = (date) => {
  if (!date) return '';
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(parsedDate)) {
    return format(parsedDate, 'HH:mm');
  } else if (isYesterday(parsedDate)) {
    return 'Yesterday ' + format(parsedDate, 'HH:mm');
  } else {
    return format(parsedDate, 'MMM dd HH:mm');
  }
};

// Priority utilities
export const getPriorityColor = (priority) => {
  const colors = {
    urgent: 'text-danger-600 bg-danger-50 border-danger-200',
    high: 'text-warning-600 bg-warning-50 border-warning-200',
    medium: 'text-primary-600 bg-primary-50 border-primary-200',
    low: 'text-gray-600 bg-gray-50 border-gray-200',
  };
  return colors[priority] || colors.medium;
};

export const getPriorityIcon = (priority) => {
  const icons = {
    urgent: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢',
  };
  return icons[priority] || icons.medium;
};

// Status utilities
export const getStatusColor = (status) => {
  const statusColors = {
    'Backlog': 'bg-gray-100 text-gray-800',
    'To Do': 'bg-red-100 text-red-800',
    'In Progress': 'bg-yellow-100 text-yellow-800',
    'Review': 'bg-purple-100 text-purple-800',
    'Done': 'bg-green-100 text-green-800',
    'Planning': 'bg-gray-100 text-gray-800',
    'Development': 'bg-blue-100 text-blue-800',
    'Testing': 'bg-yellow-100 text-yellow-800',
    'Deployment': 'bg-green-100 text-green-800',
  };
  return statusColors[status] || 'bg-gray-100 text-gray-800';
};

// Role utilities
export const getRoleColor = (role) => {
  const roleColors = {
    admin: 'bg-red-100 text-red-800',
    project_manager: 'bg-purple-100 text-purple-800',
    owner: 'bg-indigo-100 text-indigo-800',
    member: 'bg-blue-100 text-blue-800',
    viewer: 'bg-gray-100 text-gray-800',
  };
  return roleColors[role] || roleColors.member;
};

export const getRoleLabel = (role) => {
  const roleLabels = {
    admin: 'Admin',
    project_manager: 'Project Manager',
    owner: 'Owner',
    member: 'Member',
    viewer: 'Viewer',
  };
  return roleLabels[role] || 'Member';
};

// File utilities
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileIcon = (mimeType) => {
  // This function now returns a string identifier for the icon type
  // The actual icon component will be rendered in the Files component
  if (!mimeType) return 'document';
  
  if (mimeType.startsWith('image/')) return 'photo';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'music';
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document-text';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'chart';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return 'archive';
  
  return 'document';
};

// Text utilities
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const generateInitials = (firstName, lastName) => {
  if (!firstName && !lastName) return 'U';
  const first = firstName ? firstName.charAt(0).toUpperCase() : '';
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  return first + last;
};

// Color utilities
export const generateAvatarColor = (name) => {
  const colors = [
    'bg-red-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500',
    'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-gray-500'
  ];
  
  if (!name) return colors[0];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

// Validation utilities
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  return password && password.length >= 6;
};

// Array utilities
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
};

export const sortBy = (array, key, direction = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

// URL utilities
export const buildQueryString = (params) => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, value);
    }
  });
  
  return searchParams.toString();
};

// Local storage utilities
export const getFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

export const setToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
};

export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

// Debounce utility
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Copy to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

// Download file
export const downloadFile = (url, filename) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
