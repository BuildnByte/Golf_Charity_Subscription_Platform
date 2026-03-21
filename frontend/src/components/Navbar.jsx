import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Trophy, Home, LayoutDashboard, CreditCard, Heart, LogOut, Menu, X, ShieldAlert, Award, Users } from 'lucide-react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (err) {
            console.error('Logout failed', err);
        }
    };

    const NavLink = ({ to, icon: Icon, label, disabled = false }) => {
        const isActive = location.pathname === to;
        return (
            <Link
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all ${isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
                    } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
            >
                <Icon size={18} className={isActive ? 'stroke-[2.5]' : 'stroke-2'} />
                {label}
            </Link>
        );
    };

    return (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20 items-center">

                    {/* Brand */}
                    <div className="flex items-center gap-2 text-indigo-700 font-extrabold text-2xl tracking-tighter shrink-0 cursor-pointer" onClick={() => window.location.href = '/'}>
                        <Trophy size={28} className="stroke-[2.5]" /> LottoInc
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden lg:flex items-center gap-2">
                        {!user ? (
                            <>
                                <NavLink to="/" icon={Home} label="Overview" />
                                <div className="h-6 w-px bg-gray-200 mx-2"></div>
                                <Link to="/login" className="px-5 py-2.5 text-gray-700 font-bold hover:text-indigo-600 hover:bg-gray-50 rounded-xl transition-colors">Sign In</Link>
                                <Link to="/register" className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all ml-1">Get Started</Link>
                            </>
                        ) : user.role === 'admin' ? (
                            <>
                                <NavLink to="/admin" icon={ShieldAlert} label="System Core" />
                                <NavLink to="/admin/users" icon={Users} label="Director Matrix" />
                                <NavLink to="/admin/draw" icon={Trophy} label="Draw Engine" />
                                <NavLink to="/admin/charities" icon={Heart} label="Charities" />

                                <div className="h-6 w-px bg-gray-200 mx-2"></div>

                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-4 py-2.5 text-gray-500 font-bold hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                    title="Sign Out"
                                >
                                    <LogOut size={18} />
                                    <span className="sr-only">Sign Out</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <NavLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                                <NavLink to="/pricing" icon={CreditCard} label="Subscribe" />
                                <NavLink to="/charities" icon={Heart} label="Charities" />
                                <NavLink to="/my-winnings" icon={Award} label="My Winnings" />

                                <div className="h-6 w-px bg-gray-200 mx-2"></div>

                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-4 py-2.5 text-gray-500 font-bold hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                    title="Sign Out"
                                >
                                    <LogOut size={18} />
                                    <span className="sr-only">Sign Out</span>
                                </button>
                            </>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="lg:hidden flex items-center">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="lg:hidden border-t border-gray-100 bg-white absolute w-full left-0 shadow-lg animate-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-4 space-y-2 max-w-7xl mx-auto">
                        {!user ? (
                            <>
                                <NavLink to="/" icon={Home} label="Overview" />
                                <NavLink to="/login" icon={LogOut} label="Sign In" />
                                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center w-full px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md mt-4">
                                    Get Started
                                </Link>
                            </>
                        ) : user.role === 'admin' ? (
                            <>
                                <NavLink to="/admin" icon={ShieldAlert} label="System Core" />
                                <NavLink to="/admin/users" icon={Users} label="Director Matrix" />
                                <NavLink to="/admin/draw" icon={Trophy} label="Draw Engine" />
                                <NavLink to="/admin/charities" icon={Heart} label="Charities" />

                                <div className="h-px bg-gray-100 w-full my-4"></div>

                                <button
                                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                                    className="flex w-full items-center gap-2 px-4 py-3 text-red-600 font-bold hover:bg-red-50 rounded-xl transition-colors"
                                >
                                    <LogOut size={18} /> Sign Out
                                </button>
                            </>
                        ) : (
                            <>
                                <NavLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                                <NavLink to="/pricing" icon={CreditCard} label="Subscribe" />
                                <NavLink to="/charities" icon={Heart} label="Charities" />
                                <NavLink to="/my-winnings" icon={Award} label="My Winnings" />

                                <div className="h-px bg-gray-100 w-full my-4"></div>

                                <button
                                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                                    className="flex w-full items-center gap-2 px-4 py-3 text-red-600 font-bold hover:bg-red-50 rounded-xl transition-colors"
                                >
                                    <LogOut size={18} /> Sign Out
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
