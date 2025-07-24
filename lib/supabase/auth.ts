import { createServiceClient } from './server'
import { getCurrentUser } from '@/lib/auth'

export async function requireAdmin() {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }

  if (user.role !== 'admin' && user.role !== 'master_dev') {
    throw new Error('Admin access required')
  }

  return user
}

export async function requireMasterDev() {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }

  if (user.role !== 'master_dev') {
    throw new Error('Master dev access required')
  }

  return user
}

export async function getUser() {
  return await getCurrentUser()
}
