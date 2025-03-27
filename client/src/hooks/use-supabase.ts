import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import {
  fetchFromSupabase,
  fetchOneFromSupabase,
  insertToSupabase,
  updateInSupabase,
  deleteFromSupabase
} from '@/lib/supabase';

/**
 * Custom hook for Supabase data fetching and mutations
 * @param table Table name in Supabase
 * @returns Object with query and mutation functions
 */
export function useSupabase(table: string) {
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Query for fetching data with pagination
  const useSupabaseQuery = (options: {
    filters?: Record<string, any>;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
    enabled?: boolean;
  } = {}) => {
    return useQuery({
      queryKey: [table, pageIndex, pageSize, options],
      queryFn: () => fetchFromSupabase(table, {
        ...options,
        page: pageIndex,
        pageSize
      }),
      enabled: options.enabled !== false,
      retry: 1,
      retryDelay: 1000,
      staleTime: 30000,
      gcTime: 60000,
    });
  };

  // Query for fetching a single record
  const useSupabaseRecord = (id: number | string | null | undefined, options = { enabled: true }) => {
    return useQuery({
      queryKey: [table, id],
      queryFn: () => fetchOneFromSupabase(table, id as string | number),
      enabled: !!id && options.enabled !== false,
      retry: 1,
      retryDelay: 1000,
      staleTime: 30000,
      gcTime: 60000,
    });
  };

  // Mutation for creating records
  const useSupabaseCreate = () => {
    return useMutation({
      mutationFn: (data: any) => insertToSupabase(table, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [table] });
      },
    });
  };

  // Mutation for updating records
  const useSupabaseUpdate = () => {
    return useMutation({
      mutationFn: ({ id, data }: { id: number | string; data: any }) => 
        updateInSupabase(table, id, data),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: [table] });
        queryClient.invalidateQueries({ queryKey: [table, variables.id] });
      },
    });
  };

  // Mutation for deleting records
  const useSupabaseDelete = () => {
    return useMutation({
      mutationFn: (id: number | string) => deleteFromSupabase(table, id),
      onSuccess: (_, id) => {
        queryClient.invalidateQueries({ queryKey: [table] });
        queryClient.invalidateQueries({ queryKey: [table, id] });
      },
    });
  };

  return {
    useSupabaseQuery,
    useSupabaseRecord,
    useSupabaseCreate,
    useSupabaseUpdate,
    useSupabaseDelete,
    pageIndex,
    pageSize,
    setPageIndex,
    setPageSize
  };
}