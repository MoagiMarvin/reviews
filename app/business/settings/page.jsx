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
    { label: '30 minutes', value: 30 },
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
    const [delay, setDelay] = useState(60)
    const [categories, setCategories] = useState(['Overall experience'])
    const [newCategory, setNewCategory] = useState('')
    const [googleLink, setGoogleLink] = useState('')

    useEffect(() => { loadSettings() }, [])

    async function loadSettings() {
        try {
            const [bizRes, settingsRes] = await Promise.all([
                fetch('/api/business/me'),
                fetch('/api/business/settings')
            ])

            const bizData = await bizRes.json()
            const settingsData = await settingsRes.json()

            console.log('Settings loaded:', settingsData)

            if (bizData.business) setBusiness(bizData.business)

            if (settingsData.settings) {
                const s = settingsData.settings
                // Handle 0 (instant) correctly
                setDelay(s.send_delay_minutes !== null && s.send_delay_minutes !== undefined
                    ? s.send_delay_minutes
                    : 60)
                setCategories(s.rating_categories?.length
                    ? s.rating_categories
                    : ['Overall experience'])
                setGoogleLink(s.google_review_link || '')
            }
        } catch (err) {
            console.log('Load settings error:', err)
            setError('Failed to load settings')
        } finally {
            setLoading(false)
        }
    }

    async function handleSave() {
        setSaving(true)
        setError('')
        setSaved(false)

        console.log('Saving delay:', delay)

        const res = await fetch('/api/business/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sendDelayMinutes: delay,
                ratingCategories: categories,
                googleReviewLink: googleLink
            })
        })

        const data = await res.json()
        console.log('Save response:', data)

        if (data.error) {
            setError(data.error)
            setSaving(false)
            return
        }

        setSaved(true)
        setSaving(false)
        setTimeout(() => setSaved(false), 3000)
    }

    function applyPreset(preset) {
        setCategories(PRESETS[preset])
    }

    function addCategory() {
        if (!newCategory.trim()) return
        if (categories.includes(newCategory.trim())) return
        setCategories([...categories, newCategory.trim()])
        setNewCategory('')
    }

    function removeCategory(index) {
        if (categories.length === 1) return
        setCategories(categories.filter((_, i) => i !== index))
    }

    if (loading) return (
        <div style={centerStyle}>
            <p style={{ color: '#888' }}>Loading...</p>
        </div>
    )

    return (
        <BusinessLayout>
            <Sidebar business={business} />
            <div style={mainStyle} className="main-with-sidebar">
                <div style={pageStyle}>

                    <h1 style={pageTitleStyle}>Settings</h1>
                    <p style={pageSubStyle}>Manage your feedback preferences</p>

                    {error && <div style={errorStyle}>{error}</div>}
                    {saved && <div style={successStyle}>Settings saved ✓</div>}

                    {/* Google Review Link */}
                    <div style={cardStyle}>
                        <h2 style={cardTitleStyle}>Google review link</h2>
                        <p style={cardSubStyle}>
                            Where happy customers get sent to leave a Google review
                        </p>
                        <input
                            type="url"
                            placeholder="https://g.page/r/..."
                            value={googleLink}
                            onChange={e => setGoogleLink(e.target.value)}
                            style={inputStyle}
                        />
                        <p style={hintStyle}>
                            Get this from Google Business Profile → Get more reviews
                        </p>
                    </div>

                    {/* Delay */}
                    <div style={cardStyle}>
                        <h2 style={cardTitleStyle}>Message delay</h2>
                        <p style={cardSubStyle}>
                            How long after submitting a number before the WhatsApp sends
                        </p>
                        <div style={delayGridStyle}>
                            {DELAYS.map(d => (
                                <button
                                    key={d.value}
                                    onClick={() => setDelay(d.value)}
                                    style={{
                                        ...delayBtnStyle,
                                        background: delay === d.value ? '#111' : '#f9fafb',
                                        color: delay === d.value ? '#fff' : '#555',
                                        border: delay === d.value
                                            ? '1px solid #111'
                                            : '1px solid #e5e5e5'
                                    }}
                                >
                                    {d.label}
                                </button>
                            ))}
                        </div>
                        <p style={{ ...hintStyle, marginTop: '0.75rem' }}>
                            Currently selected: <strong>
                                {DELAYS.find(d => d.value === delay)?.label || `${delay} minutes`}
                            </strong>
                        </p>
                    </div>

                    {/* Rating categories */}
                    <div style={cardStyle}>
                        <h2 style={cardTitleStyle}>Rating categories</h2>
                        <p style={cardSubStyle}>
                            What customers rate when they leave feedback
                        </p>

                        <p style={labelStyle}>Quick presets</p>
                        <div style={presetGridStyle}>
                            {Object.keys(PRESETS).map(preset => (
                                <button
                                    key={preset}
                                    onClick={() => applyPreset(preset)}
                                    style={presetBtnStyle}
                                >
                                    {preset}
                                </button>
                            ))}
                        </div>

                        <p style={{ ...labelStyle, marginTop: '1.25rem' }}>
                            Current categories
                        </p>
                        <div style={{ marginBottom: '1rem' }}>
                            {categories.map((cat, i) => (
                                <div key={i} style={catRowStyle}>
                                    <span style={{ fontSize: '0.875rem', color: '#111' }}>
                                        {cat}
                                    </span>
                                    <button
                                        onClick={() => removeCategory(i)}
                                        style={removeBtnStyle}
                                        disabled={categories.length === 1}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                placeholder="Add custom category..."
                                value={newCategory}
                                onChange={e => setNewCategory(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addCategory()}
                                style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
                            />
                            <button onClick={addCategory} style={addBtnStyle}>
                                Add
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        style={saveBtnStyle}
                    >
                        {saving ? 'Saving...' : 'Save settings'}
                    </button>

                </div>
            </div>
        </BusinessLayout>
    )
}

const centerStyle = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const layoutStyle = { display: 'flex', minHeight: '100vh', background: '#fafafa' }
const mainStyle = { marginLeft: '220px', flex: 1, overflow: 'auto' }
const pageStyle = { maxWidth: '680px', margin: '0 auto', padding: '2rem 1.5rem' }
const pageTitleStyle = { fontSize: '1.4rem', fontWeight: '600', color: '#111', marginBottom: '0.25rem' }
const pageSubStyle = { color: '#888', fontSize: '0.875rem', marginBottom: '1.5rem' }
const cardStyle = { background: '#fff', border: '1px solid #e5e5e5', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' }
const cardTitleStyle = { fontSize: '0.95rem', fontWeight: '600', color: '#111', marginBottom: '0.25rem' }
const cardSubStyle = { fontSize: '0.8rem', color: '#888', marginBottom: '1rem' }
const inputStyle = { width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: '0.5rem' }
const hintStyle = { fontSize: '0.75rem', color: '#aaa' }
const labelStyle = { fontSize: '0.8rem', fontWeight: '500', color: '#555', marginBottom: '0.5rem', display: 'block' }
const delayGridStyle = { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }
const delayBtnStyle = { padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }
const presetGridStyle = { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }
const presetBtnStyle = { padding: '0.4rem 0.875rem', borderRadius: '100px', border: '1px solid #e5e5e5', background: '#f9fafb', color: '#555', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' }
const catRowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0.875rem', background: '#f9fafb', borderRadius: '8px', marginBottom: '0.5rem' }
const removeBtnStyle = { background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '0.8rem', padding: '0' }
const addBtnStyle = { padding: '0.75rem 1.25rem', borderRadius: '8px', background: '#111', color: '#fff', border: 'none', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }
const saveBtnStyle = { width: '100%', padding: '0.875rem', borderRadius: '8px', background: '#111', color: '#fff', fontSize: '0.95rem', fontWeight: '600', border: 'none', cursor: 'pointer', marginTop: '0.5rem' }
const errorStyle = { background: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }
const successStyle = { background: '#f0fdf4', color: '#16a34a', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }