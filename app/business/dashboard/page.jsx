'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const router = useRouter()
  const [business, setBusiness] = useState(null)
  const [requests, setRequests] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    customerNumber: '',
    customerName: ''
  })

  useEffect(() => {
    getSession()
  }, [])

  async function getSession() {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      router.push('/business/login')
      return
    }

    const { data: biz } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (!biz) {
      router.push('/business/login')
      return
    }

    setBusiness(biz)
    await fetchRequests(biz.id)
    await fetchReviews(biz.id)
    setLoading(false)
  }

  async function fetchRequests(businessId) {
    const res = await fetch(`/api/requests?businessId=${businessId}`)
    const data = await res.json()
    if (data.requests) setRequests(data.requests)
  }

  async function fetchReviews(businessId) {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setReviews(data)
  }

  async function handleSendRequest(e) {
    e.preventDefault()
    setSending(true)
    setError('')
    setSuccess(false)

    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessId: business.id,
        customerNumber: form.customerNumber,
        customerName: form.customerName
      })
    })

    const data = await res.json()

    if (data.error) {
      setError(data.error)
      setSending(false)
      return
    }

    setSuccess(true)
    setForm({ customerNumber: '', customerName: '' })
    setSending(false)
    await fetchRequests(business.id)
    setTimeout(() => setSuccess(false), 4000)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/business/login')
  }

  const totalRequests = requests.length
  const totalReviews = reviews.length
  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '—'
  const responseRate = totalRequests
    ? Math.round((totalReviews / totalRequests) * 100)
    : 0

  const statusColor = {
    pending: '#f59e0b',
    sent: '#3b82f6',
    reviewed: '#10b981'
  }

  const statusLabel = {
    pending: 'Queued',
    sent: 'Sent',
    reviewed: 'Reviewed'
  }

  const stars = (rating) => '★'.repeat(rating) + '☆'.repeat(5 - rating)

  if (loading) {
    return (
      <div style={centerStyle}>
        <p style={{ color: '#888' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>

      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={{ fontSize: '1.1rem', fontWeight: '600' }}>
            {business.name}
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '2px' }}>
            repuvault.co.za/feedback/{business.slug}
          </p>
        </div>
        <button onClick={handleLogout} style={logoutBtnStyle}>
          Log out
        </button>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem 1rem' }}>

        {/* Metrics */}
        <div style={metricsGridStyle}>
          <div style={metricCardStyle}>
            <div style={metricLabelStyle}>Total requests</div>
            <div style={metricValStyle}>{totalRequests}</div>
          </div>
          <div style={metricCardStyle}>
            <div style={metricLabelStyle}>Reviews received</div>
            <div style={{ ...metricValStyle, color: '#10b981' }}>{totalReviews}</div>
          </div>
          <div style={metricCardStyle}>
            <div style={metricLabelStyle}>Average rating</div>
            <div style={{ ...metricValStyle, color: '#f59e0b' }}>
              {avgRating} {avgRating !== '—' ? '★' : ''}
            </div>
          </div>
          <div style={metricCardStyle}>
            <div style={metricLabelStyle}>Response rate</div>
            <div style={metricValStyle}>{responseRate}%</div>
          </div>
        </div>

        <div style={twoColStyle}>

          {/* Send request form */}
          <div style={cardStyle}>
            <h2 style={cardTitleStyle}>Send feedback request</h2>
            <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1.25rem' }}>
              Customer gets a WhatsApp message in 1 hour
            </p>

            {error && (
              <div style={errorStyle}>{error}</div>
            )}

            {success && (
              <div style={successStyle}>
                Request queued — WhatsApp sends in 1 hour
              </div>
            )}

            <form onSubmit={handleSendRequest}>
              <div style={{ marginBottom: '0.875rem' }}>
                <label style={labelStyle}>Customer WhatsApp number</label>
                <input
                  type="tel"
                  placeholder="082 000 0000"
                  value={form.customerNumber}
                  onChange={(e) => setForm({ ...form, customerNumber: e.target.value })}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelStyle}>Customer name (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Sipho"
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                style={btnStyle}
              >
                {sending ? 'Queuing...' : 'Send request'}
              </button>
            </form>

            {/* Feedback link */}
            <div style={linkBoxStyle}>
              <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.4rem' }}>
                Your feedback link
              </p>
              <p style={{ fontSize: '0.8rem', fontWeight: '500', color: '#111' }}>
                repuvault.co.za/feedback/{business.slug}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '0.25rem' }}>
                Share this link or print as QR code
              </p>
            </div>
          </div>

          {/* Right column */}
          <div>

            {/* Recent requests */}
            <div style={{ ...cardStyle, marginBottom: '1rem' }}>
              <h2 style={cardTitleStyle}>Recent requests</h2>
              {requests.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: '#aaa' }}>
                  No requests yet
                </p>
              ) : (
                requests.slice(0, 6).map((r) => (
                  <div key={r.id} style={requestItemStyle}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                        {r.customer_name || r.customer_number}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '2px' }}>
                        {new Date(r.created_at).toLocaleDateString('en-ZA')}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      color: statusColor[r.status]
                    }}>
                      {statusLabel[r.status]}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Recent reviews */}
            <div style={cardStyle}>
              <h2 style={cardTitleStyle}>Recent reviews</h2>
              {reviews.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: '#aaa' }}>
                  No reviews yet
                </p>
              ) : (
                reviews.slice(0, 5).map((r) => (
                  <div key={r.id} style={reviewItemStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                        {r.customer_name || 'Anonymous'}
                      </span>
                      <span style={{ color: '#f59e0b', fontSize: '0.8rem' }}>
                        {stars(r.rating)}
                      </span>
                    </div>
                    {r.feedback && (
                      <p style={{ fontSize: '0.8rem', color: '#666', lineHeight: '1.5' }}>
                        {r.feedback}
                      </p>
                    )}
                    {!r.feedback && r.is_public && (
                      <p style={{ fontSize: '0.75rem', color: '#10b981' }}>
                        Sent to Google review
                      </p>
                    )}
                    <p style={{ fontSize: '0.7rem', color: '#bbb', marginTop: '4px' }}>
                      {new Date(r.created_at).toLocaleDateString('en-ZA')}
                    </p>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
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

const headerStyle = {
  background: '#fff',
  borderBottom: '1px solid #e5e5e5',
  padding: '1rem 1.5rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  position: 'sticky',
  top: 0,
  zIndex: 10
}

const logoutBtnStyle = {
  background: 'transparent',
  border: '1px solid #e5e5e5',
  borderRadius: '8px',
  padding: '0.4rem 0.875rem',
  fontSize: '0.8rem',
  cursor: 'pointer',
  color: '#666'
}

const metricsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: '0.75rem',
  marginBottom: '1.5rem'
}

const metricCardStyle = {
  background: '#fff',
  border: '1px solid #e5e5e5',
  borderRadius: '12px',
  padding: '1rem 1.25rem'
}

const metricLabelStyle = {
  fontSize: '0.75rem',
  color: '#888',
  marginBottom: '0.4rem'
}

const metricValStyle = {
  fontSize: '1.8rem',
  fontWeight: '600',
  color: '#111'
}

const twoColStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '1rem',
  alignItems: 'start'
}

const cardStyle = {
  background: '#fff',
  border: '1px solid #e5e5e5',
  borderRadius: '12px',
  padding: '1.25rem'
}

const cardTitleStyle = {
  fontSize: '0.95rem',
  fontWeight: '600',
  marginBottom: '0.25rem',
  color: '#111'
}

const labelStyle = {
  fontSize: '0.8rem',
  color: '#666',
  display: 'block',
  marginBottom: '0.4rem'
}

const inputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  border: '1px solid #e5e5e5',
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit'
}

const btnStyle = {
  width: '100%',
  padding: '0.875rem',
  borderRadius: '8px',
  background: '#000',
  color: '#fff',
  fontSize: '0.9rem',
  fontWeight: '600',
  border: 'none',
  cursor: 'pointer'
}

const linkBoxStyle = {
  marginTop: '1.25rem',
  padding: '0.875rem',
  background: '#f9fafb',
  borderRadius: '8px',
  border: '1px solid #e5e5e5'
}

const errorStyle = {
  background: '#fee2e2',
  color: '#dc2626',
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  marginBottom: '1rem',
  fontSize: '0.875rem'
}

const successStyle = {
  background: '#f0fdf4',
  color: '#16a34a',
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  marginBottom: '1rem',
  fontSize: '0.875rem'
}

const requestItemStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.625rem 0',
  borderBottom: '1px solid #f3f4f6'
}

const reviewItemStyle = {
  padding: '0.75rem 0',
  borderBottom: '1px solid #f3f4f6'
}