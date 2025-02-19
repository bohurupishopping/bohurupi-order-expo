export function formatDate(date: Date | string | number | { seconds: number } | null | undefined): string {
  const fallbackDate = new Date(); // Current date as fallback
  
  try {
    // Type-safe check for Firestore Timestamp
    const d = date instanceof Date ? date :
             typeof date === 'string' ? new Date(date) :
             typeof date === 'number' ? new Date(date) :
             typeof date === 'object' && date !== null && 'seconds' in date ? 
               new Date(date.seconds * 1000) : 
               fallbackDate;

    // Handle invalid dates after conversion
    if (isNaN(d.getTime())) return 'Invalid Date';

    return d.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    console.error('Error formatting date:', error, 'Input:', date);
    return fallbackDate.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }
}

export function formatShortDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
} 