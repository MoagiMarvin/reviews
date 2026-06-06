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
            .select('send_delay_minutes, rating_categories, name, slug, google_review_link')
            .eq('id', businessId)
            .single()

        if (error) {
            return Response.json(
                { error: error.message },
                { status: 400 }
            )
        }

        return Response.json({ settings: data })

    } catch (err) {
        return Response.json(
            { error: err.message },
            { status: 500 }
        )
    }
}

export async function POST(req) {
    try {
        const cookieStore = await cookies()
        const businessId = cookieStore.get('business_id')?.value

        if (!businessId) {
            return Response.json(
                { error: 'Not logged in' },
                { status: 401 }
            )
        }

        const {
            sendDelayMinutes,
            ratingCategories,
            googleReviewLink
        } = await req.json()

        const { error } = await supabaseAdmin
            .from('businesses')
            .update({
                send_delay_minutes: sendDelayMinutes,
                rating_categories: ratingCategories,
                google_review_link: googleReviewLink
            })
            .eq('id', businessId)

        if (error) {
            return Response.json(
                { error: error.message },
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