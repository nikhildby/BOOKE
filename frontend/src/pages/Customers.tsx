import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Search, Building2, Pencil } from 'lucide-react';
import Modal from '../components/Modal';

interface Customer {
    id: string;
    name: string;
    mobile: string;
    email: string | null;
    businessName: string | null;
    gst: string | null;
    type: string;
    status: string;
    address?: string;
    followUpDate: string | null;
    notes: string | null;
    createdAt?: string;
}

export default function Customers() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '', mobile: '', email: '', type: 'RETAIL', status: 'ACTIVE', address: '',
        businessName: '', gst: '', followUpDate: '', notes: ''
    });
    const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async (search = '') => {
        try {
            const res = await api.get<Customer[]>(`/customers?search=${search}`);
            setCustomers(res.data);
        } catch (err) {
            console.error("Failed to fetch customers");
        }
    };

    const handleOpenCreate = () => {
        setEditingId(null);
        setFormData({ name: '', mobile: '', email: '', type: 'RETAIL', status: 'ACTIVE', address: '', businessName: '', gst: '', followUpDate: '', notes: '' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (c: Customer) => {
        setEditingId(c.id);
        const fDate = c.followUpDate ? new Date(c.followUpDate).toISOString().split('T')[0] : '';
        setFormData({
            name: c.name, mobile: c.mobile, email: c.email || '', type: c.type, status: c.status, address: c.address || '',
            businessName: c.businessName || '', gst: c.gst || '', followUpDate: fDate, notes: c.notes || ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                followUpDate: formData.followUpDate ? new Date(formData.followUpDate).toISOString() : null
            };
            if (editingId) {
                await api.put(`/customers/${editingId}`, payload);
            } else {
                await api.post('/customers', payload);
            }
            setIsModalOpen(false);
            fetchCustomers();
        } catch (err) {
            alert('Failed to save customer');
        }
    };

    return (
        <div className="space-y-6 transition-colors duration-300 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight transition-colors">Customers</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium transition-colors">Manage your customer base CRM</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center font-semibold active:scale-95"
                >
                    <Plus className="w-5 h-5 mr-2" /> Add Customer
                </button>
            </div>

            <div className="glass dark:bg-gray-800/80 rounded-2xl overflow-hidden border border-white/50 dark:border-gray-700 relative z-10 transition-colors">
                <div className="p-5 border-b border-gray-100/50 dark:border-gray-700 flex flex-col sm:flex-row items-center gap-4 bg-white/40 dark:bg-gray-800/40">
                    <div className="relative w-full sm:max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            onChange={(e) => fetchCustomers(e.target.value)}
                            className="block w-full pl-11 pr-4 py-2.5 border border-transparent dark:border-gray-600 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] rounded-xl outline-none text-sm bg-white/70 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-gray-400"
                            placeholder="Search by name, email, or mobile..."
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                        <thead className="bg-gray-50/60 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm transition-colors">
                            {customers.map((c) => (
                                <React.Fragment key={c.id}>
                                    <tr
                                        className="hover:bg-white/80 dark:hover:bg-gray-700/50 transition-colors group cursor-pointer"
                                        onClick={(e) => {
                                            if ((e.target as HTMLElement).closest('.actions-col')) return;
                                            setExpandedCustomer(expandedCustomer === c.id ? null : c.id);
                                        }}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm border border-white dark:border-gray-700">
                                                    <Building2 className="h-5 w-5" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-gray-900 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{c.name}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{c.businessName || 'Individual'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 font-medium">
                                            {c.mobile}<br /><span className="text-xs text-gray-400">{c.email || 'No email'}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide ${c.type === 'B2B' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'}`}>
                                                {c.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-sm border ${c.status === 'ACTIVE' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'}`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right actions-col">
                                            <button onClick={() => handleOpenEdit(c)} className="p-2 text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors">
                                                <Pencil size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                    {/* Expandable CRM Details */}
                                    {expandedCustomer === c.id && (
                                        <tr className="bg-indigo-50/20 dark:bg-gray-900/40">
                                            <td colSpan={5} className="px-6 py-6 border-b border-gray-100 dark:border-gray-800">
                                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                                    <div>
                                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Company Insights</h4>
                                                        <div className="space-y-1.5">
                                                            <p className="text-sm text-gray-800 dark:text-gray-200"><span className="font-semibold text-gray-500 dark:text-gray-400">Business Name:</span> {c.businessName || 'N/A'}</p>
                                                            <p className="text-sm text-gray-800 dark:text-gray-200"><span className="font-semibold text-gray-500 dark:text-gray-400">GST Number:</span> {c.gst ? <span className="font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded">{c.gst}</span> : 'N/A'}</p>
                                                            <p className="text-sm text-gray-800 dark:text-gray-200"><span className="font-semibold text-gray-500 dark:text-gray-400">Address:</span> {c.address}</p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Sales CRM Tracking</h4>
                                                        <div className="space-y-1.5">
                                                            <p className="text-sm text-gray-800 dark:text-gray-200"><span className="font-semibold text-gray-500 dark:text-gray-400">Next Follow-Up:</span> {c.followUpDate ? new Date(c.followUpDate).toLocaleDateString() : 'Unscheduled'}</p>
                                                            <p className="text-sm text-gray-800 dark:text-gray-200"><span className="font-semibold text-gray-500 dark:text-gray-400">Customer Since:</span> {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="bg-white/80 dark:bg-gray-800/80 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                                        <h4 className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-2">Account Notes</h4>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                                                            {c.notes || 'No historical notes recorded for this customer.'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                            {customers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-gray-500 text-sm flex flex-col items-center">
                                        <div className="mb-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-inner inline-block">
                                            <Search className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                                        </div>
                                        <p className="font-medium text-gray-600 dark:text-gray-300 text-lg">No customers found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Customer" : "Add New Customer"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-indigo-100 mb-1">Full Name *</label>
                        <input required type="text" className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-indigo-500 p-2 border" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-indigo-100 mb-1">Mobile *</label>
                            <input required type="text" className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-indigo-500 p-2 border" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-indigo-100 mb-1">Email <span className="text-gray-400 font-normal">(optional)</span></label>
                            <input type="email" className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-indigo-500 p-2 border" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-indigo-100 mb-1">Business Name</label>
                            <input type="text" className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-indigo-500 p-2 border" value={formData.businessName} onChange={e => setFormData({ ...formData, businessName: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-indigo-100 mb-1">GST Number</label>
                            <input type="text" className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-indigo-500 p-2 border uppercase" value={formData.gst} onChange={e => setFormData({ ...formData, gst: e.target.value })} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-indigo-100 mb-1">Address *</label>
                        <input required type="text" className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-indigo-500 p-2 border" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-3 gap-4 border-t border-gray-100 dark:border-gray-700 pt-3 mt-3">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-indigo-100 mb-1">Customer Type</label>
                            <select className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-indigo-500 p-2 border" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                <option value="RETAIL" className="bg-white dark:bg-gray-800">Retail</option>
                                <option value="WHOLESALE" className="bg-white dark:bg-gray-800">Wholesale</option>
                                <option value="DISTRIBUTOR" className="bg-white dark:bg-gray-800">Distributor</option>
                                <option value="B2B" className="bg-white dark:bg-gray-800">B2B</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-indigo-100 mb-1">Status</label>
                            <select className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-indigo-500 p-2 border" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                <option value="ACTIVE" className="bg-white dark:bg-gray-800">Active</option>
                                <option value="LEAD" className="bg-white dark:bg-gray-800">Lead</option>
                                <option value="INACTIVE" className="bg-white dark:bg-gray-800">Inactive</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-indigo-100 mb-1">Follow-Up</label>
                            <input type="date" className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-indigo-500 p-2 border" value={formData.followUpDate} onChange={e => setFormData({ ...formData, followUpDate: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-indigo-100 mb-1">Notes</label>
                        <textarea className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-indigo-500 p-2 border" rows={2} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}></textarea>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md transition-colors active:scale-95">{editingId ? 'Update' : 'Save'} Customer</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
