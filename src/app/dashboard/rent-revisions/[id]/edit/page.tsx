'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { RentRevisionLetterGenerator } from '@/features/rent-revision/presentation/RentRevisionLetterGenerator';

interface Lease {
  id: string;
  rentAmount: number;
  chargesAmount: number;
  property: {
    name: string;
    address: string;
    postalCode: string;
    city: string;
    landlord: {
      name: string;
      address: string;
    };
  };
  tenants: Array<{
    tenant: {
      civility?: string;
      firstName: string;
      lastName: string;
    };
  }>;
}

interface Revision {
  id: string;
  leaseId: string;
  effectiveDate: string;
  rentAmount: number;
  chargesAmount: number;
  reason?: string;
  status: string;
  lease: Lease | null;
}

export default function EditRentRevisionPage() {
  const router = useRouter();
  const params = useParams();
  const revisionId = params.id as string;
  const t = useTranslations('rentRevisions.modal');
  const tCommon = useTranslations('rentRevisions');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState<Revision | null>(null);

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
    fetchRevision();
  }, [revisionId]);

  useEffect(() => {
    if (revision?.lease) {
      // Parse existing data
      if (revision.reason) {
        const irlMatch = revision.reason.match(/Ancien:\s*([\d.]+),\s*Nouveau:\s*([\d.]+)/);
        if (irlMatch) {
          setOldIndex(irlMatch[1]);
          setNewIndex(irlMatch[2]);
        }

        const quarterMatch = revision.reason.match(/Révision IRL\s+(.+?)\s+-/);
        if (quarterMatch) {
          setQuarter(quarterMatch[1]);
        }
      }

      // Set charges and rent
      setNewChargesAmount(revision.chargesAmount.toString());
      setCalculatedRent(revision.rentAmount);

      // Set effective month from date
      const date = new Date(revision.effectiveDate);
      const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
      setEffectiveMonth(`${monthNames[date.getMonth()]} ${date.getFullYear()}`);
    }
  }, [revision]);

  useEffect(() => {
    calculateNewRent();
  }, [oldIndex, newIndex, revision]);

  const fetchRevision = async () => {
    try {
      const response = await fetch(`/api/rent-revisions/${revisionId}`);
      if (response.ok) {
        const data = await response.json();
        setRevision(data);

        // Check if can edit (only EN_PREPARATION)
        if (data.status !== 'EN_PREPARATION') {
          alert('Vous ne pouvez modifier que les révisions en préparation');
          router.push('/dashboard/rent-revisions');
          return;
        }
      } else {
        alert('Révision introuvable');
        router.push('/dashboard/rent-revisions');
      }
    } catch (error) {
      console.error('Error fetching revision:', error);
      alert('Erreur lors du chargement');
      router.push('/dashboard/rent-revisions');
    } finally {
      setLoading(false);
    }
  };

  const calculateNewRent = () => {
    if (!revision?.lease || !oldIndex || !newIndex) {
      return;
    }

    const oldIdx = parseFloat(oldIndex);
    const newIdx = parseFloat(newIndex);
    const currentRent = revision.lease.rentAmount;

    if (oldIdx > 0 && newIdx > 0) {
      const newRent = (currentRent * newIdx) / oldIdx;
      setCalculatedRent(Math.round(newRent * 100) / 100);
    }
  };

  const handleSave = async (action: 'draft' | 'txt' | 'pdf') => {
    if (!revision?.lease || !calculatedRent || !effectiveMonth || !newChargesAmount) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSaving(true);

    try {
      // Parse effective month (format: "février 2026" -> first day of month in UTC)
      const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
      const parts = effectiveMonth.trim().split(' ');

      let effectiveDate: Date;
      if (parts.length === 2) {
        const monthIndex = monthNames.findIndex(m => m.toLowerCase() === parts[0].toLowerCase());
        const year = parseInt(parts[1]);
        if (monthIndex >= 0 && year > 2000) {
          // Create date in UTC to avoid timezone issues
          effectiveDate = new Date(Date.UTC(year, monthIndex, 1, 12, 0, 0));
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

      // Update revision in database
      const response = await fetch(`/api/rent-revisions/${revisionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        throw new Error(error.error || 'Erreur lors de la modification');
      }

      const updatedRevision = await response.json();

      // Generate letter if requested
      if (action === 'txt' || action === 'pdf') {
        await generateLetter(action, updatedRevision.id);
      }

      // Redirect to rent-revisions page
      alert('Révision modifiée avec succès !');
      router.push('/dashboard/rent-revisions');
    } catch (error) {
      console.error('Error saving revision:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const generateLetter = async (format: 'txt' | 'pdf', revisionId: string) => {
    if (!revision?.lease || !calculatedRent || !newChargesAmount) return;

    const tenant = revision.lease.tenants[0]?.tenant;
    if (!tenant) return;

    const tenantFullName = `${tenant.firstName} ${tenant.lastName}`;
    const propertyFullAddress = `${revision.lease.property.address}, ${revision.lease.property.postalCode} ${revision.lease.property.city}`;

    const letterData = {
      landlordName: revision.lease.property.landlord.name,
      landlordAddress: revision.lease.property.landlord.address,
      tenantCivility: tenant.civility || 'Madame, Monsieur',
      tenantName: tenantFullName,
      tenantAddress: propertyFullAddress,
      propertyAddress: propertyFullAddress,
      letterDate,
      oldIndex,
      newIndex,
      irlQuarter: quarter,
      oldRent: revision.lease.rentAmount,
      newRent: calculatedRent,
      oldCharges: revision.lease.chargesAmount,
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

  if (!revision || !revision.lease) {
    return null;
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
          <h1 className="text-3xl font-bold text-gray-900">{t('editTitle')}</h1>
          <p className="text-sm text-gray-600 mt-2">
            {revision.lease.property.name} - {revision.lease.tenants.map(t => `${t.tenant.firstName} ${t.tenant.lastName}`).join(', ')}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Current Rent Display */}
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-600">
              <strong>{tCommon('currentRent')} :</strong> {revision.lease.rentAmount.toFixed(2)} €
            </p>
            <p className="text-sm text-gray-600">
              <strong>Charges actuelles :</strong> {revision.lease.chargesAmount.toFixed(2)} €
            </p>
            <p className="text-sm text-gray-600">
              <strong>Total actuel :</strong> {(revision.lease.rentAmount + revision.lease.chargesAmount).toFixed(2)} €
            </p>
          </div>

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
          {calculatedRent && newChargesAmount && revision.lease && (
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
                    (revision.lease.rentAmount + revision.lease.chargesAmount)
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
              disabled={!calculatedRent || !effectiveMonth || !newChargesAmount || saving}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {saving ? t('saving') : t('saveDraft')}
            </button>
            <button
              onClick={() => handleSave('txt')}
              disabled={!calculatedRent || !effectiveMonth || !newChargesAmount || saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {t('saveTxt')}
            </button>
            <button
              onClick={() => handleSave('pdf')}
              disabled={!calculatedRent || !effectiveMonth || !newChargesAmount || saving}
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
