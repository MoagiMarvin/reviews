import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getBusinessFromCookies } from "@/lib/auth"; // <-- adjust to match your existing helper that reads the JWT cookie

export async function POST(req) {
    try {
        const business = await getBusinessFromCookies();
        if (!business) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { display_name, username, password } = await req.json();

        if (!display_name || !username || !password) {
            return NextResponse.json(
                { error: "display_name, username and password are required" },
                { status: 400 }
            );
        }

        // Check username uniqueness within this business
        const { data: existing } = await supabaseAdmin
            .from("workers")
            .select("id")
            .eq("business_id", business.id)
            .eq("username", username)
            .maybeSingle();

        if (existing) {
            return NextResponse.json(
                { error: "That username is already taken in your team" },
                { status: 409 }
            );
        }

        const password_hash = await bcrypt.hash(password, 10);

        const { data, error } = await supabaseAdmin
            .from("workers")
            .insert({
                business_id: business.id,
                display_name,
                username,
                password_hash,
                must_change_password: true,
            })
            .select("id, display_name, username, created_at")
            .single();

        if (error) throw error;

        return NextResponse.json({ worker: data });
    } catch (err) {
        console.error("Create worker error:", err);
        return NextResponse.json({ error: "Failed to create worker" }, { status: 500 });
    }
}