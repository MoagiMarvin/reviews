'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/business/Sidebar'
import BusinessLayout from '@/components/business/BusinessLayout'

const PRESETS = {
    Restaurant: ['Food quality', 'Service', 'Atmosphere', 'Value for money'],
    Salon: ['Hair quality', 'Friendliness', 'Cleanliness', 'Value for money'],
    Doctor: ['Wait time', 'Professionalism', 'Explanation', 'Friendliness'],
    Lawyer: ['Communication', 'Professionalism', 'Value for money', 'Response time'],
    'Estate Agent': ['Communication', 'Knowledge', 'Professionalism', 'Response time'],
    General: ['Overall experience']
}

const DELAYS = [
    { label: 'Instant', value: 0 },
    { label: '30 mins', value: 30 },
    { label: '1 hour', value: 60 },
    { label: '2 hours', value: 120 },
    { label: '4 hours', value: 240 },
    { label: '24 hours', value: 1440 }
]

export default function SettingsPage() {
    const [business, setBusiness] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState('')
    
    // Editable States
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [slug, setSlug] = useState('')
    const [googleLink, setGoogleLink] = useState('')
    const [delay, setDelay] = useState(60)
    const [categories, setCategories] = useState(['Overall experience'])
    const [newCategory, setNewCategory] = useState('')
    const [copied, setCopied] = useState(false)
    const [allowWorkersToSeeRatings, setAllowWorkersToSeeRatings] = useState(true)
    const [workerVisibleCategories, setWorkerVisibleCategories] = useState([])

    async function loadSettings() {
        try {
            const [bizRes, settingsRes] = await Promise.all([
                fetch('/api/business/me'),
                fetch('/api/business/settings')
            ])

            const bizData = await bizRes.json()
            const settingsData = await settingsRes.json()

            if (bizData.business) {
                const b = bizData.business
                setBusiness(b)
                setName(b.name || '')
                setEmail(b.email || '')
                setSlug(b.slug || '')
            }

            if (settingsData.settings) {
                const s = settingsData.settings
                setDelay(s.send_delay_minutes !== null && s.send_delay_minutes !== undefined
                    ? s.send_delay_minutes
                    : 60)
                const cats = s.rating_categories?.length
                    ? s.rating_categories
                    : ['Overall experience']
                setCategories(cats)
                const savedVisible = Array.isArray(s.worker_visible_categories)
                    ? s.worker_visible_categories.filter(cat => cats.includes(cat))
                    : []
                setWorkerVisibleCategories(savedVisible)
                setGoogleLink(s.google_review_link || '')
                setAllowWorkersToSeeRatings(s.allow_workers_to_see_ratings !== undefined ? s.allow_workers_to_see_ratings : true)
            }
        } catch (err) {
            console.log('Load settings error:', err)
            setError('Failed to load settings')
        } finally {
            setLoading(false)
        }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { loadSettings() }, [])

    async function handleSave() {
        setSaving(true)
        setError('')
        setSaved(false)

        try {
            const res = await fetch('/api/business/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name,
                    sendDelayMinutes: delay,
                    ratingCategories: categories,
                    googleReviewLink: googleLink,
                    allowWorkersToSeeRatings: allowWorkersToSeeRatings,
                    workerVisibleCategories: workerVisibleCategories
                })
            })

            const data = await res.json()

            if (data.error) {
                setError(data.error)
                setSaving(false)
                return
            }

            // Sync changes with local state so sidebar name updates instantly
            setBusiness(prev => prev ? { ...prev, name: name } : null)
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch (err) {
            setError('An error occurred while saving')
        } finally {
            setSaving(false)
        }
    }

    function applyPreset(preset) {
        const cats = PRESETS[preset]
        setCategories(cats)
        setWorkerVisibleCategories([])
    }

    function addCategory() {
        if (!newCategory.trim()) return
        const trimmed = newCategory.trim()
        if (categories.includes(trimmed)) return
        setCategories([...categories, trimmed])
        setNewCategory('')
    }

    function removeCategory(index) {
        if (categories.length === 1) return
        const removedCat = categories[index]
        setCategories(categories.filter((_, i) => i !== index))
        setWorkerVisibleCategories(workerVisibleCategories.filter(c => c !== removedCat))
    }

    function toggleWorkerVisibility(category) {
        if (workerVisibleCategories.includes(category)) {
            setWorkerVisibleCategories(workerVisibleCategories.filter(c => c !== category))
        } else {
            setWorkerVisibleCategories([...workerVisibleCategories, category])
        }
    }

    function handleCopyLink() {
        if (typeof window === 'undefined') return
        const feedbackUrl = `${window.location.origin}/feedback/${slug}`
        navigator.clipboard.writeText(feedbackUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (loading) return (
        <BusinessLayout>
            <Sidebar business={business} />
            <div style={{ ...centerStyle, paddingLeft: '220px' }}>
                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Loading settings...</p>
            </div>
        </BusinessLayout>
    )

    return (
        <BusinessLayout>
            <style>{`
                .settings-page {
                    max-width: 800px;
                    margin: 0;
                    padding: 2rem 3rem 4rem 3rem;
                    box-sizing: border-box;
                }
                .settings-title {
                    font-size: 1.5rem;
                    fontWeight: 700;
                    color: var(--text-main);
                    letter-spacing: -0.03em;
                    margin-bottom: 0.25rem;
                }
                .settings-sub {
                    color: var(--text-muted);
                    font-size: 0.875rem;
                    margin-bottom: 2rem;
                }
                .settings-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-lg);
                    padding: 1.5rem;
                    margin-bottom: 1.5rem;
                    box-shadow: var(--shadow-sm);
                    transition: box-shadow 0.2s ease;
                }
                .settings-card:hover {
                    box-shadow: var(--shadow-md);
                }
                .settings-card-title {
                    font-size: 1rem;
                    font-weight: 600;
                    color: var(--text-main);
                    margin-bottom: 0.25rem;
                }
                .settings-card-sub {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    margin-bottom: 1.25rem;
                }
                .settings-input {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border-hover);
                    font-size: 0.9rem;
                    outline: none;
                    box-sizing: border-box;
                    font-family: inherit;
                    color: var(--text-main);
                    transition: all 0.15s ease;
                }
                .settings-input:focus {
                    border-color: var(--primary);
                    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.12);
                }
                .settings-input:disabled {
                    background: #f1f5f9;
                    color: var(--text-muted);
                    cursor: not-allowed;
                    border-color: #e2e8f0;
                }
                .delay-grid {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 0.5rem;
                }
                @media (max-width: 480px) {
                    .delay-grid {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }
                }
                .delay-btn {
                    padding: 0.625rem;
                    border-radius: var(--radius-md);
                    font-size: 0.825rem;
                    font-weight: 500;
                    cursor: pointer;
                    font-family: inherit;
                    border: 1px solid var(--border-hover);
                    transition: all 0.15s ease;
                    text-align: center;
                }
                .delay-btn:hover {
                    border-color: var(--text-light);
                }
                .delay-btn.selected {
                    background: var(--text-main) !important;
                    color: #fff !important;
                    border-color: var(--text-main) !important;
                }
                .preset-btn {
                    padding: 0.4rem 0.875rem;
                    border-radius: 100px;
                    border: 1px solid var(--border-hover);
                    background: #f8fafc;
                    color: var(--text-muted);
                    font-size: 0.78rem;
                    font-weight: 500;
                    cursor: pointer;
                    font-family: inherit;
                    transition: all 0.15s ease;
                }
                .preset-btn:hover {
                    background: #f1f5f9;
                    color: var(--text-main);
                    border-color: var(--text-light);
                }
                .cat-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0.625rem 1rem;
                    background: #f8fafc;
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-md);
                    margin-bottom: 0.5rem;
                    transition: all 0.15s ease;
                }
                .cat-row:hover {
                    border-color: var(--border-hover);
                }
                .remove-btn {
                    background: transparent;
                    border: none;
                    color: var(--text-light);
                    cursor: pointer;
                    font-size: 0.875rem;
                    padding: 0.25rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.15s ease;
                }
                .remove-btn:hover:not(:disabled) {
                    color: #ef4444;
                    background: #fef2f2;
                }
                .remove-btn:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }
                .add-btn {
                    padding: 0.75rem 1.25rem;
                    border-radius: var(--radius-md);
                    background: var(--text-main);
                    color: #fff;
                    border: none;
                    font-size: 0.875rem;
                    font-weight: 600;
                    cursor: pointer;
                    font-family: inherit;
                    white-space: nowrap;
                    transition: background 0.15s ease;
                }
                .add-btn:hover {
                    background: #1e293b;
                }
                .save-btn {
                    width: 100%;
                    padding: 0.875rem;
                    border-radius: var(--radius-md);
                    background: var(--primary);
                    color: #fff;
                    font-size: 0.95rem;
                    font-weight: 600;
                    border: none;
                    cursor: pointer;
                    margin-top: 1rem;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 12px rgba(22, 163, 74, 0.2);
                }
                .save-btn:hover:not(:disabled) {
                    background: var(--primary-hover);
                    box-shadow: 0 6px 16px rgba(22, 163, 74, 0.3);
                }
                .save-btn:disabled {
                    background: var(--text-light);
                    opacity: 0.7;
                    cursor: not-allowed;
                    box-shadow: none;
                }
                .status-msg {
                    padding: 0.875rem 1rem;
                    border-radius: var(--radius-md);
                    margin-bottom: 1.5rem;
                    font-size: 0.875rem;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    animation: slideDown 0.2s ease-out;
                }
                @keyframes slideDown {
                    from { transform: translateY(-8px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .copy-badge {
                    background: var(--primary-light);
                    color: var(--primary);
                    border: 1px solid var(--primary-border);
                    font-size: 0.75rem;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    }
                @media (max-width: 767px) {
                    .settings-page {
                        padding: 1.25rem 1rem;
                    }
                }
            `}</style>
            <Sidebar business={business} />
            <div style={mainStyle} className="main-with-sidebar">
                <div className="settings-page">

                    <h1 className="settings-title">Account Settings</h1>
                    <p className="settings-sub">Manage your business profile and feedback preferences</p>

                    {error && (
                        <div className="status-msg" style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            {error}
                        </div>
                    )}
                    {saved && (
                        <div className="status-msg" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Account settings successfully saved
                        </div>
                    )}

                    {/* Section 1: Business Profile */}
                    <div className="settings-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '16px',
                                background: 'linear-gradient(135deg, #16a34a, #10b981)',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyHeight: 'center',
                                justifyContent: 'center',
                                fontSize: '1.25rem',
                                fontWeight: '800',
                                boxShadow: '0 4px 10px rgba(22, 163, 74, 0.15)'
                            }}>
                                {name ? name.slice(0, 2).toUpperCase() : 'RE'}
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)' }}>Business Avatar</h3>
                                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered slug: /{slug}</p>
                            </div>
                        </div>

                        <h2 className="settings-card-title">Business profile</h2>
                        <p className="settings-card-sub">Public details about your organization</p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={labelStyle}>Business name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Enter business name"
                                    className="settings-input"
                                    required
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Slug (Feedback URL identifier)</label>
                                <input
                                    type="text"
                                    value={slug}
                                    disabled
                                    className="settings-input"
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Email address (Read-only)</label>
                                <input
                                    type="email"
                                    value={email}
                                    disabled
                                    className="settings-input"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Feedback Link Widget */}
                    <div className="settings-card" style={{ background: 'linear-gradient(to bottom right, #ffffff, #f8fafc)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h2 className="settings-card-title">Your feedback link</h2>
                                <p className="settings-card-sub">Share this link directly with customers to receive reviews</p>
                            </div>
                            {copied && <span className="copy-badge">Copied!</span>}
                        </div>
                        <div style={{
                            display: 'flex',
                            gap: '0.5rem',
                            background: '#ffffff',
                            border: '1px solid var(--border-hover)',
                            padding: '0.5rem 0.5rem 0.5rem 1rem',
                            borderRadius: '12px',
                            alignItems: 'center'
                        }}>
                            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontFamily: 'monospace', wordBreak: 'break-all', flex: 1 }}>
                                {typeof window !== 'undefined' ? `${window.location.origin}/feedback/${slug}` : `.../feedback/${slug}`}
                            </span>
                            <button
                                onClick={handleCopyLink}
                                style={{
                                    background: 'var(--text-main)',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.78rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'opacity 0.15s'
                                }}
                                onMouseEnter={e => e.target.style.opacity = '0.9'}
                                onMouseLeave={e => e.target.style.opacity = '1'}
                            >
                                Copy Link
                            </button>
                        </div>
                    </div>

                    {/* Section 3: Integrations */}
                    <div className="settings-card">
                        <h2 className="settings-card-title">Google integration</h2>
                        <p className="settings-card-sub">Redirect customers with ratings 4 stars or above to leave a public review here</p>
                        
                        <div>
                            <label style={labelStyle}>Google Review Link</label>
                            <input
                                type="url"
                                placeholder="https://g.page/r/..."
                                value={googleLink}
                                onChange={e => setGoogleLink(e.target.value)}
                                className="settings-input"
                            />
                            <p style={hintStyle}>
                                Link format: <code>https://g.page/r/...</code> or <code>https://search.google.com/local/writereview...</code>
                            </p>
                        </div>
                    </div>

                    {/* Section 4: Customize */}
                    <div className="settings-card">
                        <h2 className="settings-card-title">Preferences & custom settings</h2>
                        <p className="settings-card-sub">Tailor how reviews are delayed and what categories are rated</p>

                        {/* Delay */}
                        <div style={{ marginBottom: '1.75rem' }}>
                            <label style={{ ...labelStyle, marginBottom: '0.5rem' }}>WhatsApp message delay</label>
                            <div className="delay-grid">
                                {DELAYS.map(d => (
                                    <button
                                        key={d.value}
                                        onClick={() => setDelay(d.value)}
                                        className={`delay-btn ${delay === d.value ? 'selected' : ''}`}
                                        style={{
                                            background: delay === d.value ? 'var(--text-main)' : '#ffffff',
                                            color: delay === d.value ? '#ffffff' : 'var(--text-muted)'
                                        }}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Staff Visibility */}
                        <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <input
                                type="checkbox"
                                id="allowWorkersToSeeRatings"
                                checked={allowWorkersToSeeRatings}
                                onChange={e => setAllowWorkersToSeeRatings(e.target.checked)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                            />
                            <div>
                                <label htmlFor="allowWorkersToSeeRatings" style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', cursor: 'pointer', margin: 0 }}>
                                    Allow staff to view their own ratings & feedback
                                </label>
                                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    If enabled, staff members can log in and see their average rating and reviews.
                                </p>
                            </div>
                        </div>

                        {/* Categories */}
                        <div>
                            <label style={{ ...labelStyle, marginBottom: '0.5rem' }}>Rating categories presets</label>
                            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                                {Object.keys(PRESETS).map(preset => (
                                    <button
                                        key={preset}
                                        onClick={() => applyPreset(preset)}
                                        className="preset-btn"
                                    >
                                        {preset}
                                    </button>
                                ))}
                            </div>

                            <label style={{ ...labelStyle, marginBottom: '0.5rem' }}>Active rating parameters</label>
                            <div style={{ marginBottom: '1rem' }}>
                                {categories.map((cat, i) => (
                                    <div key={i} className="cat-row">
                                        <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-main)' }}>
                                            {cat}
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={workerVisibleCategories.includes(cat)}
                                                    onChange={() => toggleWorkerVisibility(cat)}
                                                    style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: 'var(--primary)' }}
                                                />
                                                Show to staff
                                            </label>
                                            <button
                                                onClick={() => removeCategory(i)}
                                                className="remove-btn"
                                                disabled={categories.length === 1}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    placeholder="Create custom category..."
                                    value={newCategory}
                                    onChange={e => setNewCategory(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addCategory()}
                                    className="settings-input"
                                    style={{ flex: 1 }}
                                />
                                <button onClick={addCategory} className="add-btn">
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving || !name.trim()}
                        className="save-btn"
                    >
                        {saving ? 'Saving changes...' : 'Save settings'}
                    </button>

                </div>
            </div>
        </BusinessLayout>
    )
}

const centerStyle = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }
const mainStyle = { width: '100%', minWidth: 0 }
const labelStyle = { fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.03em' }
const hintStyle = { fontSize: '0.72rem', color: 'var(--text-light)', marginTop: '0.4rem' }