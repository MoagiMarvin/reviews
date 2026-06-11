import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getWorkerFromCookies } from "@/lib/workerAuth";

export async function GET() {
    const worker = await getWorkerFromCookies();

    if (!worker) {
        return NextResponse.json({ worker: null });
    }

    const { data: business } = await supabaseAdmin
        .from("businesses")
        .select("id, name, slug")
        .eq("id", worker.business_id)
        .maybeSingle();

    return NextResponse.json({ worker, business });
}