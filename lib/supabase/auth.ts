import { getCurrentUser } from '@/lib/auth'
import { NextRequest } from 'next/server'

export async function requireAdmin(request?: NextRequest) {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  if (user.role !== 'admin' && user.role !== 'master_dev') {
    throw new Error('Admin access required')
  }
  
  return user
}

export async function requireMasterDev(request?: NextRequest) {
  const user = await getCurrentUser()
  
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
    return await getCurrentUser()
  } catch {
    return null
  }
}
