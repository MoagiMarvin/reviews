import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getBusinessFromCookies } from "@/lib/auth";

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