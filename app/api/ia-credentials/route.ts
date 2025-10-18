import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { accessKey, secretKey } = await request.json()

    // Upsert credentials (insert or update)
    const { error } = await supabase
      .from('ia_credentials')
      .upsert({
        user_id: user.id,
        ia_username: accessKey,
        ia_password: secretKey,
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('Error saving credentials:', error)
      return NextResponse.json({ error: 'Failed to save credentials' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ hasCredentials: false }, { status: 200 })
    }

    const { data: credentials } = await supabase
      .from('ia_credentials')
      .select('ia_username, ia_password')
      .eq('user_id', user.id)
      .single()

    if (!credentials) {
      return NextResponse.json({ hasCredentials: false })
    }

    return NextResponse.json({ 
      hasCredentials: true,
      username: credentials.ia_username,
      password: credentials.ia_password
    })
  } catch (error) {
    return NextResponse.json({ hasCredentials: false })
  }
}