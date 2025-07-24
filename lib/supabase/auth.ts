import { getCurrentUser as getAuthUser } from '@/lib/auth'
import { NextRequest } from 'next/server'

// Re-export getCurrentUser for compatibility
export { getCurrentUser } from '@/lib/auth'

export async function requireAdmin(request?: NextRequest) {
  const user = await getAuthUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  if (user.role !== 'admin' && user.role !== 'master_dev') {
    throw new Error('Admin access required')
  }
  
  return user
}

export async function requireMasterDev(request?: NextRequest) {
  const user = await getAuthUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  if (user.role !== 'master_dev') {
    throw new Error('Master dev access required')
  }
  
  return user
}

export async function getUser(request?: NextRequest) {
  try {
    return await getAuthUser()
  } catch {
    return null
  }
}
