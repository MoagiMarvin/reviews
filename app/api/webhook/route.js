import { supabaseAdmin } from '@/lib/supabase'
import { sendWhatsApp } from '@/lib/twilio'

export async function GET() {
    try {
        const now = new Date().toISOString()

        // Find all pending requests where scheduled time has passed
        const { data: dueRequests, error } = await supabaseAdmin
            .from('requests')
            .select('*, businesses(name, slug)')
            .eq('status', 'pending')
            .lte('scheduled_for', now)

        if (error) {
            return Response.json(
                { error: error.message },
                { status: 400 }
            )
        }

        if (!dueRequests || dueRequests.length === 0) {
            return Response.json({ success: true, processed: 0 })
        }

        let processed = 0

        for (const request of dueRequests) {
            try {
                await sendWhatsApp(
                    request.customer_number,
                    request.businesses.name,
                    request.businesses.slug
                )

                await supabaseAdmin
                    .from('requests')
                    .update({
                        status: 'sent',
                        sent_at: new Date().toISOString()
                    })
                    .eq('id', request.id)

                processed++
            } catch (err) {
                console.error('Failed to send:', err.message)
            }
        }

        return Response.json({ success: true, processed })

    } catch (err) {
        return Response.json(
            { error: err.message },
            { status: 500 }
        )
    }
}