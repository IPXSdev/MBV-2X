import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/auth'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await requireAdmin()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    
    const supabase = createServiceClient()
    
    let query = supabase
      .from('submissions')
      .select(`
        *,
        users (
          id,
          name,
          email,
          tier
        )
      `)
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    
    if (search) {
      query = query.or(`track_title.ilike.%${search}%,artist_name.ilike.%${search}%`)
    }
    
    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    const { data: submissions, error, count } = await query
      .range(from, to)
      .select('*', { count: 'exact' })
    
    if (error) {
      console.error('Submissions query error:', error)
      throw error
    }

    return NextResponse.json({
      submissions: submissions || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })
  } catch (error) {
    console.error('Admin submissions error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}
