import { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, Package, FileText, TrendingUp, Activity, RefreshCw } from 'lucide-react';
import api from '../api';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

export default function Dashboard() {
    const [stats, setStats] = useState({
        customers: 0,
        products: 0,
        challans: 0,
        unitsDelivered: 0
    });
    const [loading, setLoading] = useState(false);

    // Chart Data States
    const [customerTypes, setCustomerTypes] = useState<any[]>([]);
    const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const results = await Promise.allSettled([
                api.get('/customers'),
                api.get('/products'),
                api.get('/challans')
            ]);

            const cRes = results[0].status === 'fulfilled' ? results[0].value.data || [] : [];
            const pRes = results[1].status === 'fulfilled' ? results[1].value.data || [] : [];
            const chRes = results[2].status === 'fulfilled' ? results[2].value.data || [] : [];

            const activeChallans = chRes.filter((x: any) => x.status === 'CONFIRMED').length;
            const delivered = chRes.reduce((acc: number, x: any) => x.status === 'CONFIRMED' ? acc + (Number(x.totalQty) || 0) : acc, 0);

            setStats({
                customers: cRes.length,
                products: pRes.length,
                challans: activeChallans,
                unitsDelivered: delivered
            });

            // Process Data for Pie Chart (Customer Types)
            const typeCounts = cRes.reduce((acc: any, curr: any) => {
                acc[curr.type] = (acc[curr.type] || 0) + 1;
                return acc;
            }, {});
            const pieData = Object.keys(typeCounts).map(key => ({
                name: key, value: typeCounts[key]
            }));
            setCustomerTypes(pieData);

            // Process Data for Bar Chart (Lowest Stock Products)
            const sortedProducts = [...pRes].sort((a, b) => a.stock - b.stock).slice(0, 7);
            const barData = sortedProducts.map(p => ({
                name: p.name.substring(0, 10) + (p.name.length > 10 ? '..' : ''),
                stock: p.stock,
                minStock: p.minStock
            }));
            setLowStockProducts(barData);

        } catch (err) {
            console.error("Failed to load dashboard metrics", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
        const onFocus = () => fetchStats();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [fetchStats]);

    const cards = [
        { title: 'Total Customers', value: stats.customers, icon: Users, color: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/30' },
        { title: 'Total Products', value: stats.products, icon: Package, color: 'from-pink-500 to-rose-600', shadow: 'shadow-pink-500/30' },
        { title: 'Confirmed Challans', value: stats.challans, icon: FileText, color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/30' },
        { title: 'Units Shipped', value: stats.unitsDelivered, icon: TrendingUp, color: 'from-purple-500 to-indigo-600', shadow: 'shadow-purple-500/30' },
    ];

    const COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6'];

    return (
        <div className="space-y-8 transition-colors duration-300 pb-12">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl shadow-inner transition-colors">
                        <Activity size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white drop-shadow-sm tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-indigo-900 dark:from-gray-100 dark:to-indigo-300 transition-colors">Dashboard Overview</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 font-semibold transition-colors">Real-time pulse of BOOKE Central Operations</p>
                    </div>
                </div>
                <button onClick={fetchStats} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition flex items-center gap-2 font-medium" title="Refresh Data">
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    <span className="hidden sm:inline">Refresh</span>
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className="glass dark:bg-gray-800/80 rounded-[1.5rem] p-6 flex flex-col relative overflow-hidden group cursor-pointer border border-white/60 dark:border-gray-700 transition-colors duration-300"
                    >
                        <div className={`absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-gradient-to-br opacity-50 dark:opacity-20 blur-2xl transition-transform group-hover:scale-150 ${stat.color}`}></div>

                        <div className={`p-4 rounded-[1.25rem] bg-gradient-to-br ${stat.color} text-white shadow-lg ${stat.shadow} self-start mb-4 z-10 transition-transform group-hover:-translate-y-1`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div className="z-10">
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest transition-colors">{stat.title}</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <p className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tighter transition-colors">{loading ? '...' : stat.value}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Advanced Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                {/* Chart 1: Customer Demographics */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass dark:bg-gray-800/80 rounded-[2rem] p-6 border border-white/60 dark:border-gray-700 transition-colors duration-300"
                >
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 transition-colors">Customer Demographics</h3>
                    <div className="h-[300px] w-full">
                        {customerTypes.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={customerTypes}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {customerTypes.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                                        itemStyle={{ fontWeight: 'bold' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 font-medium">No Customer Data Found</div>
                        )}
                    </div>
                </motion.div>

                {/* Chart 2: Inventory Alert (Lowest Stock) */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass dark:bg-gray-800/80 rounded-[2rem] p-6 border border-white/60 dark:border-gray-700 transition-colors duration-300"
                >
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 transition-colors">Lowest Stock Products</h3>
                    <div className="h-[300px] w-full">
                        {lowStockProducts.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={lowStockProducts}
                                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <RechartsTooltip
                                        cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="stock" name="Current Stock" fill="#ec4899" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="minStock" name="Min Allowed" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 font-medium">No Product Data Found</div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
