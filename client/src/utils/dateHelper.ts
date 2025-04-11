export const formatDateForInput = (dateString: string | number | Date | undefined | null): string => {
  if (!dateString) return '';
  
  try {
    // If it's already in YYYY-MM-DD format, return as is
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }

    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return '';
    
    // Format as YYYY-MM-DD
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

// Add a new function to format date for API
export const formatDateForAPI = (dateString: string | undefined | null): string => {
  if (!dateString) return '';
  
  // If already in correct format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  return formatDateForInput(dateString);
};