import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET;

export async function getWorkerFromCookies() {
    const cookieStore = await cookies();
    const token = cookieStore.get("worker_session")?.value;

    if (!token) return null;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== "worker") return null;
        return decoded; // { worker_id, business_id, username, display_name, role }
    } catch {
        return null;
    }
}