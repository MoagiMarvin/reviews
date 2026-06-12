import { supabaseAdmin } from '@/lib/supabase'
import { getBusinessId } from '@/lib/auth'

export async function GET() {
    try {
        const businessId = await getBusinessId()

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
            console.log('Settings GET error:', error)
            return Response.json(
                { error: error.message },
                { status: 400 }
            )
        }

        return Response.json({ settings: data })

    } catch (err) {
        console.log('Settings GET catch:', err)
        return Response.json(
            { error: err.message },
            { status: 500 }
        )
    }
}

export async function POST(req) {
    try {
        const businessId = await getBusinessId()

        if (!businessId) {
            return Response.json(
                { error: 'Not logged in' },
                { status: 401 }
            )
        }

        const body = await req.json()
        console.log('Settings POST body:', body)

        const sendDelayMinutes = body.sendDelayMinutes !== undefined
            ? parseInt(body.sendDelayMinutes)
            : 60

        const updateFields = {
            send_delay_minutes: sendDelayMinutes,
            rating_categories: body.ratingCategories || [],
            google_review_link: body.googleReviewLink || null
        }
        if (body.name) {
            updateFields.name = body.name
        }

        const { error } = await supabaseAdmin
            .from('businesses')
            .update(updateFields)
            .eq('id', businessId)

        if (error) {
            console.log('Settings POST error:', error)
            return Response.json(
                { error: error.message },
                { status: 400 }
            )
        }

        console.log('Settings saved — delay:', sendDelayMinutes)
        return Response.json({ success: true })

    } catch (err) {
        console.log('Settings POST catch:', err)
        return Response.json(
            { error: err.message },
            { status: 500 }
        )
    }
}