import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url)
        const slug = searchParams.get('slug')

        if (!slug) {
            return Response.json(
                { error: 'Slug is required' },
                { status: 400 }
            )
        }

        const { data, error } = await supabaseAdmin
            .from('businesses')
            .select('id, name, slug, google_review_link,rating_categories')
            .eq('slug', slug)
            .single()

        if (error || !data) {
            return Response.json(
                { error: 'Business not found' },
                { status: 404 }
            )
        }

        return Response.json({ business: data })

    } catch (err) {
        return Response.json(
            { error: err.message },
            { status: 500 }
        )
    }
}



