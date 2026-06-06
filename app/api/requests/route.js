import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function POST(req) {
    try {
        const cookieStore = await cookies()
        const businessId = cookieStore.get('business_id')?.value

        if (!businessId) {
            return Response.json(
                { error: 'Not logged in' },
                { status: 401 }
            )
        }

        const { customerNumber, customerName } = await req.json()

        if (!customerNumber) {
            return Response.json(
                { error: 'Customer number is required' },
                { status: 400 }
            )
        }

        const formatted = customerNumber
            .replace(/\s/g, '')
            .replace(/^0/, '+27')

        const scheduledFor = new Date(Date.now() + 60 * 60 * 1000)

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
            return Response.json(
                { error: error.message },
                { status: 400 }
            )
        }

        return Response.json({
            success: true,
            requestId: request.id,
            scheduledFor
        })

    } catch (err) {
        return Response.json(
            { error: err.message },
            { status: 500 }
        )
    }
}

export async function GET() {
    try {
        const cookieStore = await cookies()
        const businessId = cookieStore.get('business_id')?.value

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