"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import WorkerSidebar from "@/components/worker/WorkerSidebar";
import WorkerLayout from "@/components/worker/WorkerLayout";

export default function WorkerChangePasswordPage() {
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [worker, setWorker] = useState(null);
    const [business, setBusiness] = useState(null);
    const router = useRouter();

    useEffect(() => {
        async function loadPage() {
            try {
                const meRes = await fetch('/api/workers/me');
                const meData = await meRes.json();

                if (!meData.worker) {
                    router.push('/business/login');
                    return;
                }

                setWorker(meData.worker);
                setBusiness(meData.business);
            } catch {
                router.push('/business/login');
            } finally {
                setPageLoading(false);
            }
        }

        loadPage();
    }, [router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (password.length < 4) {
            setError("Password must be at least 4 characters");
            return;
        }
        if (password !== confirm) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/workers/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ new_password: password }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Something went wrong");
                setLoading(false);
                return;
            }

            router.push("/worker/send");
        } catch {
            setError("Something went wrong. Please try again.");
            setLoading(false);
        }
    };

    if (pageLoading) return (
        <WorkerLayout>
            <WorkerSidebar worker={worker} business={business} />
            <div style={styles.pageLoading}>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Loading change password page...</p>
            </div>
        </WorkerLayout>
    );

    return (
        <WorkerLayout>
            <WorkerSidebar worker={worker} business={business} />
            <div style={styles.wrapper}>
                <div style={styles.card}>
                    <h1 style={styles.title}>Set Your Password</h1>
                    <p style={styles.subtitle}>
                        For security, please set your own password before continuing.
                    </p>

                    <form onSubmit={handleSubmit}>
                        <label style={styles.label}>New Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={styles.input}
                            placeholder="Enter new password"
                        />

                        <label style={styles.label}>Confirm Password</label>
                        <input
                            type="password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            style={styles.input}
                            placeholder="Confirm new password"
                        />

                        {error && <p style={styles.error}>{error}</p>}

                        <button type="submit" disabled={loading} style={styles.button}>
                            {loading ? "Saving..." : "Save & Continue"}
                        </button>
                    </form>
                </div>
            </div>
        </WorkerLayout>
    );
}

const styles = {
    wrapper: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f7f7f8",
        padding: "16px",
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: "12px",
        padding: "32px 24px",
        maxWidth: "400px",
        width: "100%",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    },
    title: {
        fontSize: "22px",
        fontWeight: 700,
        marginBottom: "8px",
    },
    subtitle: {
        fontSize: "14px",
        color: "#666",
        marginBottom: "24px",
    },
    label: {
        display: "block",
        fontSize: "13px",
        fontWeight: 600,
        marginBottom: "6px",
        marginTop: "16px",
    },
    input: {
        width: "100%",
        padding: "10px 12px",
        borderRadius: "8px",
        border: "1px solid #ddd",
        fontSize: "14px",
        boxSizing: "border-box",
    },
    error: {
        color: "#d92d20",
        fontSize: "13px",
        marginTop: "12px",
    },
    button: {
        width: "100%",
        marginTop: "24px",
        padding: "12px",
        borderRadius: "8px",
        border: "none",
        backgroundColor: "#111",
        color: "#fff",
        fontWeight: 600,
        fontSize: "15px",
        cursor: "pointer",
    },
};
