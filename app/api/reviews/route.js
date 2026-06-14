import { supabaseAdmin } from '@/lib/supabase'
import { getBusinessId } from '@/lib/auth'
import { getWorkerFromCookies } from '@/lib/workerAuth'
import { cookies } from 'next/headers'

export async function GET() {
    try {
        const businessId = await getBusinessId()

        if (!businessId) {
            return Response.json(
                { error: 'Not logged in' },
                { status: 401 }
            )
        }

        // Check if the owner is logged in (business_id cookie exists)
        const cookieStore = await cookies()
        const isOwner = !!cookieStore.get('business_id')?.value
        const worker = isOwner ? null : await getWorkerFromCookies()

        // If worker is logged in (not owner), verify they are allowed to see reviews
        if (worker) {
            const { data: business } = await supabaseAdmin
                .from('businesses')
                .select('allow_workers_to_see_ratings')
                .eq('id', businessId)
                .single()

            if (!business || !business.allow_workers_to_see_ratings) {
                return Response.json({ reviews: [] })
            }
        }

        let query = supabaseAdmin
            .from('reviews')
            .select('*, workers(display_name)')
            .eq('business_id', businessId)

        // Only filter by worker if it's a worker session (not owner)
        if (worker) {
            query = query.eq('worker_id', worker.worker_id)
        }

        const { data, error } = await query
            .order('created_at', { ascending: false })

        if (error) {
            return Response.json(
                { error: error.message },
                { status: 400 }
            )
        }

        return Response.json({ reviews: data })

    } catch (err) {
        return Response.json(
            { error: err.message },
            { status: 500 }
        )
    }
}