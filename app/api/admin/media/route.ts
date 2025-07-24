import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/auth'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAdmin()
    
    const supabase = createServiceClient()
    
    // List files in audio-submissions bucket
    const { data: files, error } = await supabase.storage
      .from('audio-submissions')
      .list('', {
        limit: 100,
        offset: 0
      })
    
    if (error) {
      console.error('Storage list error:', error)
      throw error
    }

    // Calculate total size
    const totalSize = files?.reduce((acc, file) => acc + (file.metadata?.size || 0), 0) || 0
    
    return NextResponse.json({
      files: files || [],
      totalFiles: files?.length || 0,
      totalSize,
      buckets: ['audio-submissions']
    })
  } catch (error) {
    console.error('Admin media error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch media' },
      { status: 500 }
    )
  }
}
