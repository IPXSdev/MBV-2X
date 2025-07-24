import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/auth'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAdmin()
    
    const supabase = createServiceClient()
    
    // Get submission stats
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('status, created_at')
    
    if (submissionsError) {
      console.error('Submissions query error:', submissionsError)
      throw submissionsError
    }

    // Get user stats
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('tier, created_at')
    
    if (usersError) {
      console.error('Users query error:', usersError)
      throw usersError
    }

    // Calculate stats
    const totalSubmissions = submissions?.length || 0
    const pendingSubmissions = submissions?.filter(s => s.status === 'pending').length || 0
    const approvedSubmissions = submissions?.filter(s => s.status === 'approved').length || 0
    const totalUsers = users?.length || 0
    
    // Calculate submissions this month
    const thisMonth = new Date()
    thisMonth.setDate(1)
    const submissionsThisMonth = submissions?.filter(s => 
      new Date(s.created_at) >= thisMonth
    ).length || 0

    return NextResponse.json({
      totalSubmissions,
      pendingSubmissions,
      approvedSubmissions,
      totalUsers,
      submissionsThisMonth
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
