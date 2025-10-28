'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LeaseModal } from '@/components/LeaseModal';

interface Landlord {
  id: string;
  name: string;
}

interface Property {
  id: string;
  name: string;
  address: string;
  postalCode: string;
  city: string;
  landlord: Landlord;
}

interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
}

interface Payment {
  id: string;
  amount: number;
  paymentDate: Date;
}

interface Lease {
  id: string;
  propertyId: string;
  tenantId: string;
  rentAmount: number;
  chargesAmount: number;
  paymentDueDay: number;
  startDate: Date;
  endDate: Date | null;
  property: Property;
  tenant: Tenant;
  payments: Payment[];
}

export default function LeasesPage() {
  const t = useTranslations('leases');
  const tNav = useTranslations('navigation');
  const router = useRouter();
  const [leases, setLeases] = useState<Lease[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeaseForPayment, setSelectedLeaseForPayment] = useState<Lease | null>(null);
  const [isLeaseModalOpen, setIsLeaseModalOpen] = useState(false);
  const [leaseModalMode, setLeaseModalMode] = useState<'add' | 'edit' | 'delete'>('add');
  const [selectedLeaseForModal, setSelectedLeaseForModal] = useState<Lease | null>(null);

  useEffect(() => {
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      // Fetch leases
      const leasesResponse = await fetch('/api/leases');
      if (!leasesResponse.ok) {
        if (leasesResponse.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch leases');
      }
      const leasesData = await leasesResponse.json();
      setLeases(leasesData);

      // Fetch properties
      const propsResponse = await fetch('/api/properties');
      if (propsResponse.ok) {
        const propsData = await propsResponse.json();
        setProperties(propsData);
      }

      // Fetch tenants
      const tenantsResponse = await fetch('/api/tenants');
      if (tenantsResponse.ok) {
        const tenantsData = await tenantsResponse.json();
        setTenants(tenantsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLeaseClick = () => {
    setSelectedLeaseForModal(null);
    setLeaseModalMode('add');
    setIsLeaseModalOpen(true);
  };

  const handleEditLeaseClick = (lease: Lease) => {
    setSelectedLeaseForModal(lease);
    setLeaseModalMode('edit');
    setIsLeaseModalOpen(true);
  };

  const handleDeleteLeaseClick = (lease: Lease) => {
    setSelectedLeaseForModal(lease);
    setLeaseModalMode('delete');
    setIsLeaseModalOpen(true);
  };

  const handleLeaseModalClose = () => {
    setIsLeaseModalOpen(false);
    setSelectedLeaseForModal(null);
  };

  const handleLeaseModalSave = () => {
    fetchData();
  };

  const handleAddPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLeaseForPayment) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const payload = {
      leaseId: selectedLeaseForPayment.id,
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
        setSelectedLeaseForPayment(null);
        fetchData(); // Refresh the leases
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
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">{t('heading')}</h2>
            <button
              onClick={handleAddLeaseClick}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              {t('addButton')}
            </button>
          </div>

          {leases.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>{t('emptyState')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {leases.map((lease) => {
                const totalPaid = lease.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
                const monthlyTotal = lease.rentAmount + lease.chargesAmount;
                const isActive = !lease.endDate;
                const lastPayment = lease.payments?.[0];

                return (
                  <div key={lease.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {lease.property.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {lease.property.address}, {lease.property.postalCode} {lease.property.city}
                        </p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {isActive ? t('status.active') : t('status.ended')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">{t('card.tenant')}</p>
                        <p className="text-sm font-medium text-gray-900">
                          {lease.tenant.firstName} {lease.tenant.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('card.landlord')}</p>
                        <p className="text-sm font-medium text-gray-900">
                          {lease.property.landlord.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('card.monthlyRent')}</p>
                        <p className="text-sm font-medium text-gray-900">
                          €{monthlyTotal.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          (€{lease.rentAmount} + €{lease.chargesAmount} {t('charges')})
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('card.paymentDue')}</p>
                        <p className="text-sm font-medium text-gray-900">
                          {t('dayOfMonth', { day: lease.paymentDueDay })}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">{t('card.startDate')}</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(lease.startDate).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('card.endDate')}</p>
                        <p className="text-sm font-medium text-gray-900">
                          {lease.endDate ? new Date(lease.endDate).toLocaleDateString('fr-FR') : t('openEnded')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('card.totalPayments')}</p>
                        <p className="text-sm font-medium text-gray-900">
                          €{totalPaid.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {lease.payments?.length || 0} {(lease.payments?.length || 0) === 1 ? t('payment') : t('payments')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('card.lastPayment')}</p>
                        <p className="text-sm font-medium text-gray-900">
                          {lastPayment
                            ? new Date(lastPayment.paymentDate).toLocaleDateString('fr-FR')
                            : t('noPayments')}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <button
                        onClick={() => setSelectedLeaseForPayment(lease)}
                        className="text-sm text-blue-600 hover:text-blue-900 font-medium"
                      >
                        {t('actions.recordPayment')}
                      </button>
                      <a
                        href={`/dashboard/leases/${lease.id}/payments`}
                        className="text-sm text-blue-600 hover:text-blue-900 font-medium"
                      >
                        {t('actions.viewHistory')}
                      </a>
                      <button
                        onClick={() => handleEditLeaseClick(lease)}
                        className="text-sm text-gray-600 hover:text-gray-900 font-medium ml-auto"
                      >
                        {t('actions.edit')}
                      </button>
                      <button
                        onClick={() => handleDeleteLeaseClick(lease)}
                        className="text-sm text-red-600 hover:text-red-900 font-medium"
                      >
                        {t('actions.delete')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Payment Modal */}
      {selectedLeaseForPayment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">{t('modal.title')}</h3>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setSelectedLeaseForPayment(null)}
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                <strong>{selectedLeaseForPayment.tenant.firstName} {selectedLeaseForPayment.tenant.lastName}</strong>
                <br />
                {selectedLeaseForPayment.property.name}
              </p>
            </div>

            <form onSubmit={handleAddPayment}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('modal.amount')}
                </label>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  defaultValue={(selectedLeaseForPayment.rentAmount + selectedLeaseForPayment.chargesAmount).toFixed(2)}
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
                  name="paymentDate"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('modal.notes')}
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
                  onClick={() => setSelectedLeaseForPayment(null)}
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

      {/* Lease Modal (Add/Edit/Delete) */}
      <LeaseModal
        isOpen={isLeaseModalOpen}
        onClose={handleLeaseModalClose}
        onSave={handleLeaseModalSave}
        lease={selectedLeaseForModal}
        mode={leaseModalMode}
        properties={properties}
        tenants={tenants}
      />
    </div>
  );
}
