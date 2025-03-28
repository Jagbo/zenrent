  if (!propertyId) return null;

  // Use fixed date range for development to match our test data
  const startDate = process.env.NODE_ENV === 'development' 
    ? '2024-10-01' 
    : new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0];
  
  const endDate = process.env.NODE_ENV === 'development'
    ? '2025-03-31'
    : new Date().toISOString().split('T')[0];
  
  const response = await fetch(`/api/finances?propertyId=${propertyId}&startDate=${startDate}&endDate=${endDate}`); 