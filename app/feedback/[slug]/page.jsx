'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

export default function FeedbackPage() {
    const { slug } = useParams()
    const [business, setBusiness] = useState(null)
    const [rating, setRating] = useState(0)
    const [hovered, setHovered] = useState(0)
    const [feedback, setFeedback] = useState('')
    const [name, setName] = useState('')
    const [step, setStep] = useState('rating')
    const [loading, setLoading] = useState(false)
    const [pageLoading, setPageLoading] = useState(true)

    useEffect(() => {
        fetch(`/api/business/public?slug=${slug}`)
            .then(r => r.json())
            .then(d => {
                if (d.business) setBusiness(d.business)
                setPageLoading(false)
            })
            .catch(() => setPageLoading(false))
    }, [slug])

    const handleRating = (val) => {
        setRating(val)
        setStep(val >= 4 ? 'happy' : 'sad')
    }

    const submitFeedback = async (isPublic) => {
        setLoading(true)
        await fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                businessId: business.id,
                customerName: name,
                rating,
                feedback,
                isPublic
            })
        })
        setLoading(false)
    }

    const handleGoogle = async () => {
        await submitFeedback(true)
        window.open(business.google_review_link, '_blank')
        setStep('done')
    }

    const handlePrivate = async () => {
        if (!feedback.trim()) return
        await submitFeedback(false)
        setStep('done')
    }

    const labels = { 1: 'Poor', 2: 'Not great', 3: 'OK', 4: 'Good', 5: 'Excellent!' }

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

                {step === 'rating' && (
                    <>
                        <h1 style={titleStyle}>How was your experience?</h1>
                        <p style={subStyle}>at {business.name}</p>
                        <div style={starRowStyle}>
                            {[1, 2, 3, 4, 5].map(s => (
                                <span
                                    key={s}
                                    onClick={() => handleRating(s)}
                                    onMouseEnter={() => setHovered(s)}
                                    onMouseLeave={() => setHovered(0)}
                                    style={{
                                        fontSize: '2.8rem',
                                        cursor: 'pointer',
                                        userSelect: 'none',
                                        transition: 'transform 0.15s',
                                        transform: hovered >= s || rating >= s ? 'scale(1.2)' : 'scale(1)',
                                        opacity: hovered >= s || rating >= s ? 1 : 0.25
                                    }}
                                >★</span>
                            ))}
                        </div>
                        <p style={{ color: '#888', fontSize: '0.85rem', minHeight: '1.2rem' }}>
                            {hovered ? labels[hovered] : rating ? labels[rating] : 'Tap a star'}
                        </p>
                    </>
                )}

                {step === 'happy' && (
                    <>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🙌</div>
                        <h1 style={titleStyle}>Glad you loved it!</h1>
                        <p style={{ color: '#888', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                            Would you mind leaving a quick Google review?
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
                        <button onClick={() => setStep('done')} style={btnGhostStyle}>
                            No thanks
                        </button>
                    </>
                )}

                {step === 'sad' && (
                    <>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>😔</div>
                        <h1 style={titleStyle}>Sorry to hear that</h1>
                        <p style={{ color: '#888', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
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

                {step === 'done' && (
                    <>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🙏</div>
                        <h1 style={titleStyle}>Thank you!</h1>
                        <p style={{ color: '#888', fontSize: '0.875rem' }}>
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
    padding: '2.5rem 2rem',
    maxWidth: '420px',
    width: '100%',
    textAlign: 'center'
}

const avatarStyle = {
    width: '60px',
    height: '60px',
    borderRadius: '14px',
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.25rem',
    fontSize: '1.2rem',
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

const starRowStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem'
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