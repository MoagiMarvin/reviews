export const metadata = {
    title: 'Repuvault',
    description: 'Protect your reputation online',
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </head>
            <body style={{
                margin: 0,
                padding: 0,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                background: '#fafafa',
                color: '#111'
            }}>
                <style>{`
          * { box-sizing: border-box; }

          /* Desktop — show fixed sidebar, hide mobile bar */
          @media (min-width: 768px) {
            .desktop-sidebar { display: flex !important; flex-direction: column; }
            .mobile-topbar { display: none !important; }
            .main-with-sidebar { margin-left: 220px !important; }
          }

          /* Mobile — hide sidebar, show top bar */
          @media (max-width: 767px) {
            .desktop-sidebar { display: none !important; }
            .mobile-topbar { display: flex !important; }
            .main-with-sidebar { margin-left: 0 !important; }

            /* Stack two column grids */
            .two-col-grid { 
              grid-template-columns: 1fr !important; 
            }

            /* Full width stats */
            .stats-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }

            /* Padding on mobile */
            .page-content {
              padding: 1rem !important;
            }

            /* Category health grid */
            .cat-health-grid {
              grid-template-columns: 1fr 1fr !important;
            }
          }

          @media (max-width: 400px) {
            .stats-grid {
              grid-template-columns: 1fr 1fr !important;
            }
          }

          a { text-decoration: none; }
          button { font-family: inherit; }

          /* Scrollbar styling */
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: #f1f1f1; }
          ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 3px; }
        `}</style>
                {children}
            </body>
        </html>
    )
}