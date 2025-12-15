import { supabase } from './supabase'
import type { Database } from './database.types'

/**
 * Helper functions to work around TypeScript inference issues with Supabase
 */

export function getTypedTable<T extends keyof Database['public']['Tables']>(
  tableName: T
) {
  return supabase.from(tableName) as any
}

// Type-safe insert helper
export async function insertRow<T extends keyof Database['public']['Tables']>(
  table: T,
  data: Database['public']['Tables'][T]['Insert']
) {
  const { data: result, error } = await (supabase
    .from(table) as any)
    .insert(data)
    .select()
    .single()
  
  if (error) throw error
  return result as Database['public']['Tables'][T]['Row']
}

// Type-safe update helper
export async function updateRow<T extends keyof Database['public']['Tables']>(
  table: T,
  id: string,
  data: Database['public']['Tables'][T]['Update']
) {
  const { data: result, error } = await (supabase
    .from(table) as any)
    .update(data)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return result as Database['public']['Tables'][T]['Row']
}

// Type-safe query helper
export function queryTable<T extends keyof Database['public']['Tables']>(
  table: T
) {
  return supabase.from(table) as any
}
