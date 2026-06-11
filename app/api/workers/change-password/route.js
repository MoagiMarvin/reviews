import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("worker_session")?.value;

        if (!token) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch {
            return NextResponse.json({ error: "Session expired" }, { status: 401 });
        }

        if (decoded.role !== "worker") {
            return NextResponse.json({ error: "Not a worker session" }, { status: 403 });
        }

        const { new_password } = await req.json();

        if (!new_password || new_password.length < 4) {
            return NextResponse.json(
                { error: "Password must be at least 4 characters" },
                { status: 400 }
            );
        }

        const password_hash = await bcrypt.hash(new_password, 10);

        const { error } = await supabaseAdmin
            .from("workers")
            .update({ password_hash, must_change_password: false })
            .eq("id", decoded.worker_id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Change password error:", err);
        return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
    }
}