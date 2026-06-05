import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req) {
  const { name, email, password, googleReviewLink } = await req.json()

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    user_metadata: { role: 'business' }
  })

  if (error) {
    return Response.json({ error: error.message }, { status: 400 })
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .trim()

  const { error: bizError } = await supabaseAdmin
    .from('businesses')
    .insert({
      id: data.user.id,
      name,
      slug,
      email,
      google_review_link: googleReviewLink
    })

  if (bizError) {
    return Response.json({ error: bizError.message }, { status: 400 })
  }

  return Response.json({ success: true, slug })
}