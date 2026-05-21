// @ts-nocheck
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { AlertCircle, ExternalLink } from 'lucide-react';
import illustration from '../../../assets/auth-splash.svg';
import Logo from '../../../components/ui/Logo';
import ConnectWalletModal from '../../../components/ui/ConnectWalletModal';
import { supabase } from '../../../lib/supabase';

function SignIn() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { connectWallet, user, lastWallet } = useAuth();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        setIsGoogleLoading(true);
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/` },
        });
        setIsGoogleLoading(false);
    };

    const redirectTo = searchParams.get('redirect') || '/';
    const sessionExpired = searchParams.get('reason') === 'expired';

    useEffect(() => {
        if (user.isAuthenticated) {
            navigate(redirectTo, { replace: true });
        }
    }, [user.isAuthenticated, navigate, redirectTo]);

    const handleConnectSuccess = () => {
        navigate(redirectTo, { replace: true });
    };

    const shortWallet = lastWallet
        ? `${lastWallet.slice(0, 6)}...${lastWallet.slice(-4)}`
        : null;

    return (
        <div className="min-h-screen flex">
            {/* ── Left Panel ── */}
            <div className="w-full lg:w-[40%] flex flex-col justify-start px-6 py-8 lg:px-10 lg:py-10 bg-white overflow-y-auto">
                {/* Logo */}
                <div className="mb-8 lg:mb-12">
                    <Logo variant="light" className="h-7 lg:h-9" />
                </div>

                {/* Session expired banner */}
                {sessionExpired && (
                    <div className="flex items-center gap-2 px-4 py-3 mb-6 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                        <AlertCircle size={16} className="flex-shrink-0" />
                        <span>Your session expired — reconnect to continue.</span>
                    </div>
                )}

                {/* Headline */}
                <h1 className="text-xl lg:text-3xl font-bold text-t-primary mb-3 leading-snug">
                    Manage clients, send invoices, and accept payments directly into your preferred wallet
                </h1>
                <p className="text-sm text-t-muted mb-8 lg:mb-10">
                    Connect your wallet to get started
                </p>

                {/* Returning user hint */}
                {shortWallet && !sessionExpired && (
                    <div className="flex items-center gap-2 px-4 py-3 mb-5 bg-brand/5 border border-brand/20 rounded-lg text-sm text-brand">
                        <span className="w-2 h-2 rounded-full bg-brand flex-shrink-0" />
                        <span>Welcome back — reconnect <span className="font-mono font-medium">{shortWallet}</span> to continue</span>
                    </div>
                )}

                {/* Connect Wallet Button */}
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 h-10 bg-brand text-white text-sm font-semibold hover:opacity-90 active:scale-95 transition-all mb-6 rounded-lg"
                >
                    Connect Wallet
                </button>

                <ConnectWalletModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    connectWalletFn={connectWallet}
                    onConnect={handleConnectSuccess}
                />

                {/* Divider */}
                <div className="relative flex items-center my-2">
                    <div className="flex-1 border-t border-border" />
                    <span className="px-3 text-xs text-t-muted">or</span>
                    <div className="flex-1 border-t border-border" />
                </div>

                {/* Google Sign-In */}
                <button
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading}
                    className="w-full inline-flex items-center justify-center gap-3 px-4 py-2.5 h-10 bg-white border border-border text-sm font-medium text-t-primary hover:bg-gray-50 active:scale-95 transition-all rounded-lg disabled:opacity-60"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {isGoogleLoading ? 'Redirecting…' : 'Continue with Google'}
                </button>

            </div>

            {/* ── Right Panel — Illustration ── */}
            <div className="hidden lg:block lg:w-[60%] bg-gray-50 relative overflow-hidden">
                <img
                    src={illustration}
                    alt="Tradazone — invoices, payments, crypto"
                    className="absolute inset-0 w-full h-full object-cover"
                />
            </div>
        </div>
    );
}

export default SignIn;
