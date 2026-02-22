import { PropsWithChildren, ReactNode, useState } from 'react';
import { usePage } from '@inertiajs/react';
import Sidebar from '@/Components/Sidebar/Sidebar';
import { PageProps } from '@/types';

export default function AuthenticatedLayout({
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { flash } = usePage<PageProps>().props;
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>

            <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

            <div style={{
                marginLeft: collapsed ? 64 : 240,
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                transition: 'margin-left 0.3s ease',
                minWidth: 0,
            }}>
                {/* Flash messages */}
                {flash?.success && (
                    <div style={{
                        margin: '16px 24px 0',
                        padding: '12px 16px',
                        borderRadius: 10,
                        backgroundColor: '#F0FDF4',
                        border: '1px solid #BBF7D0',
                        color: '#166534',
                        fontSize: 14,
                        fontWeight: 500,
                    }}>
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div style={{
                        margin: '16px 24px 0',
                        padding: '12px 16px',
                        borderRadius: 10,
                        backgroundColor: '#FEF2F2',
                        border: '1px solid #FECACA',
                        color: '#991B1B',
                        fontSize: 14,
                        fontWeight: 500,
                    }}>
                        {flash.error}
                    </div>
                )}

                <main style={{ flex: 1, padding: 24 }}>
                    {children}
                </main>
            </div>
        </div>
    );
}