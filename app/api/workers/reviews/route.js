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
            .select('allow_workers_to_see_ratings')
            .eq('id', worker.business_id)
            .single()

        if (!business || !business.allow_workers_to_see_ratings) {
            return Response.json({ reviews: [], allowed: false })
        }

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

        return Response.json({ reviews: data, allowed: true })

    } catch (err) {
        return Response.json(
            { error: err.message },
            { status: 500 }
        )
    }
}
