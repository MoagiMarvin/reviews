"use client";

import { useEffect, useState } from "react";
import BusinessLayout from "@/components/business/BusinessLayout";

export default function TeamPage() {
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // form state
    const [displayName, setDisplayName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [creating, setCreating] = useState(false);
    const [successInfo, setSuccessInfo] = useState(null);

    // reset password modal state
    const [resetWorkerId, setResetWorkerId] = useState(null);
    const [resetTempPassword, setResetTempPassword] = useState("");
    const [resetting, setResetting] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(null);

    useEffect(() => {
        fetchWorkers();
    }, []);

    const fetchWorkers = async () => {
        try {
            const res = await fetch("/api/workers");
            const data = await res.json();
            setWorkers(data.workers || []);
        } catch (err) {
            console.error("Failed to load workers", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setError("");

        if (!displayName || !username || !password) {
            setError("All fields are required");
            return;
        }

        setCreating(true);
        try {
            const res = await fetch("/api/workers/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ display_name: displayName, username, password }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to create worker");
                setCreating(false);
                return;
            }

            setSuccessInfo({ username, password });
            setDisplayName("");
            setUsername("");
            setPassword("");
            setShowForm(false);
            fetchWorkers();
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setCreating(false);
        }
    };

    const handleResetPassword = async () => {
        if (!resetWorkerId || !resetTempPassword) return;
        setResetting(true);

        try {
            const res = await fetch("/api/workers/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ worker_id: resetWorkerId, temp_password: resetTempPassword }),
            });
            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "Failed to reset password");
            } else {
                setResetSuccess(resetTempPassword);
            }
        } catch {
            alert("Something went wrong. Please try again.");
        } finally {
            setResetting(false);
        }
    };

    return (
        <BusinessLayout>
            <div style={{ padding: "24px", maxWidth: "700px", margin: "0 auto" }}>
                <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>Team</h1>
                <p style={{ color: "#666", marginBottom: "24px", fontSize: "14px" }}>
                    Add staff accounts that can only send review requests — they won't see your
                    dashboard, reviews, or settings.
                </p>

                {!showForm && (
                    <button onClick={() => setShowForm(true)} style={primaryButton}>
                        + Add Worker
                    </button>
                )}

                {showForm && (
                    <form onSubmit={handleCreate} style={card}>
                        <h3 style={{ marginBottom: "16px" }}>New Worker</h3>

                        <label style={label}>Worker's Name</label>
                        <input
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            style={input}
                            placeholder="e.g. John Mokoena"
                        />

                        <label style={label}>Username (used to log in)</label>
                        <input
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                            style={input}
                            placeholder="e.g. john_waiter"
                        />

                        <label style={label}>Temporary Password</label>
                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={input}
                            placeholder="e.g. welcome123"
                        />

                        {error && <p style={{ color: "#d92d20", fontSize: "13px", marginTop: "8px" }}>{error}</p>}

                        <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                            <button type="submit" disabled={creating} style={primaryButton}>
                                {creating ? "Creating..." : "Create Worker"}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} style={secondaryButton}>
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {successInfo && (
                    <div style={successBox}>
                        <strong>Worker created!</strong>
                        <p style={{ margin: "8px 0 4px" }}>Share these login details with them:</p>
                        <p style={{ margin: 0 }}>Company Email: <strong>(your registered email)</strong></p>
                        <p style={{ margin: 0 }}>Username: <strong>{successInfo.username}</strong></p>
                        <p style={{ margin: 0 }}>Temporary Password: <strong>{successInfo.password}</strong></p>
                        <p style={{ marginTop: "8px", fontSize: "13px", color: "#666" }}>
                            They'll be asked to set their own password on first login.
                        </p>
                        <button onClick={() => setSuccessInfo(null)} style={{ ...secondaryButton, marginTop: "12px" }}>
                            Got it
                        </button>
                    </div>
                )}

                <h3 style={{ marginTop: "32px", marginBottom: "12px" }}>Current Team</h3>

                {loading ? (
                    <p>Loading...</p>
                ) : workers.length === 0 ? (
                    <p style={{ color: "#666", fontSize: "14px" }}>No workers added yet.</p>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {workers.map((w) => (
                            <div key={w.id} style={workerRow}>
                                <div>
                                    <strong>{w.display_name}</strong>
                                    <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>@{w.username}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setResetWorkerId(w.id);
                                        setResetTempPassword("");
                                        setResetSuccess(null);
                                    }}
                                    style={secondaryButton}
                                >
                                    Reset Password
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {resetWorkerId && (
                    <div style={modalOverlay}>
                        <div style={card}>
                            <h3 style={{ marginBottom: "12px" }}>Reset Password</h3>
                            {resetSuccess ? (
                                <>
                                    <p>New temporary password set:</p>
                                    <p style={{ fontWeight: 700, fontSize: "18px" }}>{resetSuccess}</p>
                                    <p style={{ fontSize: "13px", color: "#666" }}>
                                        Share this with the worker. They'll be asked to set a new password on next login.
                                    </p>
                                    <button
                                        onClick={() => setResetWorkerId(null)}
                                        style={{ ...primaryButton, marginTop: "12px" }}
                                    >
                                        Done
                                    </button>
                                </>
                            ) : (
                                <>
                                    <label style={label}>New Temporary Password</label>
                                    <input
                                        value={resetTempPassword}
                                        onChange={(e) => setResetTempPassword(e.target.value)}
                                        style={input}
                                        placeholder="e.g. reset123"
                                    />
                                    <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                                        <button onClick={handleResetPassword} disabled={resetting} style={primaryButton}>
                                            {resetting ? "Resetting..." : "Reset"}
                                        </button>
                                        <button onClick={() => setResetWorkerId(null)} style={secondaryButton}>
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </BusinessLayout>
    );
}

const card = {
    backgroundColor: "#fff",
    border: "1px solid #eee",
    borderRadius: "12px",
    padding: "20px",
    marginTop: "12px",
    maxWidth: "400px",
};

const label = {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    marginBottom: "6px",
    marginTop: "12px",
};

const input = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "14px",
    boxSizing: "border-box",
};

const primaryButton = {
    padding: "10px 16px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#111",
    color: "#fff",
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
};

const secondaryButton = {
    padding: "10px 16px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    backgroundColor: "#fff",
    color: "#111",
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
};

const successBox = {
    backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "12px",
    padding: "16px",
    marginTop: "16px",
    maxWidth: "400px",
    fontSize: "14px",
};

const workerRow = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    border: "1px solid #eee",
    borderRadius: "8px",
    backgroundColor: "#fff",
};

const modalOverlay = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
};