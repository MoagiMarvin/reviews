import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { Client } from '@upstash/qstash'

const qstash = new Client({
  token: process.env.QSTASH_TOKEN
})

export async function POST(req) {
  const {
    businessId,
    customerNumber,
    customerName
  } = await req.json()

  if (!businessId || !customerNumber) {
    return Response.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  }

  const formattedNumber = customerNumber
    .replace(/\s/g, '')
    .replace(/^0/, '+27')

  const scheduledFor = new Date(Date.now() + 60 * 60 * 1000)

  const { data: request, error } = await supabaseAdmin
    .from('requests')
    .insert({
      business_id: businessId,
      customer_number: formattedNumber,
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

  await qstash.publishJSON({
    url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook`,
    delay: 3600,
    body: { requestId: request.id }
  })

  return Response.json({ success: true, requestId: request.id })
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const businessId = searchParams.get('businessId')

  if (!businessId) {
    return Response.json(
      { error: 'Missing businessId' },
      { status: 400 }
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
}