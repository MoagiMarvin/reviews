export default function Home() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '1rem'
        }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '600' }}>
                Repuvault
            </h1>
            <p style={{ color: '#888' }}>
                Protect your reputation online
            </p>
            <a href="/business/register" style={{
                background: '#000',
                color: '#fff',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '600'
            }}>
                Get started
            </a>
            <a href="/business/login" style={{
                color: '#888',
                fontSize: '0.875rem'
            }}>
                Already have an account? Log in
            </a>
        </div>
    )
}