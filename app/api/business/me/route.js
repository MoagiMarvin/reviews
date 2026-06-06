import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function GET() {
    try {
        const cookieStore = await cookies()
        const businessId = cookieStore.get('business_id')?.value

        if (!businessId) {
            return Response.json(
                { error: 'Not logged in' },
                { status: 401 }
            )
        }

        const { data, error } = await supabaseAdmin
            .from('businesses')
            .select('id, name, slug, email, google_review_link')
            .eq('id', businessId)
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