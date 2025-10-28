'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { TenantModal } from '@/components/TenantModal';

interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  leases: Array<{
    id: string;
    endDate: Date | null;
    property: {
      name: string;
    };
    rentAmount: number;
    chargesAmount: number;
    payments: Array<{
      amount: number;
    }>;
  }>;
}

interface TenantsClientProps {
  initialTenants: Tenant[];
}

export function TenantsClient({ initialTenants }: TenantsClientProps) {
  const t = useTranslations('tenants');
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'delete'>('add');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  const handleAddClick = () => {
    setSelectedTenant(null);
    setModalMode('add');
    setIsModalOpen(true);
  };

  const handleEditClick = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteClick = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setModalMode('delete');
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTenant(null);
  };

  const handleModalSave = () => {
    // Reload the page to fetch updated data
    window.location.reload();
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">{t('heading')}</h2>
          <button
            onClick={handleAddClick}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            {t('addButton')}
          </button>
        </div>

        {tenants.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>{t('emptyState')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('table.name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('table.contact')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('table.activeLeases')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('table.totalPayments')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tenants.map((tenant) => {
                  const activeLeases = tenant.leases.filter((lease) => !lease.endDate);
                  const totalPayments = tenant.leases.reduce(
                    (sum, lease) => sum + lease.payments.reduce((s, p) => s + p.amount, 0),
                    0
                  );
                  const totalPaymentCount = tenant.leases.reduce(
                    (sum, lease) => sum + lease.payments.length,
                    0
                  );

                  return (
                    <tr key={tenant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {tenant.firstName} {tenant.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{tenant.email || '-'}</div>
                        <div className="text-xs text-gray-500">{tenant.phone || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        {activeLeases.length > 0 ? (
                          <div>
                            {activeLeases.map((lease) => (
                              <div key={lease.id} className="text-sm text-gray-900 mb-1">
                                {lease.property.name}
                                <span className="ml-2 text-xs text-gray-500">
                                  €{lease.rentAmount + lease.chargesAmount}/mo
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">{t('noActiveLeases')}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">€{totalPayments.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">
                          {totalPaymentCount}{' '}
                          {totalPaymentCount === 1 ? t('payment') : t('payments')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditClick(tenant)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          {t('actions.edit')}
                        </button>
                        <button
                          onClick={() => handleDeleteClick(tenant)}
                          className="text-red-600 hover:text-red-900"
                        >
                          {t('actions.delete')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TenantModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        tenant={selectedTenant}
        mode={modalMode}
      />
    </>
  );
}
