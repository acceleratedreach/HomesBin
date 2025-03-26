import { QueryClient, QueryFunction } from "@tanstack/react-query";

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
      credentials: 'include', // Always include credentials
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest', // Add this to signal it's an AJAX request
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`API Request failed (${method} ${url}):`, errorData);
      
      // Specially handle authentication errors
      if (response.status === 401) {
        console.log('Authentication error, invalidating session cache');
        queryClient.invalidateQueries({ queryKey: ['/api/auth/session'] });
      }
      
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    // For 204 No Content responses, return null
    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const jsonData = await response.json();
      console.log(`Response from ${url}:`, jsonData);
      
      // For authentication endpoints, invalidate session cache immediately
      if (url.includes('/api/auth/')) {
        console.log('Auth endpoint accessed, force refreshing auth state');
        await queryClient.invalidateQueries();
      }
      
      return jsonData;
    } else {
      // Handle non-JSON responses
      const text = await response.text();
      try {
        return JSON.parse(text);
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
      credentials: "include",
      headers: {
        'Accept': 'application/json',
      },
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error(`Query failed (${url}):`, errorData);
      throw new Error(errorData.message || res.statusText);
    }

    return await res.json();
  };

// Add a function to check if user is currently authenticated
export async function checkAuthentication() {
  try {
    const response = await fetch(normalizeUrl('/api/auth/session'), {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      }
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return !!data?.user;
  } catch (error) {
    console.error('Authentication check failed:', error);
    return false;
  }
}
