import { supabaseAdmin } from '@/lib/supabase'
import { getWorkerFromCookies } from '@/lib/workerAuth'

export async function GET() {
    try {
        const worker = await getWorkerFromCookies()

        if (!worker) {
            return Response.json(
                { error: 'Not logged in as staff' },
                { status: 401 }
            )
        }

        // Check if the owner allows workers to see ratings
        const { data: business } = await supabaseAdmin
            .from('businesses')
            .select('allow_workers_to_see_ratings, rating_categories, worker_visible_categories')
            .eq('id', worker.business_id)
            .single()

        if (!business || !business.allow_workers_to_see_ratings) {
            return Response.json({ reviews: [], allowed: false })
        }

        const visibleCategories = business.worker_visible_categories !== null
            ? business.worker_visible_categories
            : (business.rating_categories || [])

        const { data, error } = await supabaseAdmin
            .from('reviews')
            .select('*, workers(display_name)')
            .eq('business_id', worker.business_id)
            .eq('worker_id', worker.worker_id)
            .order('created_at', { ascending: false })

        if (error) {
            return Response.json(
                { error: error.message },
                { status: 400 }
            )
        }

        // Filter out category_ratings that the owner hasn't checked as visible
        const sanitizedReviews = data.map(review => {
            if (review.category_ratings && typeof review.category_ratings === 'object') {
                const filtered = {}
                Object.entries(review.category_ratings).forEach(([cat, val]) => {
                    if (visibleCategories.includes(cat)) {
                        filtered[cat] = val
                    }
                })
                review.category_ratings = filtered
            }
            return review
        })

        return Response.json({ reviews: sanitizedReviews, allowed: true })

    } catch (err) {
        return Response.json(
            { error: err.message },
            { status: 500 }
        )
    }
}
