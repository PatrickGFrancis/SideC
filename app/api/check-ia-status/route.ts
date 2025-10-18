import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { trackId, playbackUrl } = await request.json()
    
    // Check if the IA URL is accessible
    const response = await fetch(playbackUrl, { method: 'HEAD' })
    const isReady = response.ok
    
    if (isReady) {
      // Update the track to mark it as ready
      const { error: updateError } = await supabase
        .from('tracks')
        .update({ processing: false })
        .eq('id', trackId)
        .eq('album_id', (
          await supabase
            .from('tracks')
            .select('album_id')
            .eq('id', trackId)
            .single()
        ).data?.album_id)

      if (updateError) {
        console.error('Error updating track:', updateError)
      }
    }
    
    return NextResponse.json({ ready: isReady })
  } catch (error) {
    console.error('Error checking IA status:', error)
    return NextResponse.json({ ready: false })
  }
}