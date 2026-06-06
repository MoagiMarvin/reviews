import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req) {
    try {
        const {
            businessId,
            customerName,
            rating,
            feedback,
            isPublic
        } = await req.json()

        if (!businessId || !rating) {
            return Response.json(
                { error: 'Business ID and rating are required' },
                { status: 400 }
            )
        }

        const { error } = await supabaseAdmin
            .from('reviews')
            .insert({
                business_id: businessId,
                customer_name: customerName || null,
                rating: parseInt(rating),
                feedback: feedback || null,
                is_public: isPublic || false
            })

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