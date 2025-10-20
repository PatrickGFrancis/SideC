import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; trackId: string }> }
) {
  try {
    const { id, trackId } = await params
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { duration } = await request.json()

    // Verify album belongs to user
    const { data: album } = await supabase
      .from('albums')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

    // Update track duration
    const { error: updateError } = await supabase
      .from('tracks')
      .update({ duration })
      .eq('id', trackId)
      .eq('album_id', id)

    if (updateError) {
      console.error('Error updating duration:', updateError)
      return NextResponse.json({ error: 'Failed to update duration' }, { status: 500 })
    }

    // Revalidate the album page cache
    revalidatePath(`/album/${id}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}