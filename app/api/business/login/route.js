import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function POST(req) {
  try {
    const { email, password } = await req.json()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return Response.json({ error: error.message }, { status: 401 })
    }

    const cookieStore = await cookies()
    cookieStore.set('business_token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7
    })

    return Response.json({ success: true, session: data.session })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}