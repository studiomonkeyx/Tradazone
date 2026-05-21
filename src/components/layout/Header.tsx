// @ts-nocheck
import { Bell, Menu, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../ui/Logo';

function Header({ onMenuToggle }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/signin');
    };

    return (
        <header className="h-header bg-brand fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-5 lg:px-6">
            {/* Left: hamburger (mobile) + Logo */}
            <div className="flex items-center gap-3">
                {/* Hamburger — mobile only */}
                <button
                    className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-white/80 hover:bg-white/10 transition-colors"
                    onClick={onMenuToggle}
                    aria-label="Open menu"
                >
                    <Menu size={22} />
                </button>
                <Logo variant="dark" className="h-7" />
            </div>

            {/* Right: Bell + Logout (mobile) + Avatar */}
            <div className="flex items-center gap-2 lg:gap-4">
                <button className="w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:bg-white/10 transition-colors">
                    <Bell size={22} />
                </button>
                {/* Sign out — mobile only; desktop uses the sidebar button */}
                <button
                    className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:bg-white/10 transition-colors"
                    onClick={handleLogout}
                    aria-label="Sign out"
                >
                    <LogOut size={20} />
                </button>
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/30 flex-shrink-0">
                    <img
                        src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=3C3CEF&color=fff`}
                        alt={user.name}
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>
        </header>
    );
}

export default Header;
