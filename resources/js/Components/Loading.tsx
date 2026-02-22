export default function Loading({ message = 'Cargando' }: { message?: string }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#F8FAFC',
        }}>
            <style>{`
                @keyframes spin  { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
            `}</style>

            {/* Contenedor relativo para superponer anillo + logo */}
            <div style={{ position: 'relative', width: 96, height: 96, marginBottom: 20 }}>

                {/* Anillo giratorio */}
                <svg
                    width="96" height="96" viewBox="0 0 96 96" fill="none"
                    style={{ position: 'absolute', inset: 0, animation: 'spin 1.2s linear infinite' }}
                >
                    {/* Pista gris */}
                    <circle cx="48" cy="48" r="44" stroke="#E2E8F0" strokeWidth="4" />
                    {/* Arco azul que gira */}
                    <path
                        d="M48 4 A44 44 0 0 1 92 48"
                        stroke="#2563EB" strokeWidth="4" strokeLinecap="round"
                    />
                    {/* Punto cobre al final del arco */}
                    <circle cx="92" cy="48" r="4" fill="#D97706" />
                </svg>

                {/* Logo circular centrado */}
                <div style={{
                    position: 'absolute', inset: 10,
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                }}>
                    <img
                        src="/logo.png"
                        alt="Taller Hub"
                        style={{ width: '72%', height: '72%', objectFit: 'contain' }}
                    />
                </div>
            </div>

            {/* Nombre */}
            <p style={{ fontSize: 18, fontWeight: 800, color: '#1E293B', marginBottom: 6 }}>
                Taller<span style={{ color: '#D97706' }}>Hub</span>
            </p>

            {/* Mensaje animado */}
            <p style={{
                fontSize: 14, color: '#94A3B8',
                animation: 'pulse 1.5s ease-in-out infinite',
            }}>
                {message}...
            </p>
        </div>
    );
}