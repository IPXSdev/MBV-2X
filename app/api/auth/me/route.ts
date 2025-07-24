import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking user session...')
    
    const user = await getCurrentUser()
    
    if (!user) {
      console.log('❌ No user session found')
      return NextResponse.json({ user: null }, { status: 401 })
    }
    
    console.log('✅ User session found:', { id: user.id, email: user.email, role: user.role })
    
    return NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      }
    })
  } catch (error) {
    console.log('❌ Session check error:', error)
    return NextResponse.json({ user: null }, { status: 401 })
  }
}
