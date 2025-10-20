import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { trackId, playbackUrl } = await request.json()
    
    console.log(`Checking track ${trackId}: ${playbackUrl}`);
    
    let isReady = false;
    
    try {
      // Just try a simple GET request with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(playbackUrl, {
        method: 'HEAD',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log(`Response status: ${response.status}`);
      
      // If we get any successful response, mark as ready
      isReady = response.ok || response.status === 200 || response.status === 302;
      
    } catch (error: any) {
      console.log(`Fetch failed: ${error.message}`);
      
      // If it's a timeout or network error but the item exists on IA, 
      // it might be ready but having CORS/network issues
      // After 5 minutes, assume it's ready
      const { data: track } = await supabase
        .from('tracks')
        .select('created_at')
        .eq('id', trackId)
        .single();
      
      if (track) {
        const createdTime = new Date(track.created_at).getTime();
        const now = Date.now();
        const minutesElapsed = (now - createdTime) / 1000 / 60;
        
        console.log(`Track age: ${minutesElapsed.toFixed(1)} minutes`);
        
        // After 5 minutes, assume ready
        if (minutesElapsed > 5) {
          console.log(`Track is old enough, marking as ready`);
          isReady = true;
        }
      }
    }
    
    if (isReady) {
      const { error: updateError } = await supabase
        .from('tracks')
        .update({ processing: false })
        .eq('id', trackId)

      if (!updateError) {
        console.log(`✅ Track ${trackId} marked as ready`);
      } else {
        console.error(`Failed to update: ${updateError.message}`);
      }
    }
    
    return NextResponse.json({ ready: isReady, trackId })
  } catch (error: any) {
    console.error('Error in check-ia-status:', error.message)
    return NextResponse.json({ ready: false })
  }
}