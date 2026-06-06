'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

export default function FeedbackPage() {
    const { slug } = useParams()
    const [business, setBusiness] = useState(null)
    const [categories, setCategories] = useState(['Overall experience'])
    const [categoryRatings, setCategoryRatings] = useState({})
    const [hoveredCategory, setHoveredCategory] = useState({})
    const [overallRating, setOverallRating] = useState(0)
    const [feedback, setFeedback] = useState('')
    const [name, setName] = useState('')
    const [step, setStep] = useState('rating')
    const [loading, setLoading] = useState(false)
    const [pageLoading, setPageLoading] = useState(true)

    useEffect(() => {
        fetch(`/api/business/public?slug=${slug}`)
            .then(r => r.json())
            .then(d => {
                if (d.business) {
                    setBusiness(d.business)
                    if (d.business.rating_categories?.length) {
                        setCategories(d.business.rating_categories)
                    }
                }
                setPageLoading(false)
            })
            .catch(() => setPageLoading(false))
    }, [slug])

    const handleCategoryRating = (category, value) => {
        const updated = { ...categoryRatings, [category]: value }
        setCategoryRatings(updated)

        const values = Object.values(updated)
        const avg = Math.round(values.reduce((s, v) => s + v, 0) / values.length)
        setOverallRating(avg)

        if (Object.keys(updated).length === categories.length) {
            const hasLowRating = Object.values(updated).some(v => v <= 2)
            const isOverallGood = avg >= 4

            if (hasLowRating && isOverallGood) {
                setTimeout(() => setStep('mixed'), 400)
            } else if (isOverallGood) {
                setTimeout(() => setStep('happy'), 400)
            } else {
                setTimeout(() => setStep('sad'), 400)
            }
        }
    }

    const allCategoriesRated = () => {
        return categories.every(cat => categoryRatings[cat])
    }

    const submitFeedback = async (isPublic) => {
        setLoading(true)
        await fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                businessId: business.id,
                customerName: name,
                rating: overallRating,
                feedback,
                isPublic,
                categoryRatings
            })
        })
        setLoading(false)
    }

    const handleGoogle = async () => {
        await submitFeedback(true)
        if (business.google_review_link) {
            window.open(business.google_review_link, '_blank')
        }
        setStep('done')
    }

    const handlePrivate = async () => {
        if (!feedback.trim()) return
        await submitFeedback(false)
        setStep('done')
    }

    const handleNoThanks = async () => {
        await submitFeedback(false)
        setStep('done')
    }

    const lowCategories = Object.entries(categoryRatings)
        .filter(([_, v]) => v <= 2)
        .map(([k]) => k)

    if (pageLoading) return (
        <div style={centerStyle}>
            <p style={{ color: '#888' }}>Loading...</p>
        </div>
    )

    if (!business) return (
        <div style={centerStyle}>
            <p style={{ color: '#888' }}>Business not found.</p>
        </div>
    )

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>

                <div style={avatarStyle}>
                    {business.name.slice(0, 2).toUpperCase()}
                </div>

                {/* STEP 1 — Rate each category */}
                {step === 'rating' && (
                    <>
                        <h1 style={titleStyle}>How was your experience?</h1>
                        <p style={subStyle}>at {business.name}</p>

                        <div style={{ width: '100%', marginBottom: '1.5rem' }}>
                            {categories.map(cat => (
                                <div key={cat} style={catRowStyle}>
                                    <div style={catLabelStyle}>{cat}</div>
                                    <div style={starRowStyle}>
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <span
                                                key={s}
                                                onClick={() => handleCategoryRating(cat, s)}
                                                onMouseEnter={() => setHoveredCategory({ ...hoveredCategory, [cat]: s })}
                                                onMouseLeave={() => setHoveredCategory({ ...hoveredCategory, [cat]: 0 })}
                                                style={{
                                                    fontSize: '1.8rem',
                                                    cursor: 'pointer',
                                                    userSelect: 'none',
                                                    transition: 'transform 0.1s',
                                                    transform: (hoveredCategory[cat] >= s || categoryRatings[cat] >= s)
                                                        ? 'scale(1.2)' : 'scale(1)',
                                                    opacity: (hoveredCategory[cat] >= s || categoryRatings[cat] >= s)
                                                        ? 1 : 0.25
                                                }}
                                            >★</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {!allCategoriesRated() && (
                            <p style={{ fontSize: '0.8rem', color: '#aaa' }}>
                                Rate each category to continue
                            </p>
                        )}
                    </>
                )}

                {/* STEP 2A — All good */}
                {step === 'happy' && (
                    <>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🙌</div>
                        <h1 style={titleStyle}>Glad you loved it!</h1>

                        <div style={summaryStyle}>
                            {categories.map(cat => (
                                <div key={cat} style={summaryRowStyle}>
                                    <span style={{ fontSize: '0.8rem', color: '#555' }}>{cat}</span>
                                    <span style={{ color: '#f59e0b', fontSize: '0.8rem' }}>
                                        {'★'.repeat(categoryRatings[cat] || 0)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <p style={{ color: '#888', fontSize: '0.875rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                            Would you mind sharing on Google?
                            It really helps us reach more people.
                        </p>

                        <input
                            type="text"
                            placeholder="Your name (optional)"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            style={{ ...inputStyle, marginBottom: '0.75rem' }}
                        />

                        <button onClick={handleGoogle} style={btnPrimaryStyle}>
                            ⭐ Leave a Google review
                        </button>
                        <button onClick={handleNoThanks} style={btnGhostStyle}>
                            No thanks
                        </button>
                    </>
                )}

                {/* STEP 2B — Mixed — good overall but one category low */}
                {step === 'mixed' && (
                    <>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>😊</div>
                        <h1 style={titleStyle}>Glad you mostly loved it!</h1>

                        <div style={summaryStyle}>
                            {categories.map(cat => (
                                <div key={cat} style={summaryRowStyle}>
                                    <span style={{ fontSize: '0.8rem', color: '#555' }}>{cat}</span>
                                    <span style={{
                                        color: categoryRatings[cat] <= 2 ? '#dc2626' : '#f59e0b',
                                        fontSize: '0.8rem'
                                    }}>
                                        {'★'.repeat(categoryRatings[cat] || 0)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <p style={{ color: '#888', fontSize: '0.875rem', marginBottom: '1rem', lineHeight: 1.6 }}>
                            Before you share on Google — tell us what we can improve on{' '}
                            <strong style={{ color: '#111' }}>
                                {lowCategories.join(' and ')}
                            </strong>.
                            This stays completely private.
                        </p>

                        <input
                            type="text"
                            placeholder="Your name (optional)"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            style={{ ...inputStyle, marginBottom: '0.75rem' }}
                        />

                        <textarea
                            rows={3}
                            placeholder={`What could we improve on ${lowCategories.join(' and ')}?`}
                            value={feedback}
                            onChange={e => setFeedback(e.target.value)}
                            style={{ ...inputStyle, resize: 'none', marginBottom: '0.75rem' }}
                        />

                        <button onClick={handleGoogle} style={btnPrimaryStyle}>
                            ⭐ Leave a Google review
                        </button>
                        <button onClick={handleNoThanks} style={btnGhostStyle}>
                            No thanks
                        </button>
                    </>
                )}

                {/* STEP 2C — All bad */}
                {step === 'sad' && (
                    <>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>😔</div>
                        <h1 style={titleStyle}>Sorry to hear that</h1>

                        <div style={summaryStyle}>
                            {categories.map(cat => (
                                <div key={cat} style={summaryRowStyle}>
                                    <span style={{ fontSize: '0.8rem', color: '#555' }}>{cat}</span>
                                    <span style={{
                                        color: categoryRatings[cat] <= 2 ? '#dc2626' : '#f59e0b',
                                        fontSize: '0.8rem'
                                    }}>
                                        {'★'.repeat(categoryRatings[cat] || 0)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <p style={{ color: '#888', fontSize: '0.875rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                            Tell us what went wrong — we will make it right.
                            This stays completely private.
                        </p>

                        <input
                            type="text"
                            placeholder="Your name (optional)"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            style={{ ...inputStyle, marginBottom: '0.75rem' }}
                        />

                        <textarea
                            rows={4}
                            placeholder="What went wrong? We want to fix it..."
                            value={feedback}
                            onChange={e => setFeedback(e.target.value)}
                            style={{ ...inputStyle, resize: 'none', marginBottom: '0.75rem' }}
                        />

                        <button
                            onClick={handlePrivate}
                            disabled={loading || !feedback.trim()}
                            style={{ ...btnPrimaryStyle, opacity: !feedback.trim() ? 0.5 : 1 }}
                        >
                            {loading ? 'Sending...' : 'Send private feedback'}
                        </button>
                        <button onClick={() => setStep('rating')} style={btnGhostStyle}>
                            Go back
                        </button>
                    </>
                )}

                {/* STEP 3 — Done */}
                {step === 'done' && (
                    <>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🙏</div>
                        <h1 style={titleStyle}>Thank you!</h1>
                        <p style={{ color: '#888', fontSize: '0.875rem', lineHeight: 1.6 }}>
                            Your feedback means a lot to {business.name}.
                        </p>
                    </>
                )}

            </div>
        </div>
    )
}

const centerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
}

const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    background: '#fafafa'
}

const cardStyle = {
    background: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: '20px',
    padding: '2rem',
    maxWidth: '440px',
    width: '100%',
    textAlign: 'center'
}

const avatarStyle = {
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.25rem',
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#16a34a'
}

const titleStyle = {
    fontSize: '1.3rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
    color: '#111'
}

const subStyle = {
    color: '#888',
    fontSize: '0.875rem',
    marginBottom: '1.5rem'
}

const catRowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.625rem 0',
    borderBottom: '1px solid #f3f4f6'
}

const catLabelStyle = {
    fontSize: '0.875rem',
    color: '#333',
    textAlign: 'left',
    flex: 1
}

const starRowStyle = {
    display: 'flex',
    gap: '0.125rem'
}

const summaryStyle = {
    background: '#f9fafb',
    borderRadius: '10px',
    padding: '0.875rem',
    marginBottom: '1.25rem',
    width: '100%'
}

const summaryRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.25rem 0'
}

const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid #e5e5e5',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    textAlign: 'left'
}

const btnPrimaryStyle = {
    width: '100%',
    padding: '0.875rem',
    borderRadius: '10px',
    background: '#111',
    color: '#fff',
    fontSize: '0.95rem',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    marginBottom: '0.75rem'
}

const btnGhostStyle = {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '10px',
    background: 'transparent',
    color: '#888',
    fontSize: '0.875rem',
    border: '1px solid #e5e5e5',
    cursor: 'pointer'
}