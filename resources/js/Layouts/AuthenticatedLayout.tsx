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
                <main style={{ flex: 1, padding: 24 }}>
                    {children}
                </main>
            </div>
        </div>
    );
}