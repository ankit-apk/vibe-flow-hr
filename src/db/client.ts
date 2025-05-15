import { executeQuery } from '@/services/apiClient';

// This is a frontend-friendly wrapper that will call our API instead of directly using pg
export const query = async (text: string, params: any[] = []) => {
  return executeQuery(text, params);
};

export default { query }; 