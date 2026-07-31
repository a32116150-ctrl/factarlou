import type { SupabaseClient } from '@supabase/supabase-js'

export async function requireUser(supabase: SupabaseClient) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return { user: null, error: 'Unauthorized' }
  }
  return { user, error: null }
}

export async function generateDocNumber(
  supabase: SupabaseClient,
  userId: string,
  type: string,
  prefix: string
): Promise<string> {
  const year = new Date().getFullYear()

  const { data, error } = await supabase.rpc('increment_doc_counter', {
    p_user_id: userId,
    p_type: type,
    p_year: year,
  })

  if (error || !data) {
    throw new Error('Failed to generate document number')
  }

  const paddedNum = String(data).padStart(4, '0')
  return `${prefix}-${year}-${paddedNum}`
}

export async function getSettings(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function getCompany(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}
