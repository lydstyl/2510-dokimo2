'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface Property {
  id: string;
  name: string;
  address: string;
}

interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
}

interface Lease {
  id: string;
  propertyId: string;
  tenantIds: string[];
  startDate: Date;
  endDate: Date | null;
  rentAmount: number;
  chargesAmount: number;
  paymentDueDay: number;
  irlQuarter?: string | null;
}

interface LeaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  lease?: Lease | null;
  mode: 'add' | 'edit' | 'delete';
  properties: Property[];
  tenants: Tenant[];
}

export function LeaseModal({ isOpen, onClose, onSave, lease, mode, properties, tenants }: LeaseModalProps) {
  const t = useTranslations('leases.leaseModal');
  const [formData, setFormData] = useState({
    propertyId: '',
    tenantIds: [] as string[],
    startDate: '',
    endDate: '',
    rentAmount: '',
    chargesAmount: '',
    paymentDueDay: '1',
    irlQuarter: '',
  });
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lease && mode === 'edit') {
      setFormData({
        propertyId: lease.propertyId,
        tenantIds: lease.tenantIds,
        startDate: new Date(lease.startDate).toISOString().split('T')[0],
        endDate: lease.endDate ? new Date(lease.endDate).toISOString().split('T')[0] : '',
        rentAmount: lease.rentAmount.toString(),
        chargesAmount: lease.chargesAmount.toString(),
        paymentDueDay: lease.paymentDueDay.toString(),
        irlQuarter: lease.irlQuarter || '',
      });
    } else if (mode === 'add') {
      setFormData({
        propertyId: '',
        tenantIds: [],
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        rentAmount: '',
        chargesAmount: '',
        paymentDueDay: '1',
        irlQuarter: '',
      });
    }
    setSelectedTenantId('');
    setError(null);
  }, [lease, mode, isOpen]);

  const handleAddTenant = () => {
    if (selectedTenantId && !formData.tenantIds.includes(selectedTenantId)) {
      setFormData({
        ...formData,
        tenantIds: [...formData.tenantIds, selectedTenantId],
      });
      setSelectedTenantId('');
    }
  };

  const handleRemoveTenant = (tenantId: string) => {
    setFormData({
      ...formData,
      tenantIds: formData.tenantIds.filter(id => id !== tenantId),
    });
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (mode === 'delete' && lease) {
        const response = await fetch(`/api/leases/${lease.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to delete lease');
        }
      } else if (mode === 'edit' && lease) {
        const response = await fetch(`/api/leases/${lease.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            propertyId: formData.propertyId,
            tenantIds: formData.tenantIds,
            startDate: formData.startDate,
            endDate: formData.endDate || undefined,
            rentAmount: parseFloat(formData.rentAmount),
            chargesAmount: parseFloat(formData.chargesAmount),
            paymentDueDay: parseInt(formData.paymentDueDay, 10),
            irlQuarter: formData.irlQuarter || undefined,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update lease');
        }
      } else if (mode === 'add') {
        const response = await fetch('/api/leases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            propertyId: formData.propertyId,
            tenantIds: formData.tenantIds,
            startDate: formData.startDate,
            endDate: formData.endDate || undefined,
            rentAmount: parseFloat(formData.rentAmount),
            chargesAmount: parseFloat(formData.chargesAmount),
            paymentDueDay: parseInt(formData.paymentDueDay, 10),
            irlQuarter: formData.irlQuarter || undefined,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create lease');
        }
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    if (mode === 'delete') return t('deleteTitle');
    if (mode === 'edit') return t('editTitle');
    return t('addTitle');
  };

  const selectedProperty = properties.find(p => p.id === formData.propertyId);
  const selectedTenant = tenants.find(t => t.id === formData.tenantId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg m-4">
        <h2 className="text-2xl font-semibold mb-4">{getTitle()}</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {mode === 'delete' ? (
          <div>
            <p className="mb-6 text-gray-700">{t('deleteMessage')}</p>
            {lease && selectedProperty && selectedTenant && (
              <div className="mb-6 p-4 bg-gray-50 rounded">
                <p className="font-semibold">
                  {selectedProperty.name}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedTenant.firstName} {selectedTenant.lastName}
                </p>
                <p className="text-sm text-gray-600">
                  {new Date(lease.startDate).toLocaleDateString('fr-FR')}
                  {lease.endDate && ` - ${new Date(lease.endDate).toLocaleDateString('fr-FR')}`}
                </p>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting ? t('deleting') : t('delete')}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('property')} *
              </label>
              <select
                value={formData.propertyId}
                onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('selectProperty')}</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name} - {property.address}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('tenants')} *
              </label>

              {/* Selected tenants list */}
              {formData.tenantIds.length > 0 && (
                <div className="mb-2 space-y-1">
                  {formData.tenantIds.map((tenantId) => {
                    const tenant = tenants.find(t => t.id === tenantId);
                    return tenant ? (
                      <div key={tenantId} className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-md">
                        <span className="text-sm text-gray-900">
                          {tenant.firstName} {tenant.lastName}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTenant(tenantId)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          {t('removeTenant')}
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              )}

              {formData.tenantIds.length === 0 && (
                <p className="text-sm text-gray-500 mb-2">{t('noTenantSelected')}</p>
              )}

              {/* Add tenant selector */}
              <div className="flex gap-2">
                <select
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('selectTenants')}</option>
                  {tenants
                    .filter(tenant => !formData.tenantIds.includes(tenant.id))
                    .map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.firstName} {tenant.lastName}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddTenant}
                  disabled={!selectedTenantId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {t('addTenant')}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('startDate')} *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('endDate')}
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('rentAmount')} *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.rentAmount}
                  onChange={(e) => setFormData({ ...formData, rentAmount: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('chargesAmount')} *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.chargesAmount}
                  onChange={(e) => setFormData({ ...formData, chargesAmount: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('paymentDueDay')} *
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={formData.paymentDueDay}
                onChange={(e) => setFormData({ ...formData, paymentDueDay: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('irlQuarter')}
              </label>
              <input
                type="text"
                value={formData.irlQuarter}
                onChange={(e) => setFormData({ ...formData, irlQuarter: e.target.value })}
                placeholder={t('irlQuarterPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">{t('irlQuarterHelp')}</p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || (mode !== 'delete' && formData.tenantIds.length === 0)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? t('saving') : t('save')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
