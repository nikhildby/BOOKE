import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';
import { FileText, Plus, CheckCircle2, CircleDashed, Check } from 'lucide-react';
import Modal from '../components/Modal';

interface ChallanItem {
    id: string;
    productSnapshot: any; // { name, sku }
    productId: string;
    quantity: number;
    price: number;
}

interface Challan {
    id: string;
    challanNumber: string;
    createdAt: string;
    status: string; // DRAFT or CONFIRMED
    totalQty: number;
    customer: { id: string, name: string };
    items: ChallanItem[];
}

export default function Challans() {
    const [challans, setChallans] = useState<Challan[]>([]);
    const { role } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [customers, setCustomers] = useState<{ id: string, name: string }[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    const [customerId, setCustomerId] = useState('');
    const [items, setItems] = useState<any[]>([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [addQty, setAddQty] = useState(1);

    useEffect(() => {
        fetchChallans();
        fetchDeps();
    }, []);

    const fetchChallans = async () => {
        try {
            const res = await api.get<Challan[]>('/challans');
            setChallans(res.data);
        } catch (err) {
            console.error("Failed to fetch challans");
        }
    };

    const fetchDeps = async () => {
        try {
            const [cRes, pRes] = await Promise.all([
                api.get('/customers'),
                api.get('/products')
            ]);
            setCustomers(cRes.data);
            setProducts(pRes.data);
            if (cRes.data.length > 0) setCustomerId(cRes.data[0].id);
            if (pRes.data.length > 0) setSelectedProduct(pRes.data[0].id);
        } catch (err) {
            console.error("Failed dependencies");
        }
    };

    const handleAddItem = () => {
        const prod = products.find(p => p.id === selectedProduct);
        if (!prod) return;
        if (addQty <= 0) return alert('Quantity must be greater than 0');
        if (addQty > prod.stock) return alert(`Only ${prod.stock} items left in stock!`);

        const existing = items.find(i => i.productId === prod.id);
        if (existing) {
            if (existing.quantity + addQty > prod.stock) return alert('Cannot exceed stock!');
            setItems(items.map(i => i.productId === prod.id ? { ...i, quantity: i.quantity + addQty } : i));
        } else {
            setItems([...items, {
                productId: prod.id,
                name: prod.name,
                sku: prod.sku,
                price: prod.price,
                quantity: addQty
            }]);
        }
    };

    const removeItem = (pid: string) => {
        setItems(items.filter(i => i.productId !== pid));
    };

    const handleCreateChallan = async (status: string) => {
        let finalItems = [...items];

        // UX Enhancement: If they selected a product but forgot to hit the '+' button before saving
        if (finalItems.length === 0 && selectedProduct) {
            const prod = products.find(p => p.id === selectedProduct);
            if (prod && addQty > 0 && addQty <= prod.stock) {
                finalItems.push({
                    productId: prod.id,
                    name: prod.name,
                    sku: prod.sku,
                    price: prod.price,
                    quantity: addQty
                });
            } else {
                return alert('Please click the "+" button to add valid items to the list before saving.');
            }
        }

        if (!customerId || finalItems.length === 0) return alert('Select a customer and add items');
        try {
            await api.post('/challans', {
                customerId,
                items: finalItems,
                status
            });
            setIsModalOpen(false);
            setItems([]);
            fetchChallans();
            fetchDeps(); // Refresh stock in products
        } catch (err: any) {
            console.error("Failed to post challan:", err);
            // Enhanced error messaging if it fails
            alert("CREATE CHALLAN ERROR: " + (err.response?.data?.error || err.message || 'Unknown network error'));
        }
    };

    const handleConfirmDraft = async (id: string) => {
        if (!confirm('Are you sure you want to mark this Draft as Confirmed? This will permanently deduct inventory.')) return;
        try {
            await api.put(`/challans/${id}/status`, { status: 'CONFIRMED' });
            fetchChallans();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to confirm challan.');
        }
    };

    const handleCancelChallan = async (id: string) => {
        if (!confirm('Are you sure you want to Cancel this challan? If confirmed, inventory will be restored.')) return;
        try {
            await api.put(`/challans/${id}/cancel`);
            fetchChallans();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to cancel challan.');
        }
    };

    const isSales = role === 'ADMIN' || role === 'SALES';

    return (
        <div className="space-y-6 transition-colors duration-300 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight transition-colors">Sales Challans</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium transition-colors">Track outgoing shipments and manifests</p>
                </div>
                {isSales && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center font-semibold active:scale-95"
                    >
                        <Plus className="w-5 h-5 mr-2" /> New Challan
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {challans.map((ch) => (
                    <div key={ch.id} className="glass dark:bg-gray-800/80 rounded-[2rem] p-6 border border-white/60 dark:border-gray-700 hover:shadow-xl transition-all group flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl text-white shadow-lg ${ch.status === 'CONFIRMED' ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : ch.status === 'CANCELLED' ? 'bg-gradient-to-br from-red-400 to-rose-500' : 'bg-gradient-to-br from-amber-400 to-orange-500'}`}>
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h3 className={`font-bold text-lg transition-colors ${ch.status === 'CANCELLED' ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-gray-100'}`}>{ch.challanNumber}</h3>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold">{new Date(ch.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm border ${ch.status === 'CONFIRMED' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' : ch.status === 'CANCELLED' ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800'}`}>
                                    {ch.status === 'CONFIRMED' ? <CheckCircle2 size={12} /> : ch.status === 'CANCELLED' ? <span className="font-mono">X</span> : <CircleDashed size={12} />}
                                    {ch.status}
                                </span>
                            </div>

                            <div className="mb-4">
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold mb-1">Customer</p>
                                <p className="font-semibold text-gray-800 dark:text-gray-200 transition-colors">{ch.customer?.name || 'Unknown'}</p>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 mb-4 border border-gray-100 dark:border-gray-700 shadow-inner">
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-2">Line Items ({ch.totalQty} units total)</p>
                                <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                    {ch.items.map(item => {
                                        let snap: any = {};
                                        try { snap = typeof item.productSnapshot === 'string' ? JSON.parse(item.productSnapshot) : (item.productSnapshot || {}); } catch (e) { }
                                        return (
                                            <div key={item.id} className="flex justify-between items-center text-sm">
                                                <span className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[150px] transition-colors">{snap.name || 'Unknown Product'}</span>
                                                <span className="text-gray-900 dark:text-white font-bold transition-colors">{item.quantity} x <span className="text-gray-500 text-xs">₹{item.price}</span></span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {isSales && ch.status === 'DRAFT' && (
                            <div className="w-full mt-2 grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => handleConfirmDraft(ch.id)}
                                    className="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 font-bold py-2.5 rounded-xl transition-colors border border-emerald-200 dark:border-emerald-800/50 flex flex-row justify-center items-center gap-2"
                                >
                                    <Check size={16} /> Confirm
                                </button>
                                <button
                                    onClick={() => handleCancelChallan(ch.id)}
                                    className="bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 font-bold py-2.5 rounded-xl transition-colors border border-red-200 dark:border-red-800/50 flex flex-row justify-center items-center gap-2"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                        {isSales && ch.status === 'CONFIRMED' && (
                            <div className="w-full mt-2">
                                <button
                                    onClick={() => handleCancelChallan(ch.id)}
                                    className="w-full bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 font-bold py-2.5 rounded-xl transition-colors border border-red-200 dark:border-red-800/50 flex flex-row justify-center items-center gap-2"
                                >
                                    Cancel & Refund Stock
                                </button>
                            </div>
                        )}
                    </div>
                ))}
                {challans.length === 0 && (
                    <div className="col-span-1 md:col-span-2 xl:col-span-3 text-center py-20">
                        <p className="text-gray-500 text-lg font-medium">No sales challans recorded.</p>
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Sales Challan">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-indigo-100 mb-1">Select Customer</label>
                        <select
                            className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-indigo-500 p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            value={customerId}
                            onChange={e => setCustomerId(e.target.value)}
                        >
                            {customers.map(c => <option key={c.id} value={c.id} className="bg-white dark:bg-gray-800">{c.name}</option>)}
                        </select>
                    </div>

                    <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl space-y-3 transition-colors">
                        <label className="block text-sm font-bold text-indigo-900 dark:text-indigo-300">Add Items</label>
                        <div className="flex gap-2">
                            <select
                                className="flex-1 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-indigo-500 p-2 border bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                                value={selectedProduct}
                                onChange={e => setSelectedProduct(e.target.value)}
                            >
                                {products.map(p => (
                                    <option key={p.id} value={p.id} className="bg-white dark:bg-gray-800">
                                        {p.name} (Stock: {p.stock})
                                    </option>
                                ))}
                            </select>
                            <input
                                type="number"
                                min="1"
                                className="w-20 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm p-2 border bg-white dark:bg-gray-700 text-center text-sm text-gray-900 dark:text-white"
                                value={addQty}
                                onChange={e => setAddQty(Number(e.target.value))}
                            />
                            <button type="button" onClick={handleAddItem} className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition">
                                <Plus size={20} />
                            </button>
                        </div>

                        {items.length > 0 && (
                            <div className="mt-3 space-y-2">
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Current Items:</p>
                                {items.map(i => (
                                    <div key={i.productId} className="flex justify-between items-center bg-white dark:bg-gray-800 p-2 rounded-lg text-sm shadow-sm border border-gray-100 dark:border-gray-700">
                                        <span className="font-medium text-gray-800 dark:text-gray-200">{i.name}</span>
                                        <div className="flex items-center gap-3 text-gray-900 dark:text-white font-bold">
                                            {i.quantity}
                                            <button onClick={() => removeItem(i.productId)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 font-bold p-1">&times;</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pt-4 flex justify-between gap-3 border-t border-gray-100 dark:border-gray-700">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => handleCreateChallan('DRAFT')} className="px-4 py-2 text-sm font-semibold text-amber-700 dark:text-amber-500 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800/50 rounded-lg transition-colors active:scale-95">Save Draft</button>
                            <button type="button" onClick={() => handleCreateChallan('CONFIRMED')} className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md transition-colors active:scale-95">Create & Confirm</button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
