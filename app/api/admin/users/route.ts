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
    const tier = searchParams.get('tier')
    const search = searchParams.get('search')
    
    const supabase = createServiceClient()
    
    let query = supabase
      .from('users')
      .select(`
        *,
        submissions (count)
      `)
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (tier && tier !== 'all') {
      query = query.eq('tier', tier)
    }
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }
    
    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    const { data: users, error, count } = await query
      .range(from, to)
      .select('*', { count: 'exact' })
    
    if (error) {
      console.error('Users query error:', error)
      throw error
    }

    return NextResponse.json({
      users: users || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })
  } catch (error) {
    console.error('Admin users error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
