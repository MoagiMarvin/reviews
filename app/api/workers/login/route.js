import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req) {
    try {
        const { company_email, username, password } = await req.json();

        if (!company_email || !username || !password) {
            return NextResponse.json(
                { error: "Company email, username and password are required" },
                { status: 400 }
            );
        }

        // 1. Find the business by its registered email
        const { data: business, error: bizError } = await supabaseAdmin
            .from("businesses")
            .select("id, name, email")
            .eq("email", company_email)
            .maybeSingle();

        if (bizError || !business) {
            return NextResponse.json({ error: "Invalid login details" }, { status: 401 });
        }

        // 2. Find the worker by business_id + username
        const { data: worker, error: workerError } = await supabaseAdmin
            .from("workers")
            .select("id, display_name, username, password_hash, must_change_password, business_id")
            .eq("business_id", business.id)
            .eq("username", username)
            .maybeSingle();

        if (workerError || !worker) {
            return NextResponse.json({ error: "Invalid login details" }, { status: 401 });
        }

        // 3. Check password
        const valid = await bcrypt.compare(password, worker.password_hash);
        if (!valid) {
            return NextResponse.json({ error: "Invalid login details" }, { status: 401 });
        }

        // 4. Issue JWT for worker session (separate cookie from owner auth)
        const token = jwt.sign(
            {
                role: "worker",
                worker_id: worker.id,
                business_id: worker.business_id,
                username: worker.username,
                display_name: worker.display_name,
            },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        const cookieStore = await cookies();
        cookieStore.set("worker_session", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return NextResponse.json({
            success: true,
            must_change_password: worker.must_change_password,
            redirect: worker.must_change_password ? "/business/change-password" : "/business/send",
        });
    } catch (err) {
        console.error("Worker login error:", err);
        return NextResponse.json({ error: "Login failed" }, { status: 500 });
    }
}