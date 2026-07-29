import React from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Box, FileText, LogOut, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Layout({ children }: { children: React.ReactNode }) {
    const { logout, role } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [isDarkMode, setIsDarkMode] = React.useState(
        () => document.documentElement.className.includes('dark')
    );

    const toggleDarkMode = () => {
        if (isDarkMode) {
            document.documentElement.classList.remove('dark');
            setIsDarkMode(false);
        } else {
            document.documentElement.classList.add('dark');
            setIsDarkMode(true);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Customers', path: '/customers', icon: Users },
        { name: 'Products', path: '/products', icon: Box },
        { name: 'Challans', path: '/challans', icon: FileText },
    ];

    const allowedNav = navItems.filter(item => {
        if (item.name === 'Dashboard') return true;
        if (item.name === 'Customers' && (role === 'ADMIN' || role === 'SALES')) return true;
        if (item.name === 'Challans' && (role === 'ADMIN' || role === 'SALES')) return true;
        if (item.name === 'Products' && (role === 'ADMIN' || role === 'WAREHOUSE')) return true;
        return false;
    });

    return (
        <div className="min-h-screen flex transition-colors duration-300">
            {/* Sidebar */}
            <aside className="w-64 bg-indigo-900 text-white flex flex-col hidden md:flex rounded-r-3xl my-2 ml-2 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 rounded-full bg-indigo-800 opacity-50 blur-xl"></div>
                <div className="p-6 pb-2 relative">
                    <h2 className="text-2xl font-bold tracking-wider">BOOKE</h2>
                    <p className="text-indigo-300 text-xs mt-1 uppercase font-semibold tracking-widest">{role} PORTAL</p>
                </div>

                <nav className="flex-1 mt-8 space-y-1 relative px-3">
                    {allowedNav.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${isActive
                                    ? 'bg-indigo-800 text-white shadow-lg'
                                    : 'text-indigo-200 hover:bg-indigo-800/50 hover:text-white'
                                    }`}
                            >
                                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-indigo-400' : 'text-indigo-300'}`} />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-indigo-800 relative z-10 m-3">
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm font-medium text-pink-200 bg-indigo-950/40 rounded-lg hover:bg-pink-600 hover:text-white transition-all shadow-md"
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative dark:bg-gray-900 transition-colors duration-300">
                <div className="absolute inset-0 bg-gray-100 dark:bg-gray-900 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] transition-colors duration-300"></div>

                {/* Header (Toggle) */}
                <header className="relative z-20 flex justify-end p-4 md:px-8">
                    <button
                        onClick={toggleDarkMode}
                        className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto px-4 pb-4 md:px-8 md:pb-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        key={location.pathname}
                    >
                        {children}
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
