'use client'

export default function BusinessLayout({ children }) {
    return (
        <>
            <style>{`
                .business-layout {
                    min-height: 100vh;
                    background: #f8fafc;
                    box-sizing: border-box;
                    margin-left: 220px;
                }
                @media (max-width: 767px) {
                    .business-layout {
                        margin-left: 0;
                        width: 100%;
                    }
                }
                .business-page-inner {
                    box-sizing: border-box;
                    width: 100%;
                }
            `}</style>
            <div className="business-layout">
                <div className="business-page-inner">
                    {children}
                </div>
            </div>
        </>
    )
}