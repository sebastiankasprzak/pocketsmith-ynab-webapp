import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

/**
 * Format a timestamp to the user's local timezone with full date and time
 */
export const formatTimestamp = (timestamp: string | Date): string => {
  try {
    const date = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp;
    
    if (!isValid(date)) {
      console.warn('Invalid date provided to formatTimestamp:', timestamp);
      return 'Invalid Date';
    }

    // Format with user's local timezone
    return format(date, 'MMM dd, yyyy HH:mm:ss');
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Invalid Date';
  }
};

/**
 * Format a timestamp to show relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (timestamp: string | Date): string => {
  try {
    const date = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp;
    
    if (!isValid(date)) {
      console.warn('Invalid date provided to formatRelativeTime:', timestamp);
      return 'Invalid Date';
    }

    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Invalid Date';
  }
};

/**
 * Format a timestamp for display in tables (shorter format)
 */
export const formatTableTimestamp = (timestamp: string | Date): string => {
  try {
    const date = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp;
    
    if (!isValid(date)) {
      console.warn('Invalid date provided to formatTableTimestamp:', timestamp);
      return 'Invalid Date';
    }

    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    // If today, show time only
    if (diffInDays === 0) {
      return format(date, 'HH:mm:ss');
    }
    // If within a week, show day and time
    else if (diffInDays < 7) {
      return format(date, 'EEE HH:mm');
    }
    // Otherwise show date and time
    else {
      return format(date, 'MMM dd HH:mm');
    }
  } catch (error) {
    console.error('Error formatting table timestamp:', error);
    return 'Invalid Date';
  }
};

/**
 * Format a timestamp for tooltips (full format with timezone info)
 */
export const formatTooltipTimestamp = (timestamp: string | Date): string => {
  try {
    const date = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp;
    
    if (!isValid(date)) {
      console.warn('Invalid date provided to formatTooltipTimestamp:', timestamp);
      return 'Invalid Date';
    }

    // Use the browser's built-in toLocaleString for full timezone info
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  } catch (error) {
    console.error('Error formatting tooltip timestamp:', error);
    return 'Invalid Date';
  }
};

/**
 * Format duration in milliseconds to human readable format
 */
export const formatDuration = (ms: number): string => {
  if (ms < 0) return '0s';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Get the start of the day for a given number of days ago
 */
export const getDaysAgo = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
};

/**
 * Check if a timestamp is within the last N days
 */
export const isWithinDays = (timestamp: string | Date, days: number): boolean => {
  try {
    const date = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp;
    
    if (!isValid(date)) {
      return false;
    }

    const cutoff = getDaysAgo(days);
    return date >= cutoff;
  } catch (error) {
    console.error('Error checking if date is within days:', error);
    return false;
  }
};