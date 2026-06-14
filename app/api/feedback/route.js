import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req) {
    try {
        const {
            businessId,
            customerName,
            rating,
            feedback,
            isPublic,
            categoryRatings,
            requestId
        } = await req.json()

        console.log('Saving review:', {
            businessId,
            rating,
            categoryRatings,
            isPublic,
            requestId
        })

        if (!businessId || !rating) {
            return Response.json(
                { error: 'Business ID and rating are required' },
                { status: 400 }
            )
        }

        let workerId = null
        let validRequestId = null

        if (requestId) {
            const { data: requestRecord } = await supabaseAdmin
                .from('requests')
                .select('id, worker_id, business_id')
                .eq('id', requestId)
                .maybeSingle()

            if (requestRecord && requestRecord.business_id === businessId) {
                workerId = requestRecord.worker_id
                validRequestId = requestRecord.id

                await supabaseAdmin
                    .from('requests')
                    .update({ status: 'reviewed' })
                    .eq('id', validRequestId)
            }
        }

        const { data, error } = await supabaseAdmin
            .from('reviews')
            .insert({
                business_id: businessId,
                customer_name: customerName || null,
                rating: parseInt(rating),
                feedback: feedback || null,
                is_public: isPublic || false,
                category_ratings: categoryRatings || null,
                worker_id: workerId,
                request_id: validRequestId
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