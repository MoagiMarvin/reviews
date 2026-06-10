'use client'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export default function Sidebar({ business }) {
    const pathname = usePathname()
    const router = useRouter()
    const [open, setOpen] = useState(false)

    async function handleLogout() {
        await fetch('/api/business/logout', { method: 'POST' })
        router.push('/business/login')
    }

    const links = [
        {
            href: '/business/dashboard',
            label: 'Overview',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="1.5" />
                    <rect x="14" y="3" width="7" height="7" rx="1.5" />
                    <rect x="3" y="14" width="7" height="7" rx="1.5" />
                    <rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
            )
        },
        {
            href: '/business/send',
            label: 'Send request',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
                </svg>
            )
        },
        {
            href: '/business/reviews',
            label: 'Reviews',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
            )
        },
        {
            href: '/business/settings',
            label: 'Account',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {links.map(link => {
                    const active = pathname === link.href
                    return (
                        <a
                            key={link.href}
                            href={link.href}
                            onClick={() => setOpen(false)}
                            className={`nav-item ${active ? 'active' : ''}`}
                            style={{
                                ...navLinkStyle,
                                background: active ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                                color: active ? '#ffffff' : '#94a3b8',
                                fontWeight: active ? '600' : '400',
                                borderLeft: active ? '3px solid #16a34a' : '3px solid transparent',
                                paddingLeft: active ? 'calc(0.75rem - 3px)' : '0.75rem'
                            }}
                        >
                            <span style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                color: active ? '#16a34a' : '#64748b',
                                transition: 'color 0.15s'
                            }}>
                                {link.icon}
                            </span>
                            {link.label}
                        </a>
                    )
                })}
            </nav>
            <button onClick={handleLogout} style={logoutStyle} className="logout-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
                Log out
            </button>
        </>
    )

    return (
        <>
            <style>{`
                .sidebar-desktop { display: flex; }
                .sidebar-mobile-bar { display: none; }
                @media (max-width: 767px) {
                    .sidebar-desktop { display: none; }
                    .sidebar-mobile-bar { display: flex; }
                }

                .nav-item {
                    transition: all 0.2s ease;
                }
                .nav-item:hover {
                    background: rgba(255, 255, 255, 0.02) !important;
                    color: #fff !important;
                }
                .nav-item:hover span {
                    color: #16a34a !important;
                }
                .nav-item.active {
                    background: rgba(255, 255, 255, 0.06) !important;
                }

                .logout-btn {
                    transition: all 0.2s ease;
                }
                .logout-btn:hover {
                    color: #ef4444 !important;
                    background: rgba(239, 68, 68, 0.05) !important;
                }
            `}</style>

            {/* Desktop sidebar — hidden on mobile via CSS */}
            <div className="sidebar-desktop" style={desktopStyle}>
                <div style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
                    <div style={{ padding: '0 0.75rem', marginBottom: '2rem' }}>
                        <span style={{ color: '#ffffff', fontWeight: '800', fontSize: '1.25rem', letterSpacing: '-0.03em' }}>
                            Repu<span style={{ color: '#16a34a' }}>vault</span>
                        </span>
                    </div>
                    <NavLinks />
                </div>
            </div>

            {/* Mobile top bar — hidden on desktop via CSS */}
            <div className="sidebar-mobile-bar" style={mobileBarStyle}>
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
                    <span style={{ fontWeight: '800', fontSize: '1.15rem', color: '#0f172a', letterSpacing: '-0.03em' }}>
                        Repu<span style={{ color: '#16a34a' }}>vault</span>
                    </span>
                </div>
                {business && (
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {business.name}
                    </span>
                )}
            </div>

            {/* Drawer (mobile) */}
            {open && (
                <>
                    <div style={overlayStyle} onClick={() => setOpen(false)} />
                    <div style={drawerStyle}>
                        <div style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                                <button onClick={() => setOpen(false)} style={hamStyleMobile}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </button>
                                <span style={{ fontWeight: '800', fontSize: '1.25rem', color: '#ffffff', letterSpacing: '-0.03em' }}>
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

const desktopStyle = { width: '220px', minHeight: '100vh', background: '#0b0f19', borderRight: '1px solid #1e293b', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 20 }
const mobileBarStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '0.875rem 1.25rem', position: 'sticky', top: 0, zIndex: 30 }
const hamStyle = { background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', color: '#0f172a' }
const hamStyleMobile = { background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', color: '#ffffff' }
const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 40, transition: 'all 0.3s' }
const drawerStyle = { position: 'fixed', top: 0, left: 0, bottom: 0, width: '260px', background: '#0b0f19', zIndex: 50, boxShadow: '8px 0 32px rgba(15, 23, 42, 0.25)', overflowY: 'auto' }
const bizStyle = { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', marginBottom: '1.5rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '10px', overflow: 'hidden' }
const bizAvatarStyle = { width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #16a34a, #10b981)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800', flexShrink: 0, boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)' }
const bizNameStyle = { fontSize: '0.8rem', fontWeight: '600', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
const bizSlugStyle = { fontSize: '0.7rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
const navLinkStyle = { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0.875rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '0.25rem' }
const logoutStyle = { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0.875rem', borderRadius: '8px', background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.875rem', cursor: 'pointer', width: '100%', marginTop: 'auto' }