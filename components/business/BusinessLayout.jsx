'use client'
import { useEffect, useState } from 'react'

export default function BusinessLayout({ children }) {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768)
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])

    return (
        <div style={{
            marginLeft: isMobile ? '0' : '220px',
            minHeight: '100vh',
            background: '#fafafa',
            overflowX: 'hidden',
            boxSizing: 'border-box',
            width: isMobile ? '100%' : `calc(100vw - 220px)`
        }}>
            {children}
        </div>
    )
}