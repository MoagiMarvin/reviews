import { supabaseAdmin } from '@/lib/supabase'
import { sendWhatsApp } from '@/lib/twilio'
import { getBusinessId } from '@/lib/auth'

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
        console.log('Request body:', body)

        const { customerNumber, customerName, delayMinutes } = body

        if (!customerNumber) {
            return Response.json(
                { error: 'Customer number is required' },
                { status: 400 }
            )
        }

        // Format SA number
        const formatted = customerNumber
            .replace(/\s/g, '')
            .replace(/^0/, '+27')

        // Get business details for WhatsApp message
        const { data: business, error: bizError } = await supabaseAdmin
            .from('businesses')
            .select('name, slug, send_delay_minutes')
            .eq('id', businessId)
            .single()

        if (bizError || !business) {
            return Response.json(
                { error: 'Business not found' },
                { status: 404 }
            )
        }

        // Use delay from request or from business settings
        const delay = delayMinutes !== undefined
            ? parseInt(delayMinutes)
            : (business.send_delay_minutes ?? 60)

        console.log('Using delay minutes:', delay)

        const scheduledFor = new Date(Date.now() + delay * 60 * 1000)

        // Save request to database
        const { data: request, error } = await supabaseAdmin
            .from('requests')
            .insert({
                business_id: businessId,
                customer_number: formatted,
                customer_name: customerName || null,
                status: 'pending',
                scheduled_for: scheduledFor
            })
            .select()
            .single()

        if (error) {
            console.log('Insert error:', error)
            return Response.json(
                { error: error.message },
                { status: 400 }
            )
        }

        // If delay is 0 — send immediately
        if (delay === 0) {
            try {
                await sendWhatsApp(formatted, business.name, business.slug)
                await supabaseAdmin
                    .from('requests')
                    .update({
                        status: 'sent',
                        sent_at: new Date().toISOString()
                    })
                    .eq('id', request.id)
                console.log('WhatsApp sent immediately to:', formatted)
            } catch (twilioErr) {
                console.log('Twilio error:', twilioErr.message)
            }
        }

        return Response.json({
            success: true,
            requestId: request.id,
            scheduledFor,
            delay
        })

    } catch (err) {
        console.log('Requests POST error:', err)
        return Response.json(
            { error: err.message },
            { status: 500 }
        )
    }
}

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
            .from('requests')
            .select('*')
            .eq('business_id', businessId)
            .order('created_at', { ascending: false })
            .limit(50)

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