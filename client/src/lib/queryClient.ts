import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from './supabase';

const API_BASE_URL = '';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export const apiRequest = async (
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  data?: any
) => {
  try {
    // Get the current session to include the access token in requests
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Include the Supabase access token if available
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    // Build the request options
    const options: RequestInit = {
      method,
      headers,
      credentials: 'include', // Include cookies
    };
    
    // Add body for non-GET requests
    if (method !== 'GET' && data !== undefined) {
      options.body = JSON.stringify(data);
    }
    
    console.log(`API ${method} request to ${endpoint}`, { 
      hasAuth: !!accessToken,
      hasBody: !!options.body
    });
    
    // Make the request
    const response = await fetch(url, options);
    
    // Handle unauthorized responses
    if (response.status === 401) {
      console.warn('Unauthorized API request - session may have expired');
      queryClient.setQueryData(['/api/auth/session'], null);
    }
    
    // Parse the JSON response
    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      responseData = null;
    }
    
    // Handle unsuccessful responses
    if (!response.ok) {
      throw new Error(responseData?.message || `API request failed with status ${response.status}`);
    }
    
    return responseData;
  } catch (error: any) {
    console.error(`API ${method} request to ${endpoint} failed:`, error);
    throw error;
  }
};

// Query function for React Query - wraps apiRequest for GET
export const fetchData = async (endpoint: string) => {
  return apiRequest('GET', endpoint);
};

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});

export default queryClient;
