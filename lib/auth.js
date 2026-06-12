import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

/**
 * Returns the business_id for the current request.
 * Works for both business owners (business_id cookie) and workers (worker_session JWT).
 * Returns null if not authenticated.
 */
export async function getBusinessId() {
    try {
        const cookieStore = await cookies()

        // 1. Owner session — direct business_id cookie
        const businessId = cookieStore.get('business_id')?.value
        if (businessId) return businessId

        // 2. Worker session — decode JWT to get business_id
        const workerToken = cookieStore.get('worker_session')?.value
        if (workerToken) {
            const decoded = jwt.verify(workerToken, JWT_SECRET)
            if (decoded?.business_id) return decoded.business_id
        }

        return null
    } catch {
        return null
    }
}

/**
 * Reads the business_id cookie set during login and returns the business record.
 * Returns null if not authenticated or business not found.
 */
export async function getBusinessFromCookies() {
    try {
        const cookieStore = await cookies()
        const businessId = cookieStore.get('business_id')?.value

        if (!businessId) return null

        const { data, error } = await supabaseAdmin
            .from('businesses')
            .select('id, name, slug, email')
            .eq('id', businessId)
            .single()

        if (error || !data) return null

        return data
    } catch {
        return null
    }
}
