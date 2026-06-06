import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req) {
    try {
        const { name, email, password, googleReviewLink } = await req.json()

        if (!name || !email || !password) {
            return Response.json(
                { error: 'Name, email and password are required' },
                { status: 400 }
            )
        }

        // Create auth user
        const { data: authData, error: authError } = await supabaseAdmin
            .auth.admin.createUser({
                email,
                password,
                email_confirm: true
            })

        if (authError) {
            return Response.json(
                { error: authError.message },
                { status: 400 }
            )
        }

        // Create slug from business name
        const slug = name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')

        // Save business to database
        const { error: bizError } = await supabaseAdmin
            .from('businesses')
            .insert({
                id: authData.user.id,
                name,
                slug,
                email,
                google_review_link: googleReviewLink || null
            })

        if (bizError) {
            return Response.json(
                { error: bizError.message },
                { status: 400 }
            )
        }

        return Response.json({ success: true })

    } catch (err) {
        return Response.json(
            { error: err.message },
            { status: 500 }
        )
    }
}