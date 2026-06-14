import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function POST(req) {
    try {
        const { email, password } = await req.json()

        if (!email || !password) {
            return Response.json(
                { error: 'Email and password are required' },
                { status: 400 }
            )
        }

        const { data, error } = await supabaseAdmin
            .auth.signInWithPassword({ email, password })

        if (error) {
            return Response.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            )
        }

        const cookieStore = await cookies()
        cookieStore.delete('worker_session')
        
        cookieStore.set('business_token', data.session.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7,
            path: '/'
        })

        cookieStore.set('business_id', data.user.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7,
            path: '/'
        })

        return Response.json({ success: true })

    } catch (err) {
        return Response.json(
            { error: err.message },
            { status: 500 }
        )
    }
}