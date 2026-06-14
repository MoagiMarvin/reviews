'use client'

export default function WorkerLayout({ children }) {
    return (
        <>
            <style>{`
                .worker-layout {
                    min-height: 100vh;
                    background: #f8fafc;
                    box-sizing: border-box;
                    margin-left: 220px;
                    
                    /* Override primary theme colors for staff pages (Blue/Indigo theme) */
                    --primary: #2563eb;
                    --primary-hover: #1d4ed8;
                    --primary-light: #eff6ff;
                    --primary-border: #bfdbfe;
                }
                @media (max-width: 767px) {
                    .worker-layout {
                        margin-left: 0;
                        width: 100%;
                    }
                }
                .worker-page-inner {
                    box-sizing: border-box;
                    width: 100%;
                }
            `}</style>
            <div className="worker-layout">
                <div className="worker-page-inner">
                    {children}
                </div>
            </div>
        </>
    )
}
