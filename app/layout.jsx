export const metadata = {
    title: 'Repuvault',
    description: 'Protect your reputation online',
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
            </head>
            <body style={{
                margin: 0,
                padding: 0,
                fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                background: '#f8fafc',
                color: '#0f172a'
            }}>
                <style>{`
          :root {
            --primary: #16a34a;
            --primary-hover: #15803d;
            --primary-light: #f0fdf4;
            --primary-border: #bbf7d0;
            --bg-app: #f8fafc;
            --bg-card: #ffffff;
            --text-main: #0f172a;
            --text-muted: #64748b;
            --text-light: #94a3b8;
            --border-color: #f1f5f9;
            --border-hover: #e2e8f0;
            --shadow-sm: 0 1px 2px 0 rgba(15, 23, 42, 0.05);
            --shadow-md: 0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04);
            --shadow-lg: 0 10px 15px -3px rgba(15, 23, 42, 0.04), 0 4px 6px -4px rgba(15, 23, 42, 0.02);
            --shadow-hover: 0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
            --radius-sm: 6px;
            --radius-md: 12px;
            --radius-lg: 16px;
          }

          * { box-sizing: border-box; }

          /* Desktop — show fixed sidebar, hide mobile bar */
          @media (min-width: 768px) {
          }

          /* Mobile — hide sidebar, show top bar */
          @media (max-width: 767px) {
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

          a { text-decoration: none; color: inherit; }
          button { font-family: inherit; }

          /* Scrollbar styling */
          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: #f8fafc; }
          ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
          ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        `}</style>
                {children}
            </body>
        </html>
    )
}