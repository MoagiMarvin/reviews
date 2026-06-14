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

        const { data, error } = await supabaseAdmin
            .from('requests')
            .select('*')
            .eq('business_id', worker.business_id)
            .eq('worker_id', worker.worker_id)
            .order('created_at', { ascending: false })

        if (error) {
            return Response.json(
                { error: error.message },
                { status: 400 }
            )
        }

        return Response.json({ requests: data })

    } catch (err) {
        return Response.json(
            { error: err.message },
            { status: 500 }
        )
    }
}
