import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';
import { Plus, PackageSearch, Tag, Package, Pencil } from 'lucide-react';
import Modal from '../components/Modal';

interface Product {
    id: string;
    name: string;
    sku: string;
    category: string;
    price: number;
    stock: number;
    minStock: number;
    location?: string;
}

export default function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const { role } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '', sku: '', category: '', price: 0, stock: 0, minStock: 10, location: ''
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get<Product[]>('/products');
            setProducts(res.data);
        } catch (err) {
            console.error("Failed to fetch products");
        }
    };

    const handleOpenCreate = () => {
        setEditingId(null);
        setFormData({ name: '', sku: '', category: '', price: 0, stock: 0, minStock: 10, location: '' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (p: Product) => {
        setEditingId(p.id);
        setFormData({
            name: p.name, sku: p.sku, category: p.category,
            price: p.price, stock: p.stock, minStock: p.minStock, location: p.location || ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                price: Number(formData.price),
                stock: Number(formData.stock),
                minStock: Number(formData.minStock)
            };
            if (editingId) {
                await api.put(`/products/${editingId}`, payload);
            } else {
                await api.post('/products', payload);
            }
            setIsModalOpen(false);
            fetchProducts();
        } catch (err) {
            alert('Failed to save product');
        }
    };

    const isEditable = role === 'ADMIN' || role === 'WAREHOUSE';

    return (
        <div className="space-y-6 transition-colors duration-300 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight transition-colors">Products</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium transition-colors">Inventory and Stock tracking</p>
                </div>
                {isEditable && (
                    <button
                        onClick={handleOpenCreate}
                        className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center font-semibold active:scale-95"
                    >
                        <Plus className="w-5 h-5 mr-2" /> Add Product
                    </button>
                )}
            </div>

            <div className="glass dark:bg-gray-800/80 rounded-2xl overflow-hidden border border-white/50 dark:border-gray-700 relative z-10 transition-colors">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                        <thead className="bg-gray-50/60 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stock Level</th>
                                {isEditable && <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm transition-colors">
                            {products.map((p) => (
                                <tr key={p.id} className="hover:bg-white/80 dark:hover:bg-gray-700/50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-50 dark:from-indigo-900/50 dark:to-blue-900/50 border border-white dark:border-gray-700 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shadow-sm group-hover:scale-110 transition-transform">
                                                <Package className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-900 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{p.name}</div>
                                                <div className="text-xs text-gray-400 dark:text-gray-500 font-medium flex items-center mt-0.5">
                                                    <Tag className="w-3 h-3 mr-1" /> {p.sku}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{p.category}</div>
                                        {p.location && <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-medium">Loc: {p.location}</div>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight transition-colors">₹{p.price.toFixed(2)}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex flex-col items-end">
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold shadow-sm ${p.stock <= p.minStock ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800'}`}>
                                                {p.stock} units
                                            </span>
                                            {p.stock <= p.minStock && (
                                                <span className="text-[10px] text-red-400 dark:text-red-500 font-bold uppercase tracking-wider mt-1">Low Stock!</span>
                                            )}
                                        </div>
                                    </td>
                                    {isEditable && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button onClick={() => handleOpenEdit(p)} className="p-2 text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors">
                                                <Pencil size={16} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {products.length === 0 && (
                                <tr>
                                    <td colSpan={isEditable ? 5 : 4} className="px-6 py-16 text-center">
                                        <div className="mb-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl inline-block shadow-inner">
                                            <PackageSearch className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                                        </div>
                                        <p className="font-semibold text-gray-600 dark:text-gray-300 text-lg">No products found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Product" : "Add New Product"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-indigo-100 mb-1">Product Name</label>
                            <input required type="text" className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-indigo-500 p-2 border" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-indigo-100 mb-1">SKU</label>
                            <input required type="text" className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-indigo-500 p-2 border uppercase" placeholder="e.g. PRD-001" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-indigo-100 mb-1">Category</label>
                            <input required type="text" className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-indigo-500 p-2 border" placeholder="e.g. Electronics" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-indigo-100 mb-1">Price (₹)</label>
                            <input required type="number" step="0.01" min="0" className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-indigo-500 p-2 border" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-indigo-100 mb-1">Location <span className="text-gray-400 font-normal">(optional)</span></label>
                            <input type="text" className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-indigo-500 p-2 border" placeholder="e.g. WH-1" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-indigo-100 mb-1">Stock Level</label>
                            <input required type="number" min="0" className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-indigo-500 p-2 border" value={formData.stock} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-indigo-100 mb-1">Min. Alert Stock</label>
                            <input required type="number" min="0" className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-indigo-500 p-2 border" value={formData.minStock} onChange={e => setFormData({ ...formData, minStock: Number(e.target.value) })} />
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md transition-colors active:scale-95">{editingId ? 'Update' : 'Save'} Product</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
