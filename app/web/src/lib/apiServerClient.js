const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const apiFetch = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An error occurred' }));
    const errorMessage = errorData.error?.message || errorData.message || 'An error occurred';
    throw new Error(errorMessage);
  }

  return response.json();
};

export default apiFetch;
