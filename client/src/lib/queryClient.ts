import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getToken } from "./authUtils";

// Helper function to normalize API URLs
function normalizeUrl(url: string): string {
  // Remove leading slash if present
  const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
  // Remove api prefix if present
  const withoutApi = cleanUrl.startsWith('api/') ? cleanUrl.slice(4) : cleanUrl;
  return `/api/${withoutApi}`;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * Add auth token to request headers if available
 */
function getAuthHeaders(): HeadersInit {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // Add this to signal it's an AJAX request
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
  },
});

export async function apiRequest(method: string, endpoint: string, data?: any) {
  const url = normalizeUrl(endpoint);
  
  try {
    console.log(`Making ${method} request to ${url}`);
    const response = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`API Request failed (${method} ${url}):`, errorData);
      
      // Special handling for auth errors can be done in authUtils.ts
      if (response.status === 401) {
        console.log('Authentication error');
      }
      
      throw {
        status: response.status,
        message: errorData.message || `HTTP error! status: ${response.status}`
      };
    }

    // For 204 No Content responses, return null
    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const jsonData = await response.json();
      console.log(`Response from ${url}:`, jsonData);
      
      // Special handling for login and register endpoints that return tokens
      if ((endpoint.includes('/login') || endpoint.includes('/register')) && jsonData.token) {
        console.log('Token found in response, storing token...');
        import('./authUtils').then(({ setToken }) => {
          setToken(jsonData.token);
        });
      }
      
      return jsonData;
    } else {
      // Handle non-JSON responses
      const text = await response.text();
      try {
        const jsonData = JSON.parse(text);
        
        // Special handling for login and register endpoints that return tokens
        if ((endpoint.includes('/login') || endpoint.includes('/register')) && jsonData.token) {
          console.log('Token found in response (text parsing), storing token...');
          import('./authUtils').then(({ setToken }) => {
            setToken(jsonData.token);
          });
        }
        
        return jsonData;
      } catch (e) {
        throw new Error(`Invalid JSON response: ${text}`);
      }
    }
  } catch (error: any) {
    console.error(`API Request Error (${method} ${url}):`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = normalizeUrl(queryKey[0] as string);
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error(`Query failed (${url}):`, errorData);
      throw {
        status: res.status,
        message: errorData.message || res.statusText
      };
    }

    return await res.json();
  };

// Add a function to check if user is currently authenticated
export async function checkAuthentication() {
  try {
    const token = getToken();
    return !!token;
  } catch (error) {
    console.error('Authentication check failed:', error);
    return false;
  }
}
