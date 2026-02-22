import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { X } from 'lucide-react';
import { ReactNode } from 'react';

interface Props {
    show: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const maxWidthMap = {
    sm:  'sm:max-w-sm',
    md:  'sm:max-w-md',
    lg:  'sm:max-w-lg',
    xl:  'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
};

export default function Modal({ show, onClose, title, children, maxWidth = 'lg' }: Props) {
    return (
        <Transition show={show} leave="duration-200">
            <Dialog as="div" className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-0" onClose={onClose}>

                {/* Fondo */}
                <TransitionChild
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="absolute inset-0" style={{ backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }} />
                </TransitionChild>

                {/* Panel */}
                <TransitionChild
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 translate-y-4 sm:scale-95"
                    enterTo="opacity-100 translate-y-0 sm:scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                    leaveTo="opacity-0 translate-y-4 sm:scale-95"
                >
                    <DialogPanel
                        className={`relative w-full ${maxWidthMap[maxWidth]} transform overflow-hidden sm:mx-auto`}
                        style={{ borderRadius: 16, backgroundColor: '#fff', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}
                    >
                        {/* Header */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '20px 24px',
                            borderBottom: '1px solid #F1F5F9',
                        }}>
                            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1E293B', margin: 0 }}>
                                {title}
                            </h2>
                            <button
                                onClick={onClose}
                                style={{
                                    width: 32, height: 32, borderRadius: 8,
                                    border: 'none', cursor: 'pointer',
                                    backgroundColor: '#F8FAFC',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#94A3B8', transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLElement).style.backgroundColor = '#FEE2E2';
                                    (e.currentTarget as HTMLElement).style.color = '#EF4444';
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLElement).style.backgroundColor = '#F8FAFC';
                                    (e.currentTarget as HTMLElement).style.color = '#94A3B8';
                                }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Body */}
                        <div style={{ padding: '24px' }}>
                            {children}
                        </div>
                    </DialogPanel>
                </TransitionChild>
            </Dialog>
        </Transition>
    );
}