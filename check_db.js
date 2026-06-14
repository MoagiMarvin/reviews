const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    'https://odymbuwungtykxrwcbvl.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9keW1idXd1bmd0eWt4cndjYnZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDU1Nzc4MywiZXhwIjoyMDk2MTMzNzgzfQ.ODdtJAKNUs7cMMvT5EiKeoMPBe-j8Vb3RrgUKxv1fpY'
)

async function check() {
    // 1. Get all businesses
    const { data: businesses } = await supabase.from('businesses').select('id, name, slug')
    console.log('\n=== BUSINESSES ===')
    businesses.forEach(b => console.log(`  ID: ${b.id} | Name: ${b.name} | Slug: ${b.slug}`))

    // 2. Count reviews per business
    console.log('\n=== REVIEWS COUNT PER BUSINESS ===')
    for (const biz of businesses) {
        const { data: reviews } = await supabase
            .from('reviews')
            .select('id')
            .eq('business_id', biz.id)
        console.log(`  ${biz.name}: ${reviews.length} reviews`)
    }

    // 3. Get ALL reviews with details
    const { data: allReviews } = await supabase
        .from('reviews')
        .select('id, business_id, rating, feedback, customer_name, category_ratings, worker_id, created_at')
        .order('created_at', { ascending: false })
    
    console.log(`\n=== ALL REVIEWS (${allReviews.length} total) ===`)
    allReviews.forEach(r => {
        const fb = r.feedback ? r.feedback.substring(0, 60) : 'no feedback'
        console.log(`  ID: ${r.id} | Rating: ${r.rating} | Customer: ${r.customer_name || 'Anon'} | Worker: ${r.worker_id || 'none'} | ${r.created_at}`)
        console.log(`    Feedback: "${fb}"`)
        if (r.category_ratings) console.log(`    Categories: ${JSON.stringify(r.category_ratings)}`)
    })

    // 4. Count requests per business
    console.log('\n=== REQUESTS COUNT PER BUSINESS ===')
    for (const biz of businesses) {
        const { data: requests } = await supabase
            .from('requests')
            .select('id')
            .eq('business_id', biz.id)
        console.log(`  ${biz.name}: ${requests.length} requests`)
    }

    // 5. Check the reviews query WITH workers join (what the API does)
    console.log('\n=== API QUERY TEST (with workers join) ===')
    for (const biz of businesses) {
        const { data, error } = await supabase
            .from('reviews')
            .select('*, workers(display_name)')
            .eq('business_id', biz.id)
            .order('created_at', { ascending: false })
        
        if (error) {
            console.log(`  ${biz.name}: ERROR - ${error.message}`)
            // Try without the join
            const { data: d2, error: e2 } = await supabase
                .from('reviews')
                .select('*')
                .eq('business_id', biz.id)
            console.log(`  ${biz.name} (no join): ${e2 ? 'ERROR - ' + e2.message : d2.length + ' reviews'}`)
        } else {
            console.log(`  ${biz.name}: ${data.length} reviews returned by API query`)
        }
    }
}

check().catch(console.error)
