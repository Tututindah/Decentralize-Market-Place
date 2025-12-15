import { supabase } from './supabase';
import type { Database } from './database.types';

// Type helpers for Supabase operations
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

export async function handleSupabaseError<T>(
  promise: Promise<{ data: T | null; error: any }>
): Promise<T> {
  const { data, error } = await promise;
  
  if (error) {
    console.error('Supabase error:', error);
    throw new Error(error.message || 'Database operation failed');
  }
  
  if (!data) {
    throw new Error('No data returned from database');
  }
  
  return data;
}

export async function getOrCreateRecord<T extends { id: string }>(
  table: string,
  matchColumn: string,
  matchValue: string,
  createData: any
): Promise<T> {
  // Try to find existing record
  const { data: existing, error: findError } = await supabase
    .from(table)
    .select('*')
    .eq(matchColumn, matchValue)
    .single();

  if (!findError && existing) {
    return existing as T;
  }

  // Create new record if not found
  const { data: created, error: createError } = await supabase
    .from(table)
    .insert(createData)
    .select()
    .single();

  if (createError) {
    throw new Error(createError.message);
  }

  return created as T;
}
