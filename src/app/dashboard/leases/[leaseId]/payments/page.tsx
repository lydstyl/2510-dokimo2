'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
}

interface Property {
  id: string;
  name: string;
  address: string;
  postalCode: string;
  city: string;
}

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  notes: string | null;
  createdAt: string;
}

interface Lease {
  id: string;
  rentAmount: number;
  chargesAmount: number;
  paymentDueDay: number;
  startDate: string;
  endDate: string | null;
  tenant: Tenant;
  property: Property;
  payments: Payment[];
}

interface MonthlyRow {
  month: string; // YYYY-MM format
  monthLabel: string; // For display
  monthlyRent: number;
  payments: Payment[];
  totalPaid: number;
  balanceBefore: number;
  balanceAfter: number;
  receiptType: 'full' | 'partial' | 'overpayment' | 'unpaid';
}

export default function LeasePaymentsPage() {
  const t = useTranslations('paymentDetails');
  const tNav = useTranslations('navigation');
  const router = useRouter();
  const params = useParams();
  const leaseId = params.leaseId as string;

  const [lease, setLease] = useState<Lease | null>(null);
  const [monthlyRows, setMonthlyRows] = useState<MonthlyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    fetchLeaseDetails();
  }, [leaseId, router]);

  const fetchLeaseDetails = async () => {
    try {
      const response = await fetch(`/api/leases/${leaseId}`);
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch lease details');
      }

      const leaseData: Lease = await response.json();
      setLease(leaseData);
      calculateMonthlyRows(leaseData);
    } catch (error) {
      console.error('Error fetching lease details:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyRows = (leaseData: Lease) => {
    const monthlyRent = leaseData.rentAmount + leaseData.chargesAmount;
    const startDate = new Date(leaseData.startDate);
    const endDate = leaseData.endDate ? new Date(leaseData.endDate) : new Date();

    // Generate all months from start to end (or now)
    const months: string[] = [];
    const currentDate = new Date(startDate);
    currentDate.setDate(1); // Set to first of month

    while (currentDate <= endDate) {
      // Use local date formatting to avoid UTC timezone issues causing duplicates
      const yearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      months.push(yearMonth);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Take last 24 months
    const last24Months = months.slice(-24);

    // Group payments by month
    const paymentsByMonth = new Map<string, Payment[]>();
    leaseData.payments.forEach(payment => {
      const month = payment.paymentDate.substring(0, 7);
      if (!paymentsByMonth.has(month)) {
        paymentsByMonth.set(month, []);
      }
      paymentsByMonth.get(month)!.push(payment);
    });

    // Calculate running balance
    let runningBalance = 0;
    const rows: MonthlyRow[] = [];

    last24Months.forEach(month => {
      const monthPayments = paymentsByMonth.get(month) || [];
      const totalPaid = monthPayments.reduce((sum, p) => sum + p.amount, 0);

      const balanceBefore = runningBalance;
      runningBalance = runningBalance + totalPaid - monthlyRent;
      const balanceAfter = runningBalance;

      // Determine receipt type
      let receiptType: 'full' | 'partial' | 'overpayment' | 'unpaid';
      if (totalPaid === 0) {
        receiptType = 'unpaid';
      } else if (balanceAfter >= -0.01) {
        if (balanceAfter > monthlyRent * 0.1) {
          receiptType = 'overpayment';
        } else {
          receiptType = 'full';
        }
      } else {
        receiptType = 'partial';
      }

      const [year, monthNum] = month.split('-');
      const monthDate = new Date(parseInt(year), parseInt(monthNum) - 1);
      const monthLabel = monthDate.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });

      rows.push({
        month,
        monthLabel,
        monthlyRent,
        payments: monthPayments.sort((a, b) =>
          new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
        ),
        totalPaid,
        balanceBefore,
        balanceAfter,
        receiptType,
      });
    });

    // Reverse to show newest first
    setMonthlyRows(rows.reverse());
  };

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setEditAmount(payment.amount.toString());
    setEditDate(payment.paymentDate.split('T')[0]);
    setEditNotes(payment.notes || '');
  };

  const handleSaveEdit = async () => {
    if (!editingPayment || !lease) return;

    try {
      const response = await fetch(`/api/payments/${editingPayment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(editAmount),
          paymentDate: editDate,
          notes: editNotes || null,
        }),
      });

      if (response.ok) {
        setEditingPayment(null);
        fetchLeaseDetails();
      } else {
        const error = await response.json();
        alert('Erreur: ' + error.error);
      }
    } catch (error) {
      alert('Échec de la modification du paiement');
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchLeaseDetails();
      } else {
        const error = await response.json();
        alert('Erreur: ' + error.error);
      }
    } catch (error) {
      alert('Échec de la suppression du paiement');
    }
  };

  const handleDownloadReceipt = async (month: string, receiptType: string) => {
    if (!lease) return;

    // For unpaid months, generate a special receipt
    if (receiptType === 'unpaid') {
      const monthRow = monthlyRows.find(r => r.month === month);
      if (!monthRow) return;

      // Generate unpaid receipt content
      const content = `AVIS DE LOYER IMPAYÉ\n\n` +
        `Locataire: ${lease.tenant.firstName} ${lease.tenant.lastName}\n` +
        `Bien: ${lease.property.name}\n` +
        `Adresse: ${lease.property.address}, ${lease.property.postalCode} ${lease.property.city}\n\n` +
        `Mois: ${monthRow.monthLabel}\n` +
        `Loyer dû: ${monthRow.monthlyRent.toFixed(2)} €\n` +
        `Montant payé: 0.00 €\n` +
        `Solde dû: ${Math.abs(monthRow.balanceAfter).toFixed(2)} €\n\n` +
        `Ce document atteste que le loyer du mois n'a pas été payé.`;

      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `avis-impaye-${month}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return;
    }

    // For paid months, use the first payment's receipt
    const monthRow = monthlyRows.find(r => r.month === month);
    if (!monthRow || monthRow.payments.length === 0) return;

    const payment = monthRow.payments[0];

    try {
      const response = await fetch(`/api/receipts/${payment.id}?type=${receiptType}`);
      if (!response.ok) {
        throw new Error('Failed to generate receipt');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${month}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Échec du téléchargement du reçu');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">{t('loading')}</div>
      </div>
    );
  }

  if (!lease) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">{t('notFound')}</div>
      </div>
    );
  }

  const monthlyRent = lease.rentAmount + lease.chargesAmount;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <a href="/dashboard/leases" className="text-blue-600 hover:text-blue-800">
                {tNav('backToDashboard')}
              </a>
              <h1 className="text-xl font-bold">{t('title')}</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Lease Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">
            {lease.tenant.firstName} {lease.tenant.lastName}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">{t('leaseSummary.property')}</p>
              <p className="font-medium">{lease.property.name}</p>
              <p className="text-gray-500">{lease.property.address}</p>
              <p className="text-gray-500">{lease.property.postalCode} {lease.property.city}</p>
            </div>
            <div>
              <p className="text-gray-600">{t('leaseSummary.contact')}</p>
              <p className="font-medium">{lease.tenant.email || t('noEmail')}</p>
              <p className="text-gray-500">{lease.tenant.phone || t('noPhone')}</p>
            </div>
            <div>
              <p className="text-gray-600">{t('leaseSummary.monthlyRent')}</p>
              <p className="font-medium text-lg">€{monthlyRent.toFixed(2)}</p>
              <p className="text-gray-500">{t('leaseSummary.rent')} €{lease.rentAmount.toFixed(2)} + {t('leaseSummary.charges')} €{lease.chargesAmount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-600">{t('leaseSummary.leasePeriod')}</p>
              <p className="font-medium">
                {new Date(lease.startDate).toLocaleDateString('fr-FR')} - {lease.endDate ? new Date(lease.endDate).toLocaleDateString('fr-FR') : t('leaseSummary.ongoing')}
              </p>
              <p className="text-gray-500">{t('leaseSummary.dueDay')} {lease.paymentDueDay}</p>
            </div>
          </div>
        </div>

        {/* Monthly Payments Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">{t('historyHeading')}</h3>

          {monthlyRows.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>{t('emptyState')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mois</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loyer dû</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant payé</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dû avant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dû après</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type de reçu</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {monthlyRows.map((row) => (
                    <tr key={row.month} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{row.monthLabel}</div>
                        {row.payments.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {row.payments.map((p, idx) => (
                              <div key={p.id} className="flex items-center gap-2 mt-1">
                                <span>{new Date(p.paymentDate).toLocaleDateString('fr-FR')}: €{p.amount.toFixed(2)}</span>
                                <button
                                  onClick={() => handleEditPayment(p)}
                                  className="text-blue-600 hover:text-blue-900 text-xs"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeletePayment(p.id)}
                                  className="text-red-600 hover:text-red-900 text-xs"
                                >
                                  🗑️
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">€{row.monthlyRent.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          €{row.totalPaid.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${row.balanceBefore < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {row.balanceBefore < 0 ? '-' : '+'}€{Math.abs(row.balanceBefore).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${row.balanceAfter < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {row.balanceAfter < 0 ? '-' : '+'}€{Math.abs(row.balanceAfter).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          row.receiptType === 'full'
                            ? 'bg-green-100 text-green-800'
                            : row.receiptType === 'partial'
                            ? 'bg-yellow-100 text-yellow-800'
                            : row.receiptType === 'overpayment'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {row.receiptType === 'full' && 'Quittance de loyer'}
                          {row.receiptType === 'partial' && 'Reçu partiel'}
                          {row.receiptType === 'overpayment' && 'Trop-perçu'}
                          {row.receiptType === 'unpaid' && 'Loyer impayé'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDownloadReceipt(row.month, row.receiptType)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Télécharger
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Edit Payment Modal */}
      {editingPayment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Modifier le paiement</h3>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setEditingPayment(null)}
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de paiement
              </label>
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optionnel)
              </label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                onClick={() => setEditingPayment(null)}
              >
                Annuler
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
