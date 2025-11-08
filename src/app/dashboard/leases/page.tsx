'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LeaseModal } from '@/components/LeaseModal';
import { RentRevisionLetterModal } from '@/components/RentRevisionLetterModal';

interface Landlord {
  id: string;
  name: string;
  type: string;
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
  tenantIds: string[];
  rentAmount: number;
  chargesAmount: number;
  paymentDueDay: number;
  startDate: Date;
  endDate: Date | null;
  property: Property;
  tenants: Tenant[];
  payments: Payment[];
  currentRentAmount?: number; // Most recent rent after revisions
  currentChargesAmount?: number; // Most recent charges after revisions
}

export default function LeasesPage() {
  const t = useTranslations('leases');
  const tNav = useTranslations('navigation');
  const router = useRouter();
  const [leases, setLeases] = useState<Lease[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLeaseModalOpen, setIsLeaseModalOpen] = useState(false);
  const [leaseModalMode, setLeaseModalMode] = useState<'add' | 'edit' | 'delete'>('add');
  const [selectedLeaseForModal, setSelectedLeaseForModal] = useState<Lease | null>(null);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [selectedLeaseForRevision, setSelectedLeaseForRevision] = useState<Lease | null>(null);

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

      // Transform tenants structure from API format to client format
      const transformedLeases = leasesData.map((lease: any) => ({
        ...lease,
        tenants: lease.tenants.map((lt: any) => lt.tenant),
        tenantIds: lease.tenants.map((lt: any) => lt.tenant.id),
      }));

      // Fetch current rent for each lease
      const leasesWithCurrentRent = await Promise.all(
        transformedLeases.map(async (lease: Lease) => {
          try {
            // Get current month
            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

            // Fetch rent history for current month
            const rentHistoryResponse = await fetch(
              `/api/leases/${lease.id}/rent-history?startMonth=${currentMonth}&endMonth=${currentMonth}`
            );

            if (rentHistoryResponse.ok) {
              const rentHistory = await rentHistoryResponse.json();
              if (rentHistory.length > 0) {
                const currentRent = rentHistory[0];
                return {
                  ...lease,
                  currentRentAmount: currentRent.rentAmount,
                  currentChargesAmount: currentRent.chargesAmount,
                };
              }
            }
          } catch (error) {
            console.error(`Error fetching rent history for lease ${lease.id}:`, error);
          }

          // Fallback to lease amounts if API fails
          return {
            ...lease,
            currentRentAmount: lease.rentAmount,
            currentChargesAmount: lease.chargesAmount,
          };
        })
      );

      setLeases(leasesWithCurrentRent);

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
                // Use current rent amounts (most recent after revisions)
                const currentRent = lease.currentRentAmount || lease.rentAmount;
                const currentCharges = lease.currentChargesAmount || lease.chargesAmount;
                const monthlyTotal = currentRent + currentCharges;
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
                          {lease.tenants && lease.tenants.length > 0
                            ? `${lease.tenants[0].firstName} ${lease.tenants[0].lastName}${lease.tenants.length > 1 ? ` (+${lease.tenants.length - 1})` : ''}`
                            : 'N/A'}
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
                          (€{currentRent.toFixed(2)} + €{currentCharges.toFixed(2)} {t('charges')})
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
                      <a
                        href={`/dashboard/leases/${lease.id}/payments`}
                        className="text-sm text-blue-600 hover:text-blue-900 font-medium"
                      >
                        {t('actions.viewHistory')}
                      </a>
                      <button
                        onClick={() => {
                          setSelectedLeaseForRevision(lease);
                          setIsRevisionModalOpen(true);
                        }}
                        className="text-sm text-purple-600 hover:text-purple-900 font-medium"
                      >
                        📝 Révision loyer
                      </button>
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

      {/* Rent Revision Letter Modal */}
      <RentRevisionLetterModal
        isOpen={isRevisionModalOpen}
        onClose={() => {
          setIsRevisionModalOpen(false);
          setSelectedLeaseForRevision(null);
        }}
        lease={selectedLeaseForRevision}
      />
    </div>
  );
}
