import React from 'react';
import clsx from 'clsx';
import { generateInitials, generateAvatarColor } from '../utils/helpers';

const Avatar = ({ 
  user, 
  size = 'md', 
  className = '', 
  showOnlineStatus = false,
  isOnline = false 
}) => {
  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
    xl: 'h-16 w-16 text-xl',
    '2xl': 'h-20 w-20 text-2xl',
  };

  const statusSizeClasses = {
    xs: 'h-1.5 w-1.5',
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
    xl: 'h-3.5 w-3.5',
    '2xl': 'h-4 w-4',
  };

  const name = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '';
  const initials = generateInitials(user?.first_name, user?.last_name);
  const avatarColor = generateAvatarColor(name);

  return (
    <div className={clsx('relative inline-block', className)}>
      {user?.avatar_url ? (
        <img
          className={clsx(
            'rounded-full object-cover',
            sizeClasses[size]
          )}
          src={user.avatar_url}
          alt={name}
        />
      ) : (
        <div
          className={clsx(
            'rounded-full flex items-center justify-center text-white font-medium',
            sizeClasses[size],
            avatarColor
          )}
        >
          {initials}
        </div>
      )}
      
      {showOnlineStatus && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-white',
            statusSizeClasses[size],
            isOnline ? 'bg-green-400' : 'bg-gray-300'
          )}
        />
      )}
    </div>
  );
};

export default Avatar;
