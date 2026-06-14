import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getBusinessFromCookies } from "@/lib/auth";

// GET /api/workers — list all workers for the authenticated business
export async function GET() {
    try {
        const business = await getBusinessFromCookies();
        if (!business) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { data: workers, error } = await supabaseAdmin
            .from("workers")
            .select("id, display_name, username, created_at")
            .eq("business_id", business.id)
            .order("created_at", { ascending: true });

        if (error) throw error;

        // Fetch requests and reviews in parallel to calculate stats
        const [requestsRes, reviewsRes] = await Promise.all([
            supabaseAdmin.from("requests").select("id, worker_id").eq("business_id", business.id),
            supabaseAdmin.from("reviews").select("id, worker_id, rating").eq("business_id", business.id)
        ]);

        const requests = requestsRes.data || [];
        const reviews = reviewsRes.data || [];

        const workersWithStats = (workers || []).map(w => {
            const wRequests = requests.filter(r => r.worker_id === w.id);
            const wReviews = reviews.filter(r => r.worker_id === w.id);
            const totalRating = wReviews.reduce((sum, r) => sum + r.rating, 0);
            const avgRating = wReviews.length ? (totalRating / wReviews.length).toFixed(1) : null;
            return {
                ...w,
                requests_count: wRequests.length,
                reviews_count: wReviews.length,
                avg_rating: avgRating
            };
        });

        return NextResponse.json({ workers: workersWithStats });
    } catch (err) {
        console.error("List workers error:", err);
        return NextResponse.json({ error: "Failed to load workers" }, { status: 500 });
    }
}


export async function POST(req) {
    try {
        const business = await getBusinessFromCookies();
        if (!business) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { worker_id, temp_password } = await req.json();

        if (!worker_id || !temp_password) {
            return NextResponse.json(
                { error: "worker_id and temp_password are required" },
                { status: 400 }
            );
        }

        // Make sure this worker belongs to this business
        const { data: worker } = await supabaseAdmin
            .from("workers")
            .select("id, business_id")
            .eq("id", worker_id)
            .maybeSingle();

        if (!worker || worker.business_id !== business.id) {
            return NextResponse.json({ error: "Worker not found" }, { status: 404 });
        }

        const password_hash = await bcrypt.hash(temp_password, 10);

        const { error } = await supabaseAdmin
            .from("workers")
            .update({ password_hash, must_change_password: true })
            .eq("id", worker_id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Reset worker password error:", err);
        return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
    }
}