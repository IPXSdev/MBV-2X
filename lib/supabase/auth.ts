import { createServiceClient } from './server'
import { getCurrentUser as getAuthUser } from '@/lib/auth'

export async function getUser(userId: string) {
  const supabase = createServiceClient()
  
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user:', error)
    return null
  }

  return user
}

export async function getUserByEmail(email: string) {
  const supabase = createServiceClient()
  
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error) {
    console.error('Error fetching user by email:', error)
    return null
  }

  return user
}

export async function createUser(userData: {
  email: string
  username: string
  full_name: string
  password_hash: string
  role?: string
}) {
  const supabase = createServiceClient()
  
  const { data: user, error } = await supabase
    .from('users')
    .insert([{
      ...userData,
      role: userData.role || 'creator',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single()

  if (error) {
    console.error('Error creating user:', error)
    return null
  }

  return user
}

export async function updateUser(userId: string, updates: Partial<{
  username: string
  full_name: string
  email: string
  role: string
  tier: string
  credits: number
  status: string
}>) {
  const supabase = createServiceClient()
  
  const { data: user, error } = await supabase
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating user:', error)
    return null
  }

  return user
}

export async function deleteUser(userId: string) {
  const supabase = createServiceClient()
  
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId)

  if (error) {
    console.error('Error deleting user:', error)
    return false
  }

  return true
}

export async function getAllUsers(limit = 50, offset = 0) {
  const supabase = createServiceClient()
  
  const { data: users, error, count } = await supabase
    .from('users')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching users:', error)
    return { users: [], total: 0 }
  }

  return { users: users || [], total: count || 0 }
}

export async function searchUsers(query: string, limit = 20) {
  const supabase = createServiceClient()
  
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .or(`username.ilike.%${query}%,email.ilike.%${query}%,full_name.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error searching users:', error)
    return []
  }

  return users || []
}

export async function getUserStats() {
  const supabase = createServiceClient()
  
  const { data: stats, error } = await supabase
    .from('users')
    .select('role, status, tier')

  if (error) {
    console.error('Error fetching user stats:', error)
    return {
      total: 0,
      byRole: {},
      byStatus: {},
      byTier: {}
    }
  }

  const total = stats?.length || 0
  const byRole = stats?.reduce((acc: any, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1
    return acc
  }, {}) || {}
  
  const byStatus = stats?.reduce((acc: any, user) => {
    acc[user.status] = (acc[user.status] || 0) + 1
    return acc
  }, {}) || {}
  
  const byTier = stats?.reduce((acc: any, user) => {
    acc[user.tier] = (acc[user.tier] || 0) + 1
    return acc
  }, {}) || {}

  return {
    total,
    byRole,
    byStatus,
    byTier
  }
}

// Re-export getCurrentUser from the auth module
export { getCurrentUser } from '@/lib/auth'
