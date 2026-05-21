// @ts-nocheck
import { NavLink, Outlet } from 'react-router-dom';
import { User, CreditCard, Bell } from 'lucide-react';

const settingsLinks = [
    { path: '/settings/profile', icon: User, label: 'Profile Settings' },
    { path: '/settings/payments', icon: CreditCard, label: 'Payment Settings' },
    { path: '/settings/notifications', icon: Bell, label: 'Notifications' },
];

function Settings() {
    return (
        <div>
            <h1 className="text-xl font-semibold text-t-primary mb-4 md:mb-6">Settings</h1>

            {/* Mobile: horizontal scrollable tab bar */}
            <div className="md:hidden flex overflow-x-auto gap-1 mb-5 pb-1 -mx-1 px-1 scrollbar-none">
                {settingsLinks.map((link) => (
                    <NavLink
                        key={link.path}
                        to={link.path}
                        className={({ isActive }) =>
                            `flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap flex-shrink-0 transition-colors ${
                                isActive ? 'bg-brand-bg text-brand' : 'text-t-secondary hover:bg-gray-50 border border-border'
                            }`
                        }
                    >
                        <link.icon size={15} />
                        <span>{link.label}</span>
                    </NavLink>
                ))}
            </div>

            {/* Desktop: sidebar + content */}
            <div className="flex gap-6">
                <aside className="hidden md:block w-56 flex-shrink-0">
                    <nav className="flex flex-col gap-0.5">
                        {settingsLinks.map((link) => (
                            <NavLink
                                key={link.path}
                                to={link.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                        isActive ? 'bg-brand-bg text-brand' : 'text-t-secondary hover:bg-gray-50'
                                    }`
                                }
                            >
                                <link.icon size={18} />
                                <span>{link.label}</span>
                            </NavLink>
                        ))}
                    </nav>
                </aside>

                <main className="flex-1 min-w-0">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default Settings;
