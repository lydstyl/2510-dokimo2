'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface RentRow {
  leaseId: string;
  property: {
    id: string;
    name: string;
  };
  tenant: {
    id: string;
    firstName: string;
    lastName: string;
  };
  month: string;
  rentDue: number;
  amountPaid: number;
  balanceBefore: number;
  balanceAfter: number;
  receiptType: 'unpaid' | 'partial' | 'full' | 'overpayment';
  payments: Array<{
    id: string;
    amount: number;
    paymentDate: string;
    notes: string | null;
  }>;
}

export default function QuickRentOverviewPage() {
  const t = useTranslations('quickRent');
  const tNav = useTranslations('navigation');
  const router = useRouter();
  const [rentRows, setRentRows] = useState<RentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLease, setSelectedLease] = useState<string | null>(null);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    fetchRentOverview();
  }, []);

  const fetchRentOverview = async () => {
    try {
      const response = await fetch('/api/quick-rent-overview');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch rent overview');
      }

      const data: RentRow[] = await response.json();
      setRentRows(data);
    } catch (error) {
      console.error('Error fetching rent overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (leaseId: string, rentDue: number) => {
    setSelectedLease(leaseId);
    setPaymentForm({
      amount: rentDue.toString(),
      paymentDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setShowAddPaymentModal(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLease) return;

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaseId: selectedLease,
          amount: parseFloat(paymentForm.amount),
          paymentDate: paymentForm.paymentDate,
          notes: paymentForm.notes || null,
        }),
      });

      if (response.ok) {
        setShowAddPaymentModal(false);
        setSelectedLease(null);
        fetchRentOverview(); // Refresh data
      } else {
        const error = await response.json();
        alert('Erreur: ' + error.error);
      }
    } catch (error) {
      alert('Échec de l\'enregistrement du paiement');
    }
  };

  const handleDownloadReceipt = (format: 'txt' | 'pdf', leaseId: string, month: string) => {
    // Navigate to the lease payments page where receipts can be downloaded
    const [year, monthNum] = month.split('-');
    router.push(`/dashboard/leases/${leaseId}/payments`);
  };

  const getReceiptTypeLabel = (type: string) => {
    return t(`receiptTypes.${type}` as any);
  };

  const getReceiptTypeColor = (type: string) => {
    switch (type) {
      case 'full':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      case 'overpayment':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
                {tNav('backToDashboard')}
              </a>
              <h1 className="text-xl font-bold">{t('title')}</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">{t('heading')}</h2>
            <div className="text-sm text-gray-500">
              {t('currentMonth')}: {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </div>
          </div>

          {rentRows.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">{t('emptyState')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('table.property')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('table.tenant')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('table.rentDue')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('table.amountPaid')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('table.balanceBefore')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('table.balanceAfter')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('table.receiptType')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rentRows.map((row) => (
                    <tr key={row.leaseId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{row.property.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {row.tenant.firstName} {row.tenant.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">€{row.rentDue.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">€{row.amountPaid.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${row.balanceBefore < 0 ? 'text-red-600' : row.balanceBefore > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                          €{row.balanceBefore.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${row.balanceAfter < 0 ? 'text-red-600' : row.balanceAfter > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                          €{row.balanceAfter.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getReceiptTypeColor(row.receiptType)}`}>
                          {getReceiptTypeLabel(row.receiptType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-col gap-1">
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleDownloadReceipt('txt', row.leaseId, row.month)}
                              className="text-blue-600 hover:text-blue-900 font-medium text-xs"
                            >
                              {t('actions.downloadTxt')}
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={() => handleDownloadReceipt('pdf', row.leaseId, row.month)}
                              className="text-blue-600 hover:text-blue-900 font-medium text-xs"
                            >
                              {t('actions.downloadPdf')}
                            </button>
                          </div>
                          <button
                            onClick={() => handleAddPayment(row.leaseId, row.rentDue)}
                            className="text-green-600 hover:text-green-900 font-medium text-xs text-left"
                          >
                            {t('actions.addPayment')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add Payment Modal */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">{t('modal.addTitle')}</h3>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setShowAddPaymentModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPayment}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('modal.amount')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('modal.date')}
                </label>
                <input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('modal.notes')}
                </label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  onClick={() => setShowAddPaymentModal(false)}
                >
                  {t('modal.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {t('modal.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
