import '../css/app.css';
import './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import Loading from '@/Components/Loading';

const appName = import.meta.env.VITE_APP_NAME || 'Taller Hub';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const Root = () => {
            const [loading, setLoading] = useState(false);

            // Inertia dispara estos eventos en cada navegación
            router.on('start',  () => setLoading(true));
            router.on('finish', () => setLoading(false));

            return (
                <>
                    {loading && <Loading />}
                    <App {...props} />
                </>
            );
        };

        createRoot(el).render(<Root />);
    },
    progress: false,
});