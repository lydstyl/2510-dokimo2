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

interface PaymentWithBalance {
  payment: Payment;
  balanceBefore: number;
  balanceAfter: number;
  receiptType: 'full' | 'partial' | 'overpayment';
}

export default function LeasePaymentsPage() {
  const t = useTranslations('paymentDetails');
  const tNav = useTranslations('navigation');
  const router = useRouter();
  const params = useParams();
  const leaseId = params.leaseId as string;

  const [lease, setLease] = useState<Lease | null>(null);
  const [paymentsWithBalances, setPaymentsWithBalances] = useState<PaymentWithBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaseDetails() {
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

        // Calculate balances for each payment
        calculateBalances(leaseData);
      } catch (error) {
        console.error('Error fetching lease details:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaseDetails();
  }, [leaseId, router]);

  const calculateBalances = (leaseData: Lease) => {
    const monthlyRent = leaseData.rentAmount + leaseData.chargesAmount;
    const startDate = new Date(leaseData.startDate);

    // Sort payments by date (oldest first) for calculation
    const sortedPayments = [...leaseData.payments]
      .sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime())
      .slice(-24); // Take last 24 payments

    const paymentsWithBalanceData: PaymentWithBalance[] = [];
    let runningBalance = 0;

    sortedPayments.forEach((payment) => {
      const paymentDate = new Date(payment.paymentDate);

      // Calculate how much was owed at the time of this payment
      const monthsSinceStart = Math.floor(
        (paymentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      ) + 1;

      const expectedTotal = monthlyRent * monthsSinceStart;
      const balanceBefore = runningBalance - expectedTotal;

      // Add the payment
      runningBalance += payment.amount;

      const balanceAfter = runningBalance - expectedTotal;

      // Determine receipt type
      let receiptType: 'full' | 'partial' | 'overpayment';
      if (balanceAfter >= -0.01) { // Small tolerance for floating point
        if (balanceAfter > monthlyRent * 0.1) {
          receiptType = 'overpayment';
        } else {
          receiptType = 'full';
        }
      } else {
        receiptType = 'partial';
      }

      paymentsWithBalanceData.push({
        payment,
        balanceBefore,
        balanceAfter,
        receiptType,
      });
    });

    // Reverse to show newest first
    setPaymentsWithBalances(paymentsWithBalanceData.reverse());
  };

  const handleDownloadReceipt = async (paymentId: string, receiptType: string) => {
    try {
      const response = await fetch(`/api/receipts/${paymentId}?type=${receiptType}`);
      if (!response.ok) {
        throw new Error('Failed to generate receipt');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${paymentId}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Failed to download receipt');
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
              <a href="/dashboard/payments" className="text-blue-600 hover:text-blue-800">
                {tNav('backToPayments')}
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

        {/* Payments Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">{t('historyHeading')}</h3>

          {paymentsWithBalances.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>{t('emptyState')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.date')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.amount')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.owedBefore')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.owedAfter')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.receipt')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paymentsWithBalances.map(({ payment, balanceBefore, balanceAfter, receiptType }) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(payment.paymentDate).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(payment.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          €{payment.amount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${balanceBefore < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {balanceBefore < 0 ? '-' : '+'}€{Math.abs(balanceBefore).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${balanceAfter < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {balanceAfter < 0 ? '-' : '+'}€{Math.abs(balanceAfter).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          receiptType === 'full'
                            ? 'bg-green-100 text-green-800'
                            : receiptType === 'partial'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {receiptType === 'full' && t('receiptTypes.rent')}
                          {receiptType === 'partial' && t('receiptTypes.partial')}
                          {receiptType === 'overpayment' && t('receiptTypes.overpayment')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDownloadReceipt(payment.id, receiptType)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {t('download')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {paymentsWithBalances.length > 0 && paymentsWithBalances[0].payment.notes && (
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">
                <strong>{t('latestNotes')}</strong> {paymentsWithBalances[0].payment.notes}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
