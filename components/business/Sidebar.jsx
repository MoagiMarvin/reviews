'use client'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export default function Sidebar({ business }) {
    const pathname = usePathname()
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768)
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])

    async function handleLogout() {
        await fetch('/api/business/logout', { method: 'POST' })
        router.push('/business/login')
    }

    const links = [
        {
            href: '/business/dashboard',
            label: 'Overview',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
            )
        },
        {
            href: '/business/send',
            label: 'Send request',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
                </svg>
            )
        },
        {
            href: '/business/reviews',
            label: 'Reviews',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
            )
        },
        {
            href: '/business/settings',
            label: 'Settings',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
            )
        }
    ]

    const NavLinks = () => (
        <>
            {business && (
                <div style={bizStyle}>
                    <div style={bizAvatarStyle}>
                        {business.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={bizNameStyle}>{business.name}</div>
                        <div style={bizSlugStyle}>/{business.slug}</div>
                    </div>
                </div>
            )}
            <nav style={{ flex: 1 }}>
                {links.map(link => {
                    const active = pathname === link.href
                    return (
                        <a
                            key={link.href}
                            href={link.href}
                            onClick={() => setOpen(false)}
                            style={{
                                ...navLinkStyle,
                                background: active ? '#f0fdf4' : 'transparent',
                                color: active ? '#16a34a' : '#555',
                                fontWeight: active ? '600' : '400'
                            }}
                        >
                            <span style={{ opacity: active ? 1 : 0.6 }}>{link.icon}</span>
                            {link.label}
                        </a>
                    )
                })}
            </nav>
            <button onClick={handleLogout} style={logoutStyle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
                Log out
            </button>
        </>
    )

    if (isMobile) {
        return (
            <>
                {/* Mobile top bar — hamburger on LEFT */}
                <div style={mobileBarStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button onClick={() => setOpen(!open)} style={hamStyle}>
                            {open ? (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 12h18M3 6h18M3 18h18" />
                                </svg>
                            )}
                        </button>
                        <span style={{ fontWeight: '700', fontSize: '1rem', color: '#111' }}>
                            Repu<span style={{ color: '#16a34a' }}>vault</span>
                        </span>
                    </div>
                    {business && (
                        <span style={{ fontSize: '0.75rem', color: '#888' }}>
                            {business.name}
                        </span>
                    )}
                </div>

                {/* Drawer */}
                {open && (
                    <>
                        <div style={overlayStyle} onClick={() => setOpen(false)} />
                        <div style={drawerStyle}>
                            <div style={{ padding: '1.25rem 0.875rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    <button onClick={() => setOpen(false)} style={hamStyle}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M18 6L6 18M6 6l12 12" />
                                        </svg>
                                    </button>
                                    <span style={{ fontWeight: '700', fontSize: '1.1rem', color: '#111' }}>
                                        Repu<span style={{ color: '#16a34a' }}>vault</span>
                                    </span>
                                </div>
                                <NavLinks />
                            </div>
                        </div>
                    </>
                )}
            </>
        )
    }

    return (
        <div style={desktopStyle}>
            <div style={{ padding: '1.25rem 0.875rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ padding: '0 0.5rem', marginBottom: '1.5rem' }}>
                    <span style={{ color: '#111', fontWeight: '700', fontSize: '1.1rem' }}>
                        Repu<span style={{ color: '#16a34a' }}>vault</span>
                    </span>
                </div>
                <NavLinks />
            </div>
        </div>
    )
}

const desktopStyle = { width: '220px', minHeight: '100vh', background: '#fff', borderRight: '1px solid #e5e5e5', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 20 }
const mobileBarStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderBottom: '1px solid #e5e5e5', padding: '0.875rem 1.25rem', position: 'sticky', top: 0, zIndex: 30 }
const hamStyle = { background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', color: '#111' }
const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }
const drawerStyle = { position: 'fixed', top: 0, left: 0, bottom: 0, width: '260px', background: '#fff', zIndex: 50, boxShadow: '4px 0 24px rgba(0,0,0,0.15)', overflowY: 'auto' }
const bizStyle = { display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.75rem 0.5rem', marginBottom: '1rem', background: '#f9fafb', borderRadius: '10px', overflow: 'hidden' }
const bizAvatarStyle = { width: '32px', height: '32px', borderRadius: '8px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700', flexShrink: 0 }
const bizNameStyle = { fontSize: '0.8rem', fontWeight: '600', color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
const bizSlugStyle = { fontSize: '0.7rem', color: '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
const navLinkStyle = { display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 0.75rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '0.25rem', transition: 'all 0.15s' }
const logoutStyle = { display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 0.75rem', borderRadius: '8px', background: 'transparent', border: 'none', color: '#888', fontSize: '0.875rem', cursor: 'pointer', width: '100%', marginTop: 'auto' }