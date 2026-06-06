export const metadata = {
    title: 'Repuvault',
    description: 'Protect your reputation online',
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body style={{
                margin: 0,
                padding: 0,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                background: '#fafafa',
                color: '#111'
            }}>
                {children}
            </body>
        </html>
    )
}