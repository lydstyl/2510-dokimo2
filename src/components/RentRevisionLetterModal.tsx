'use client';

import { useState, useEffect } from 'react';

interface Lease {
  id: string;
  rentAmount: number;
  chargesAmount: number;
  currentRentAmount?: number;
  currentChargesAmount?: number;
  irlQuarter?: string | null;
  property: {
    name: string;
    address: string;
    postalCode: string;
    city: string;
    landlord: {
      id: string;
      name: string;
      type: string;
    };
  };
  tenant: {
    civility?: string;
    firstName: string;
    lastName: string;
  };
}

interface RentRevisionLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  lease: Lease | null;
}

export function RentRevisionLetterModal({ isOpen, onClose, lease }: RentRevisionLetterModalProps) {
  const [oldIndex, setOldIndex] = useState('');
  const [newIndex, setNewIndex] = useState('');
  const [revisionDate, setRevisionDate] = useState(new Date().toISOString().split('T')[0]);
  const [effectiveMonth, setEffectiveMonth] = useState('');
  const [irlQuarter, setIrlQuarter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (lease && isOpen) {
      setIrlQuarter(lease.irlQuarter || '');
    }
  }, [lease, isOpen]);

  if (!isOpen || !lease) return null;

  const currentRent = lease.currentRentAmount || lease.rentAmount;
  const currentCharges = lease.currentChargesAmount || lease.chargesAmount;

  const calculateNewRent = () => {
    if (!oldIndex || !newIndex) return currentRent;
    const oldIndexNum = parseFloat(oldIndex);
    const newIndexNum = parseFloat(newIndex);
    if (oldIndexNum === 0 || isNaN(oldIndexNum) || isNaN(newIndexNum)) return currentRent;
    return (currentRent * newIndexNum) / oldIndexNum;
  };

  const newRent = calculateNewRent();
  const newTotal = newRent + currentCharges;

  const handleDownloadTxt = async () => {
    setIsGenerating(true);
    try {
      // Fetch landlord details
      const landlordResponse = await fetch(`/api/landlords/${lease.property.landlord.id}`);
      let landlordAddress = 'Adresse non renseignée';
      let managerName = '';

      if (landlordResponse.ok) {
        const landlordData = await landlordResponse.json();
        landlordAddress = landlordData.address || 'Adresse non renseignée';
        if (landlordData.type === 'LEGAL_ENTITY' && landlordData.managerName) {
          managerName = landlordData.managerName;
        }
      }

      const date = new Date(revisionDate);
      const dateStr = date.toLocaleDateString('fr-FR');
      const cityName = lease.property.city.charAt(0).toUpperCase() + lease.property.city.slice(1).toLowerCase();

      const quarterText = irlQuarter
        ? `l'Indice de Référence des Loyers de l'INSEE du ${irlQuarter} de chaque année`
        : `l'Indice de Référence des Loyers de l'INSEE`;

      const content = `${lease.property.landlord.name}
${landlordAddress}


${lease.tenant.firstName} ${lease.tenant.lastName}
${lease.property.name}
${lease.property.address}
${lease.property.postalCode} ${lease.property.city}


à ${cityName}, le ${dateStr}


Objet : Révision annuelle du loyer


${lease.tenant.firstName} ${lease.tenant.lastName},


Conformément aux dispositions de votre bail, la valeur de votre loyer est indexée sur l'évolution de ${quarterText}.

Récemment publié, cet indice s'établit désormais à ${newIndex}.

La formule de calcul de votre loyer est la suivante :

Nouveau loyer hors charges = Loyer hors charges × (Nouvel indice / Ancien indice)

En conséquence, le montant de votre nouveau loyer hors charges indexé est de ${newRent.toFixed(2)} € :

${newRent.toFixed(2)} = ${currentRent.toFixed(2)} × (${newIndex} / ${oldIndex})


En ajoutant vos charges actuelles (${currentCharges.toFixed(2)} €) nous obtenons votre nouveau loyer charges comprises : ${newTotal.toFixed(2)} €.

Je vous remercie de bien vouloir appliquer cette augmentation lors du règlement de votre loyer de ${effectiveMonth}.

Je vous prie de bien vouloir agréer, ${lease.tenant.civility ? `${lease.tenant.civility} ${lease.tenant.firstName} ${lease.tenant.lastName}` : `${lease.tenant.firstName} ${lease.tenant.lastName}`}, l'expression de mes sentiments cordiaux.


${managerName || lease.property.landlord.name}${managerName ? `, gérant de ${lease.property.landlord.name}` : ''}`;

      // Download TXT
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `revision-loyer-${lease.tenant.lastName}-${date.toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating TXT:', error);
      alert('Erreur lors de la génération du fichier TXT');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    try {
      // Fetch landlord details
      const landlordResponse = await fetch(`/api/landlords/${lease.property.landlord.id}`);
      let landlordAddress = 'Adresse non renseignée';
      let managerName = '';

      if (landlordResponse.ok) {
        const landlordData = await landlordResponse.json();
        landlordAddress = landlordData.address || 'Adresse non renseignée';
        if (landlordData.type === 'LEGAL_ENTITY' && landlordData.managerName) {
          managerName = landlordData.managerName;
        }
      }

      const letterData = {
        landlord: {
          name: lease.property.landlord.name,
          address: landlordAddress,
          managerName: managerName,
        },
        tenant: {
          civility: lease.tenant.civility,
          firstName: lease.tenant.firstName,
          lastName: lease.tenant.lastName,
        },
        property: {
          name: lease.property.name,
          address: lease.property.address,
          postalCode: lease.property.postalCode,
          city: lease.property.city,
        },
        revision: {
          date: new Date(revisionDate),
          oldIndex: parseFloat(oldIndex),
          newIndex: parseFloat(newIndex),
          currentRent: currentRent,
          newRent: newRent,
          charges: currentCharges,
          effectiveMonth: effectiveMonth,
          irlQuarter: irlQuarter,
        },
      };

      // Dynamic import PDF generator
      const { PdfRentRevisionLetterGenerator } = await import('@/features/rent-revision/infrastructure/PdfRentRevisionLetterGenerator');
      const generator = new PdfRentRevisionLetterGenerator();
      const pdfBuffer = generator.generate(letterData);

      // Download PDF
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const date = new Date(revisionDate);
      link.download = `revision-loyer-${lease.tenant.lastName}-${date.toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erreur lors de la génération du fichier PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const isFormValid = oldIndex && newIndex && effectiveMonth && parseFloat(oldIndex) > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Courrier de révision de loyer</h2>

          <div className="space-y-4">
            {/* Lease info */}
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm font-semibold text-gray-700">Bien : {lease.property.name}</p>
              <p className="text-sm text-gray-600">Locataire : {lease.tenant.firstName} {lease.tenant.lastName}</p>
              <p className="text-sm text-gray-600">Loyer actuel : {currentRent.toFixed(2)} € + {currentCharges.toFixed(2)} € charges</p>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date du courrier
              </label>
              <input
                type="date"
                value={revisionDate}
                onChange={(e) => setRevisionDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Old index */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ancien indice IRL
              </label>
              <input
                type="number"
                step="0.01"
                value={oldIndex}
                onChange={(e) => setOldIndex(e.target.value)}
                placeholder="Ex: 142.50"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* New index */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nouvel indice IRL
              </label>
              <input
                type="number"
                step="0.01"
                value={newIndex}
                onChange={(e) => setNewIndex(e.target.value)}
                placeholder="Ex: 145.17"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* IRL Quarter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trimestre IRL de référence (optionnel)
              </label>
              <input
                type="text"
                value={irlQuarter}
                onChange={(e) => setIrlQuarter(e.target.value)}
                placeholder="Ex: 2e trimestre, T2, deuxième trimestre"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Sera utilisé dans le texte du courrier. Si vide, le texte générique sera utilisé.
              </p>
            </div>

            {/* Effective month */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mois d'application
              </label>
              <input
                type="text"
                value={effectiveMonth}
                onChange={(e) => setEffectiveMonth(e.target.value)}
                placeholder="Ex: février 2025"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Preview calculation */}
            {isFormValid && (
              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-sm font-semibold text-blue-900 mb-2">Aperçu du calcul :</p>
                <p className="text-sm text-blue-800">
                  Nouveau loyer : {newRent.toFixed(2)} € = {currentRent.toFixed(2)} € × ({newIndex} / {oldIndex})
                </p>
                <p className="text-sm text-blue-800">
                  Nouveau total : {newTotal.toFixed(2)} € ({newRent.toFixed(2)} € + {currentCharges.toFixed(2)} € charges)
                </p>
                <p className="text-sm font-semibold text-blue-900 mt-2">
                  Augmentation : +{(newTotal - (currentRent + currentCharges)).toFixed(2)} € ({(((newTotal - (currentRent + currentCharges)) / (currentRent + currentCharges)) * 100).toFixed(2)}%)
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleDownloadTxt}
              disabled={!isFormValid || isGenerating}
              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Génération...' : '📄 Télécharger TXT'}
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={!isFormValid || isGenerating}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Génération...' : '📕 Télécharger PDF'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-white text-gray-700 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
