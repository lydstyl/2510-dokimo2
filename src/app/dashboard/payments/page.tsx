'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
}

interface Property {
  id: string;
  name: string;
  address: string;
}

interface Payment {
  id: string;
  amount: number;
  paymentDate: Date;
}

interface Lease {
  id: string;
  rentAmount: number;
  chargesAmount: number;
  paymentDueDay: number;
  startDate: Date;
  tenant: Tenant;
  property: Property;
  payments: Payment[];
}

interface LeaseStatus {
  lease: Lease;
  monthlyRent: number;
  totalPaid: number;
  expectedTotal: number;
  balance: number;
  isUpToDate: boolean;
  lastPaymentDate?: Date;
  lastPaymentAmount?: number;
}

export default function PaymentsPage() {
  const router = useRouter();
  const [leaseStatuses, setLeaseStatuses] = useState<LeaseStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeases() {
      try {
        const response = await fetch('/api/leases?activeOnly=true');
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch leases');
        }

        const leases: Lease[] = await response.json();

        // Calculate payment status for each lease
        const statuses = leases.map((lease) => {
          const now = new Date();
          const monthlyRent = lease.rentAmount + lease.chargesAmount;

          // Calculate expected amount based on months since start
          const monthsSinceStart = Math.floor(
            (now.getTime() - new Date(lease.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
          ) + 1;
          const expectedTotal = monthlyRent * monthsSinceStart;

          // Calculate total paid
          const totalPaid = lease.payments.reduce((sum, p) => sum + p.amount, 0);

          // Calculate balance (negative means they owe, positive means they're ahead)
          const balance = totalPaid - expectedTotal;

          const lastPayment = lease.payments[0];

          return {
            lease,
            monthlyRent,
            totalPaid,
            expectedTotal,
            balance,
            isUpToDate: balance >= -monthlyRent * 0.1, // 10% tolerance
            lastPaymentDate: lastPayment ? new Date(lastPayment.paymentDate) : undefined,
            lastPaymentAmount: lastPayment?.amount,
          };
        });

        setLeaseStatuses(statuses);
      } catch (error) {
        console.error('Error fetching leases:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLeases();
  }, [router]);

  const handleAddPayment = async (e: React.FormEvent<HTMLFormElement>, leaseId: string) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const payload = {
      leaseId,
      amount: parseFloat(formData.get('amount') as string),
      paymentDate: formData.get('paymentDate') as string,
      notes: formData.get('notes') as string || null,
    };

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        const error = await response.json();
        alert('Error: ' + error.error);
      }
    } catch (error) {
      alert('Failed to save payment');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
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
                ← Back to Dashboard
              </a>
              <h1 className="text-xl font-bold">Payments</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-6">Record Payments</h2>

          {leaseStatuses.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No active leases found. Create a lease to start tracking payments.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Rent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaseStatuses.map(({ lease, monthlyRent, balance, isUpToDate, lastPaymentDate, lastPaymentAmount }) => (
                    <tr key={lease.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a href={`/dashboard/payments/${lease.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">
                          {lease.tenant.firstName} {lease.tenant.lastName}
                        </a>
                        <div className="text-xs text-gray-500">{lease.tenant.email || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{lease.property.name}</div>
                        <div className="text-xs text-gray-500">{lease.property.address}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">€{monthlyRent.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">
                          Due day {lease.paymentDueDay}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {lastPaymentDate ? (
                          <>
                            <div className="text-sm text-gray-900">
                              €{lastPaymentAmount?.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {lastPaymentDate.toLocaleDateString()}
                            </div>
                          </>
                        ) : (
                          <span className="text-sm text-gray-500">No payments</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {balance >= 0 ? '+' : ''}€{balance.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          isUpToDate
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {isUpToDate ? 'Up to date' : 'Late'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                          onClick={() => {
                            const modal = document.getElementById(`payment-modal-${lease.id}`);
                            if (modal) modal.classList.remove('hidden');
                          }}
                        >
                          + Add Payment
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payment Modals */}
        {leaseStatuses.map(({ lease, monthlyRent }) => (
          <div
            key={lease.id}
            id={`payment-modal-${lease.id}`}
            className="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
          >
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Add Payment</h3>
                <button
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    const modal = document.getElementById(`payment-modal-${lease.id}`);
                    if (modal) modal.classList.add('hidden');
                  }}
                >
                  ✕
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  <strong>{lease.tenant.firstName} {lease.tenant.lastName}</strong>
                  <br />
                  {lease.property.name}
                </p>
              </div>

              <form onSubmit={(e) => handleAddPayment(e, lease.id)}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (€)
                  </label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    defaultValue={monthlyRent.toFixed(2)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    name="paymentDate"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    onClick={() => {
                      const modal = document.getElementById(`payment-modal-${lease.id}`);
                      if (modal) modal.classList.add('hidden');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Save Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
