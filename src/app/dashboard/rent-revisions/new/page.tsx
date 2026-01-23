'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { RentRevisionLetterGenerator } from '@/features/rent-revision/presentation/RentRevisionLetterGenerator';

interface Lease {
  id: string;
  property: {
    name: string;
    address: string;
    postalCode: string;
    city: string;
    landlord: {
      name: string;
      address: string;
      type: string;
    };
  };
  tenants: Array<{
    civility?: string;
    firstName: string;
    lastName: string;
  }>;
  rentAmount: number;
  chargesAmount: number;
}

export default function NewRentRevisionPage() {
  const router = useRouter();
  const t = useTranslations('rentRevisions.modal');
  const tCommon = useTranslations('rentRevisions');

  const [leases, setLeases] = useState<Lease[]>([]);
  const [selectedLeaseId, setSelectedLeaseId] = useState('');
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [letterDate, setLetterDate] = useState(new Date().toISOString().split('T')[0]);
  const [oldIndex, setOldIndex] = useState('');
  const [newIndex, setNewIndex] = useState('');
  const [quarter, setQuarter] = useState('');
  const [effectiveMonth, setEffectiveMonth] = useState('');
  const [newChargesAmount, setNewChargesAmount] = useState('');

  // Calculated values
  const [calculatedRent, setCalculatedRent] = useState<number | null>(null);

  useEffect(() => {
    fetchLeases();
  }, []);

  useEffect(() => {
    if (selectedLeaseId) {
      const lease = leases.find((l) => l.id === selectedLeaseId);
      setSelectedLease(lease || null);
      if (lease) {
        setNewChargesAmount(lease.chargesAmount.toString());
      }
    } else {
      setSelectedLease(null);
    }
  }, [selectedLeaseId, leases]);

  useEffect(() => {
    calculateNewRent();
  }, [oldIndex, newIndex, selectedLease]);

  const fetchLeases = async () => {
    try {
      const response = await fetch('/api/leases');
      if (response.ok) {
        const data = await response.json();
        setLeases(data);
      }
    } catch (error) {
      console.error('Error fetching leases:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateNewRent = () => {
    if (!selectedLease || !oldIndex || !newIndex) {
      setCalculatedRent(null);
      return;
    }

    const oldIdx = parseFloat(oldIndex);
    const newIdx = parseFloat(newIndex);
    const currentRent = selectedLease.rentAmount;

    if (oldIdx > 0 && newIdx > 0) {
      const newRent = (currentRent * newIdx) / oldIdx;
      setCalculatedRent(Math.round(newRent * 100) / 100);
    } else {
      setCalculatedRent(null);
    }
  };

  const handleSave = async (action: 'draft' | 'txt' | 'pdf') => {
    if (!selectedLease || !calculatedRent || !effectiveMonth || !newChargesAmount) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSaving(true);

    try {
      // Parse effective month (format: "février 2026" -> first day of month)
      const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
      const parts = effectiveMonth.trim().split(' ');

      let effectiveDate: Date;
      if (parts.length === 2) {
        const monthIndex = monthNames.findIndex(m => m.toLowerCase() === parts[0].toLowerCase());
        const year = parseInt(parts[1]);
        if (monthIndex >= 0 && year > 2000) {
          effectiveDate = new Date(year, monthIndex, 1);
        } else {
          alert('Format du mois invalide. Utilisez le format: février 2026');
          setSaving(false);
          return;
        }
      } else {
        alert('Format du mois invalide. Utilisez le format: février 2026');
        setSaving(false);
        return;
      }

      // Create revision in database
      const response = await fetch('/api/rent-revisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaseId: selectedLease.id,
          effectiveDate: effectiveDate.toISOString(),
          rentAmount: calculatedRent,
          chargesAmount: parseFloat(newChargesAmount),
          reason: quarter
            ? `Révision IRL ${quarter} - Ancien: ${oldIndex}, Nouveau: ${newIndex}`
            : `Révision IRL - Ancien: ${oldIndex}, Nouveau: ${newIndex}`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la création');
      }

      const revision = await response.json();

      // Generate letter if requested
      if (action === 'txt' || action === 'pdf') {
        await generateLetter(action, revision.id);
      }

      // Redirect to rent-revisions page
      alert('Révision créée avec succès !');
      router.push('/dashboard/rent-revisions');
    } catch (error) {
      console.error('Error saving revision:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const generateLetter = async (format: 'txt' | 'pdf', revisionId: string) => {
    if (!selectedLease || !calculatedRent || !newChargesAmount) return;

    const tenant = selectedLease.tenants[0];
    const tenantFullName = `${tenant.firstName} ${tenant.lastName}`;
    const propertyFullAddress = `${selectedLease.property.address}, ${selectedLease.property.postalCode} ${selectedLease.property.city}`;

    const letterData = {
      landlordName: selectedLease.property.landlord.name,
      landlordAddress: selectedLease.property.landlord.address,
      tenantCivility: tenant.civility || 'Madame, Monsieur',
      tenantName: tenantFullName,
      tenantAddress: propertyFullAddress,
      propertyAddress: propertyFullAddress,
      letterDate,
      oldIndex,
      newIndex,
      irlQuarter: quarter,
      oldRent: selectedLease.rentAmount,
      newRent: calculatedRent,
      oldCharges: selectedLease.chargesAmount,
      newCharges: parseFloat(newChargesAmount),
      effectiveMonth,
    };

    if (format === 'txt') {
      RentRevisionLetterGenerator.downloadTxtLetter(letterData);
    } else if (format === 'pdf') {
      await RentRevisionLetterGenerator.downloadPdfLetter(letterData);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto text-center">
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard/rent-revisions')}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Retour aux révisions
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{t('createTitle')}</h1>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Lease Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('selectLease')} *
            </label>
            <select
              value={selectedLeaseId}
              onChange={(e) => setSelectedLeaseId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">{t('selectLeasePlaceholder')}</option>
              {leases.map((lease) => (
                <option key={lease.id} value={lease.id}>
                  {lease.property.name} - {lease.tenants.map(t => `${t.firstName} ${t.lastName}`).join(', ')}
                </option>
              ))}
            </select>
          </div>

          {/* Current Rent Display */}
          {selectedLease && (
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-600">
                <strong>{tCommon('currentRent')} :</strong> {selectedLease.rentAmount.toFixed(2)} €
              </p>
              <p className="text-sm text-gray-600">
                <strong>Charges actuelles :</strong> {selectedLease.chargesAmount.toFixed(2)} €
              </p>
              <p className="text-sm text-gray-600">
                <strong>Total actuel :</strong> {(selectedLease.rentAmount + selectedLease.chargesAmount).toFixed(2)} €
              </p>
            </div>
          )}

          {/* Letter Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('letterDate')} *
            </label>
            <input
              type="date"
              value={letterDate}
              onChange={(e) => setLetterDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* IRL Indices */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('oldIndex')} *
              </label>
              <input
                type="number"
                step="0.01"
                value={oldIndex}
                onChange={(e) => setOldIndex(e.target.value)}
                placeholder="Ex: 142.58"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('newIndex')} *
              </label>
              <input
                type="number"
                step="0.01"
                value={newIndex}
                onChange={(e) => setNewIndex(e.target.value)}
                placeholder="Ex: 145.23"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Quarter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('quarter')}
            </label>
            <input
              type="text"
              value={quarter}
              onChange={(e) => setQuarter(e.target.value)}
              placeholder={t('quarterPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Effective Month */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('effectiveMonth')} *
            </label>
            <input
              type="text"
              value={effectiveMonth}
              onChange={(e) => setEffectiveMonth(e.target.value)}
              placeholder={t('effectiveMonthPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Format: mois année (ex: février 2026)
            </p>
          </div>

          {/* New Charges */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {tCommon('newCharges')} *
            </label>
            <input
              type="number"
              step="0.01"
              value={newChargesAmount}
              onChange={(e) => setNewChargesAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              {t('chargesHint')}
            </p>
          </div>

          {/* IRL Info Link */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm font-medium text-blue-900 mb-2">
              {t('irlInfoTitle')}
            </p>
            <a
              href="https://www.google.com/search?q=indice+IRL"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              {t('irlInfoLink')}
            </a>
          </div>

          {/* Preview */}
          {calculatedRent && newChargesAmount && selectedLease && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-green-900 mb-3">{t('preview')}</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>{t('newRentCalculated')} :</strong> {calculatedRent.toFixed(2)} €
                </p>
                <p>
                  <strong>{tCommon('newCharges')} :</strong> {parseFloat(newChargesAmount).toFixed(2)} €
                </p>
                <p className="text-lg font-semibold text-green-900">
                  <strong>{t('newTotal')} :</strong> {(calculatedRent + parseFloat(newChargesAmount)).toFixed(2)} €
                </p>
                <p className="text-green-700">
                  <strong>{t('increase')} :</strong> +
                  {(
                    calculatedRent +
                    parseFloat(newChargesAmount) -
                    (selectedLease.rentAmount + selectedLease.chargesAmount)
                  ).toFixed(2)}{' '}
                  €
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => router.push('/dashboard/rent-revisions')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={saving}
            >
              {t('cancel')}
            </button>
            <button
              onClick={() => handleSave('draft')}
              disabled={!selectedLease || !calculatedRent || !effectiveMonth || !newChargesAmount || saving}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {saving ? t('saving') : t('saveDraft')}
            </button>
            <button
              onClick={() => handleSave('txt')}
              disabled={!selectedLease || !calculatedRent || !effectiveMonth || !newChargesAmount || saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {t('saveTxt')}
            </button>
            <button
              onClick={() => handleSave('pdf')}
              disabled={!selectedLease || !calculatedRent || !effectiveMonth || !newChargesAmount || saving}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed"
            >
              {t('savePdf')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
