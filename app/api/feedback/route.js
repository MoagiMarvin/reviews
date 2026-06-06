import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req) {
    try {
        const {
            businessId,
            customerName,
            rating,
            feedback,
            isPublic,
            categoryRatings
        } = await req.json()

        console.log('Saving review:', {
            businessId,
            rating,
            categoryRatings,
            isPublic
        })

        if (!businessId || !rating) {
            return Response.json(
                { error: 'Business ID and rating are required' },
                { status: 400 }
            )
        }

        const { data, error } = await supabaseAdmin
            .from('reviews')
            .insert({
                business_id: businessId,
                customer_name: customerName || null,
                rating: parseInt(rating),
                feedback: feedback || null,
                is_public: isPublic || false,
                category_ratings: categoryRatings || null
            })
            .select()

        if (error) {
            console.log('Supabase error:', error)
            return Response.json(
                { error: error.message },
                { status: 400 }
            )
        }

        console.log('Review saved:', data)
        return Response.json({ success: true })

    } catch (err) {
        console.log('Error:', err)
        return Response.json(
            { error: err.message },
            { status: 500 }
        )
    }
}