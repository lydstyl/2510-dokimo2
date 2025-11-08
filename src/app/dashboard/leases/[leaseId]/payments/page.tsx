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

interface Landlord {
  id: string;
  name: string;
  type: string;
  managerName: string | null;
}

interface Property {
  id: string;
  name: string;
  address: string;
  postalCode: string;
  city: string;
  landlord: Landlord;
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
  tenants: Tenant[];
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
  const [currentRentAmount, setCurrentRentAmount] = useState(0);
  const [currentChargesAmount, setCurrentChargesAmount] = useState(0);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [editingRentMonth, setEditingRentMonth] = useState<string | null>(null);
  const [newRentAmount, setNewRentAmount] = useState('');
  const [newChargesAmount, setNewChargesAmount] = useState('');
  const [rentChangeReason, setRentChangeReason] = useState('');

  useEffect(() => {
    fetchLeaseDetails();
  }, [leaseId, router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown && !(event.target as Element).closest('.relative')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

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

      const leaseData: any = await response.json();

      // Transform tenants structure from API format to client format
      const transformedLease: Lease = {
        ...leaseData,
        tenants: leaseData.tenants.map((lt: any) => lt.tenant),
      };

      setLease(transformedLease);
      await calculateMonthlyRows(transformedLease);
    } catch (error) {
      console.error('Error fetching lease details:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyRows = async (leaseData: Lease) => {
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

    // Fetch rent history for these months
    let rentHistory: { [month: string]: number } = {};
    let rentDetails: { [month: string]: { rent: number; charges: number } } = {};
    try {
      const startMonth = last24Months[0];
      const endMonth = last24Months[last24Months.length - 1];
      const response = await fetch(`/api/leases/${leaseData.id}/rent-history?startMonth=${startMonth}&endMonth=${endMonth}`);
      if (response.ok) {
        const history = await response.json();
        rentHistory = history.reduce((acc: any, item: any) => {
          acc[item.month] = item.totalAmount;
          return acc;
        }, {});
        rentDetails = history.reduce((acc: any, item: any) => {
          acc[item.month] = { rent: item.rentAmount, charges: item.chargesAmount };
          return acc;
        }, {});

        // Find the most recent rent amounts (from the last month in history)
        if (history.length > 0) {
          const mostRecent = history[history.length - 1];
          setCurrentRentAmount(mostRecent.rentAmount);
          setCurrentChargesAmount(mostRecent.chargesAmount);
        } else {
          setCurrentRentAmount(leaseData.rentAmount);
          setCurrentChargesAmount(leaseData.chargesAmount);
        }
      }
    } catch (error) {
      console.error('Error fetching rent history:', error);
      // Fallback to fixed rent if API fails
      const fallbackRent = leaseData.rentAmount + leaseData.chargesAmount;
      last24Months.forEach(month => {
        rentHistory[month] = fallbackRent;
        rentDetails[month] = { rent: leaseData.rentAmount, charges: leaseData.chargesAmount };
      });
      setCurrentRentAmount(leaseData.rentAmount);
      setCurrentChargesAmount(leaseData.chargesAmount);
    }

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

      // Get rent for this specific month (may vary due to rent revisions)
      const monthlyRent = rentHistory[month] || (leaseData.rentAmount + leaseData.chargesAmount);

      const balanceBefore = runningBalance;
      runningBalance = runningBalance + totalPaid - monthlyRent;
      const balanceAfter = runningBalance;

      // Determine receipt type
      let receiptType: 'full' | 'partial' | 'overpayment' | 'unpaid';

      // Si aucun paiement ce mois
      if (totalPaid === 0) {
        // Si le locataire avait un crédit avant (balanceBefore > 0), il utilise son crédit
        if (balanceBefore > 0) {
          // Vérifier si le crédit couvre tout le loyer
          if (balanceAfter >= -0.01) {
            receiptType = 'full'; // Le crédit a couvert tout le loyer
          } else {
            receiptType = 'partial'; // Le crédit n'a pas couvert tout le loyer
          }
        } else {
          // Pas de crédit et pas de paiement = loyer impayé
          receiptType = 'unpaid';
        }
      } else if (balanceAfter > 0) {
        // Si le solde après est positif, c'est un trop-perçu
        receiptType = 'overpayment';
      } else if (balanceAfter >= -0.01) {
        // Si le solde est proche de 0 (±0.01), c'est une quittance complète
        receiptType = 'full';
      } else {
        // Sinon c'est un paiement partiel
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

  const handleEditRent = (month: string) => {
    if (!lease) return;
    setEditingRentMonth(month);
    setNewRentAmount(lease.rentAmount.toString());
    setNewChargesAmount(lease.chargesAmount.toString());
    setRentChangeReason('');
  };

  const handleSaveRentChange = async () => {
    if (!lease || !editingRentMonth) return;

    const rentAmount = parseFloat(newRentAmount);
    const chargesAmount = parseFloat(newChargesAmount);

    if (isNaN(rentAmount) || isNaN(chargesAmount) || rentAmount < 0 || chargesAmount < 0) {
      alert('Veuillez entrer des montants valides');
      return;
    }

    try {
      // Create rent revision with effective date = first day of selected month
      const effectiveDate = new Date(`${editingRentMonth}-01`);

      const response = await fetch('/api/rent-revisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaseId: lease.id,
          effectiveDate: effectiveDate.toISOString(),
          rentAmount,
          chargesAmount,
          reason: rentChangeReason || undefined,
        }),
      });

      if (response.ok) {
        setEditingRentMonth(null);
        setNewRentAmount('');
        setNewChargesAmount('');
        setRentChangeReason('');
        fetchLeaseDetails(); // Refresh to recalculate with new rent
      } else {
        const error = await response.json();
        alert('Erreur: ' + error.error);
      }
    } catch (error) {
      console.error('Error saving rent change:', error);
      alert('Échec de la modification du loyer');
    }
  };

  const handleAddPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!lease) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const payload = {
      leaseId: lease.id,
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
        setShowAddPayment(false);
        fetchLeaseDetails();
      } else {
        const error = await response.json();
        alert('Erreur: ' + error.error);
      }
    } catch (error) {
      alert('Échec de l\'enregistrement du paiement');
    }
  };

  const handleDownloadPaymentNotice = async (monthOffset: number) => {
    if (!lease || monthlyRows.length === 0) return;

    // Calculate target month (0 = current month, 1 = next month)
    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const targetMonth = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;

    // Get month label in French
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const monthLabel = `${monthNames[targetDate.getMonth()]} ${targetDate.getFullYear()}`;

    // Find the current month row (first row in the table)
    const currentMonthRow = monthlyRows[0];

    // Calculate balances based on monthOffset
    let previousBalance = 0; // Solde antérieur (Dû avant)
    let paymentsThisMonth = 0;
    let rentAmount = currentRentAmount || lease.rentAmount;
    let chargesAmount = currentChargesAmount || lease.chargesAmount;
    let totalToPay = 0; // Dû après

    if (monthOffset === 0) {
      // Mois actuel: utiliser les données de la première ligne du tableau
      previousBalance = currentMonthRow.balanceBefore; // Dû avant
      paymentsThisMonth = currentMonthRow.totalPaid; // Paiements effectués ce mois
      totalToPay = currentMonthRow.balanceAfter; // Dû après
      // Use the monthly rent from the current row (accounts for revisions)
      rentAmount = currentMonthRow.monthlyRent - chargesAmount;
    } else if (monthOffset === 1) {
      // Mois prochain:
      // Solde antérieur = Dû après du mois actuel
      previousBalance = currentMonthRow.balanceAfter;
      paymentsThisMonth = 0; // Pas de paiements dans le futur
      // Total à payer = solde antérieur - loyer - charges + paiements (0)
      // Si previousBalance est négatif (locataire doit), on ajoute le loyer à la dette
      // Exemple: -20.10 - 485.22 - 42.00 = -547.32 (doit 547.32€)
      totalToPay = previousBalance - rentAmount - chargesAmount;
    }

    // Fetch landlord details to get address
    let landlordAddress = 'Non renseigné';
    let landlordEmail = undefined;
    let landlordPhone = undefined;

    try {
      const landlordResponse = await fetch(`/api/landlords/${lease.property.landlord.id}`);
      if (landlordResponse.ok) {
        const landlordData = await landlordResponse.json();
        landlordAddress = landlordData.address || 'Non renseigné';
        landlordEmail = landlordData.email || undefined;
        landlordPhone = landlordData.phone || undefined;
      }
    } catch (error) {
      console.error('Error fetching landlord details:', error);
    }

    // Prepare data for PDF generator
    const noticeData = {
      landlord: {
        name: lease.property.landlord.name,
        type: lease.property.landlord.type as 'NATURAL_PERSON' | 'LEGAL_ENTITY',
        address: landlordAddress,
        email: landlordEmail,
        phone: landlordPhone,
      },
      tenant: {
        firstName: tenant.firstName,
        lastName: tenant.lastName,
        email: tenant.email || undefined,
        phone: tenant.phone || undefined,
      },
      property: {
        name: lease.property.name,
        address: lease.property.address,
        city: lease.property.city,
        postalCode: lease.property.postalCode,
      },
      lease: {
        rentAmount: rentAmount,
        chargesAmount: chargesAmount,
        paymentDueDay: lease.paymentDueDay,
      },
      notice: {
        month: monthLabel,
        issueDate: new Date(),
        previousBalance: previousBalance,
        paymentsThisMonth: paymentsThisMonth,
        totalToPay: totalToPay,
      },
    };

    // Dynamic import to avoid server-side issues
    const { PdfPaymentNoticeGenerator } = await import('@/features/receipt/infrastructure/PdfPaymentNoticeGenerator');
    const generator = new PdfPaymentNoticeGenerator();
    const pdfBuffer = generator.generate(noticeData);

    // Download PDF
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `avis-echeance-${targetMonth}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleExportTxt = () => {
    if (!lease) return;

    const currentDate = new Date().toLocaleDateString('fr-FR');
    const monthlyRent = lease.rentAmount + lease.chargesAmount;

    let content = `═══════════════════════════════════════════════════════════════
          HISTORIQUE DES PAIEMENTS - EXPORT COMPLET
═══════════════════════════════════════════════════════════════

Généré le : ${currentDate}

LOCATAIRE
${tenant.firstName} ${tenant.lastName}
${tenant.email || 'Email non renseigné'}
${tenant.phone || 'Téléphone non renseigné'}

BIEN LOUÉ
${lease.property.name}
${lease.property.address}
${lease.property.postalCode} ${lease.property.city}

PÉRIODE DU BAIL
Du ${new Date(lease.startDate).toLocaleDateString('fr-FR')} au ${lease.endDate ? new Date(lease.endDate).toLocaleDateString('fr-FR') : 'En cours'}
Loyer mensuel : ${monthlyRent.toFixed(2)} € (Loyer: ${lease.rentAmount.toFixed(2)} € + Charges: ${lease.chargesAmount.toFixed(2)} €)
Jour de paiement : ${lease.paymentDueDay}

═══════════════════════════════════════════════════════════════
          HISTORIQUE DES 24 DERNIERS MOIS
═══════════════════════════════════════════════════════════════

`;

    monthlyRows.forEach(row => {
      content += `
─────────────────────────────────────────────────────────────

MOIS : ${row.monthLabel}
Type de reçu : ${
  row.receiptType === 'full' ? 'Quittance de loyer' :
  row.receiptType === 'partial' ? 'Reçu partiel' :
  row.receiptType === 'overpayment' ? 'Trop-perçu' :
  'Loyer impayé'
}

Loyer dû :                         ${row.monthlyRent.toFixed(2)} €
Montant payé :                     ${row.totalPaid.toFixed(2)} €
Solde avant paiement :             ${row.balanceBefore.toFixed(2)} €
Solde après paiement :             ${row.balanceAfter.toFixed(2)} €

`;

      if (row.payments.length > 0) {
        content += `Paiements reçus :\n`;
        row.payments.forEach(p => {
          content += `  • ${new Date(p.paymentDate).toLocaleDateString('fr-FR')} : ${p.amount.toFixed(2)} €`;
          if (p.notes) content += ` (${p.notes})`;
          content += `\n`;
        });
      } else {
        content += `Aucun paiement reçu\n`;
      }
    });

    content += `
═══════════════════════════════════════════════════════════════

Document généré automatiquement par le système de gestion locative.

`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historique-paiements-${tenant.lastName}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleExportCsv = () => {
    if (!lease) return;

    // CSV Header
    let csvContent = 'Mois,Loyer dû (€),Montant payé (€),Solde avant (€),Solde après (€),Type de reçu,Date paiement,Montant paiement (€),Notes\n';

    // CSV Rows
    monthlyRows.forEach(row => {
      const receiptTypeLabel =
        row.receiptType === 'full' ? 'Quittance de loyer' :
        row.receiptType === 'partial' ? 'Reçu partiel' :
        row.receiptType === 'overpayment' ? 'Trop-perçu' :
        'Loyer impayé';

      if (row.payments.length > 0) {
        // One row per payment
        row.payments.forEach(p => {
          const notes = p.notes ? p.notes.replace(/"/g, '""') : ''; // Escape quotes
          csvContent += `"${row.monthLabel}",${row.monthlyRent.toFixed(2)},${row.totalPaid.toFixed(2)},${row.balanceBefore.toFixed(2)},${row.balanceAfter.toFixed(2)},"${receiptTypeLabel}","${new Date(p.paymentDate).toLocaleDateString('fr-FR')}",${p.amount.toFixed(2)},"${notes}"\n`;
        });
      } else {
        // Row with no payment
        csvContent += `"${row.monthLabel}",${row.monthlyRent.toFixed(2)},${row.totalPaid.toFixed(2)},${row.balanceBefore.toFixed(2)},${row.balanceAfter.toFixed(2)},"${receiptTypeLabel}","","",""\n`;
      }
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historique-paiements-${tenant.lastName}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleDownloadReceiptPdf = async (month: string, receiptType: string) => {
    if (!lease) return;

    const monthRow = monthlyRows.find(r => r.month === month);
    if (!monthRow) return;

    // Get the first payment of the month (or use month info if no payment)
    const paymentId = monthRow.payments.length > 0 ? monthRow.payments[0].id : null;

    if (!paymentId) {
      alert('Aucun paiement trouvé pour générer un reçu PDF');
      return;
    }

    try {
      const response = await fetch(`/api/receipts-pdf/${paymentId}?type=${receiptType}`);
      if (!response.ok) {
        throw new Error('Erreur lors de la génération du PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Filename is already set by the server in Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      a.download = filenameMatch ? filenameMatch[1] : `receipt-${month}.pdf`;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF receipt:', error);
      alert('Erreur lors du téléchargement du reçu PDF');
    }
  };

  const handleDownloadReceipt = async (month: string, receiptType: string) => {
    if (!lease) return;

    const monthRow = monthlyRows.find(r => r.month === month);
    if (!monthRow) return;

    const currentDate = new Date().toLocaleDateString('fr-FR');
    let content = '';
    let filename = '';

    // Get landlord name based on type (manager name for legal entities)
    const getLandlordName = () => {
      if (lease.property.landlord.type === 'LEGAL_ENTITY' && lease.property.landlord.managerName) {
        return lease.property.landlord.managerName;
      }
      return lease.property.landlord.name;
    };
    const landlordName = getLandlordName();

    // Generate content based on receipt type
    if (receiptType === 'unpaid') {
      // AVIS DE LOYER IMPAYÉ
      content = `═══════════════════════════════════════════════════════
              AVIS DE LOYER IMPAYÉ
═══════════════════════════════════════════════════════

Période : ${monthRow.monthLabel}
Généré le : ${currentDate}

─────────────────────────────────────────────────────

LOCATAIRE
${tenant.firstName} ${tenant.lastName}
${tenant.email || 'Email non renseigné'}
${tenant.phone || 'Téléphone non renseigné'}

BIEN LOUÉ
${lease.property.name}
${lease.property.address}
${lease.property.postalCode} ${lease.property.city}

─────────────────────────────────────────────────────

DÉTAILS DU LOYER

Loyer mensuel :                    ${monthRow.monthlyRent.toFixed(2)} €
  • Loyer :                        ${lease.rentAmount.toFixed(2)} €
  • Charges :                      ${lease.chargesAmount.toFixed(2)} €

Montant payé :                     0,00 €
Solde dû après ce mois :           ${Math.abs(monthRow.balanceAfter).toFixed(2)} €

─────────────────────────────────────────────────────

Ce document atteste que le loyer du mois de ${monthRow.monthLabel}
n'a pas été réglé à la date d'édition de cet avis.

═══════════════════════════════════════════════════════`;
      filename = `avis-impaye-${month}.txt`;
    } else if (receiptType === 'full') {
      // QUITTANCE DE LOYER
      const creditUsed = monthRow.totalPaid === 0 && monthRow.balanceBefore > 0;

      content = `═══════════════════════════════════════════════════════
              QUITTANCE DE LOYER
═══════════════════════════════════════════════════════

Période : ${monthRow.monthLabel}
Généré le : ${currentDate}

─────────────────────────────────────────────────────

LOCATAIRE
${tenant.firstName} ${tenant.lastName}
${tenant.email || 'Email non renseigné'}
${tenant.phone || 'Téléphone non renseigné'}

BIEN LOUÉ
${lease.property.name}
${lease.property.address}
${lease.property.postalCode} ${lease.property.city}

─────────────────────────────────────────────────────

DÉTAILS DU LOYER

Loyer mensuel :                    ${monthRow.monthlyRent.toFixed(2)} €
  • Loyer :                        ${lease.rentAmount.toFixed(2)} €
  • Charges :                      ${lease.chargesAmount.toFixed(2)} €

Montant payé ce mois :             ${monthRow.totalPaid.toFixed(2)} €

Solde avant ce mois :              ${monthRow.balanceBefore.toFixed(2)} €
Solde après ce mois :              ${monthRow.balanceAfter.toFixed(2)} €

${creditUsed ? `UTILISATION DU CRÉDIT :
Le loyer de ce mois a été intégralement réglé par imputation
sur le crédit existant de ${monthRow.balanceBefore.toFixed(2)} €.
` : `PAIEMENTS REÇUS :
${monthRow.payments.map(p =>
  `  • ${new Date(p.paymentDate).toLocaleDateString('fr-FR')} : ${p.amount.toFixed(2)} €${p.notes ? ' (' + p.notes + ')' : ''}`
).join('\n')}
`}
─────────────────────────────────────────────────────

Je soussigné(e), ${landlordName}, bailleur du bien immobilier désigné
ci-dessus, ${creditUsed ?
  `atteste que le loyer pour la période du ${monthRow.monthLabel}\na été intégralement réglé par utilisation du crédit existant.` :
  `reconnais avoir reçu de ${tenant.firstName}\n${tenant.lastName} la somme de ${monthRow.totalPaid.toFixed(2)} € au titre\ndu loyer et des charges pour la période du ${monthRow.monthLabel}.`
}

Cette quittance annule tous les reçus qui auraient pu
être donnés précédemment en cas d'acomptes versés sur
la période en question.

═══════════════════════════════════════════════════════`;
      filename = `quittance-loyer-${month}.txt`;
    } else if (receiptType === 'partial') {
      // REÇU PARTIEL
      const creditUsed = monthRow.totalPaid === 0 && monthRow.balanceBefore > 0;

      content = `═══════════════════════════════════════════════════════
              REÇU DE PAIEMENT PARTIEL
═══════════════════════════════════════════════════════

Période : ${monthRow.monthLabel}
Généré le : ${currentDate}

─────────────────────────────────────────────────────

LOCATAIRE
${tenant.firstName} ${tenant.lastName}
${tenant.email || 'Email non renseigné'}
${tenant.phone || 'Téléphone non renseigné'}

BIEN LOUÉ
${lease.property.name}
${lease.property.address}
${lease.property.postalCode} ${lease.property.city}

─────────────────────────────────────────────────────

DÉTAILS DU LOYER

Loyer mensuel dû :                 ${monthRow.monthlyRent.toFixed(2)} €
  • Loyer :                        ${lease.rentAmount.toFixed(2)} €
  • Charges :                      ${lease.chargesAmount.toFixed(2)} €

Montant payé ce mois :             ${monthRow.totalPaid.toFixed(2)} €
Reste à payer :                    ${Math.abs(monthRow.balanceAfter).toFixed(2)} €

Solde avant ce mois :              ${monthRow.balanceBefore.toFixed(2)} €
Solde après ce mois :              ${monthRow.balanceAfter.toFixed(2)} €

${creditUsed ? `UTILISATION DU CRÉDIT :
Le crédit existant de ${monthRow.balanceBefore.toFixed(2)} € a été utilisé
pour régler partiellement le loyer de ce mois.
` : `PAIEMENTS REÇUS :
${monthRow.payments.map(p =>
  `  • ${new Date(p.paymentDate).toLocaleDateString('fr-FR')} : ${p.amount.toFixed(2)} €${p.notes ? ' (' + p.notes + ')' : ''}`
).join('\n')}
`}
─────────────────────────────────────────────────────

Je soussigné(e), ${landlordName}, bailleur du bien immobilier désigné
ci-dessus, ${creditUsed ?
  `atteste qu'un crédit de ${monthRow.balanceBefore.toFixed(2)} € a été imputé\nsur le loyer pour la période du ${monthRow.monthLabel}.` :
  `reconnais avoir reçu de ${tenant.firstName}\n${tenant.lastName} la somme de ${monthRow.totalPaid.toFixed(2)} € au titre\nd'un paiement partiel pour la période du ${monthRow.monthLabel}.`
}

ATTENTION : Ce document ne constitue pas une quittance
de loyer. Le solde restant dû de ${Math.abs(monthRow.balanceAfter).toFixed(2)} €
devra être réglé.

═══════════════════════════════════════════════════════`;
      filename = `recu-partiel-${month}.txt`;
    } else if (receiptType === 'overpayment') {
      // REÇU DE TROP-PERÇU
      content = `═══════════════════════════════════════════════════════
              REÇU DE PAIEMENT - TROP-PERÇU
═══════════════════════════════════════════════════════

Période : ${monthRow.monthLabel}
Généré le : ${currentDate}

─────────────────────────────────────────────────────

LOCATAIRE
${tenant.firstName} ${tenant.lastName}
${tenant.email || 'Email non renseigné'}
${tenant.phone || 'Téléphone non renseigné'}

BIEN LOUÉ
${lease.property.name}
${lease.property.address}
${lease.property.postalCode} ${lease.property.city}

─────────────────────────────────────────────────────

DÉTAILS DU LOYER

Loyer mensuel dû :                 ${monthRow.monthlyRent.toFixed(2)} €
  • Loyer :                        ${lease.rentAmount.toFixed(2)} €
  • Charges :                      ${lease.chargesAmount.toFixed(2)} €

Montant payé :                     ${monthRow.totalPaid.toFixed(2)} €
Excédent (trop-perçu) :            +${monthRow.balanceAfter.toFixed(2)} €

Solde avant paiement :             ${monthRow.balanceBefore.toFixed(2)} €
Solde après paiement :             +${monthRow.balanceAfter.toFixed(2)} €

PAIEMENTS REÇUS :
${monthRow.payments.map(p =>
  `  • ${new Date(p.paymentDate).toLocaleDateString('fr-FR')} : ${p.amount.toFixed(2)} €${p.notes ? ' (' + p.notes + ')' : ''}`
).join('\n')}

─────────────────────────────────────────────────────

Je soussigné(e), ${landlordName}, bailleur du bien immobilier désigné
ci-dessus, reconnais avoir reçu de ${tenant.firstName}
${tenant.lastName} la somme de ${monthRow.totalPaid.toFixed(2)} € pour
la période du ${monthRow.monthLabel}.

Le montant versé est supérieur au loyer dû, générant
un crédit de ${monthRow.balanceAfter.toFixed(2)} € qui sera déduit du
prochain loyer ou remboursé selon accord entre les parties.

═══════════════════════════════════════════════════════`;
      filename = `recu-trop-percu-${month}.txt`;
    }

    // Download the file
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
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

  // Use current rent amounts (most recent after revisions) or fall back to lease amounts
  const displayRent = currentRentAmount || lease.rentAmount;
  const displayCharges = currentChargesAmount || lease.chargesAmount;
  const monthlyRent = displayRent + displayCharges;

  // For backward compatibility, reference the first tenant
  const tenant = lease.tenants && lease.tenants.length > 0 ? lease.tenants[0] : {
    id: '',
    firstName: 'N/A',
    lastName: '',
    email: null,
    phone: null,
  };

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
            {tenant.firstName} {tenant.lastName}
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
              <p className="font-medium">{tenant.email || t('noEmail')}</p>
              <p className="text-gray-500">{tenant.phone || t('noPhone')}</p>
            </div>
            <div>
              <p className="text-gray-600">{t('leaseSummary.monthlyRent')}</p>
              <p className="font-medium text-lg">€{monthlyRent.toFixed(2)}</p>
              <p className="text-gray-500">{t('leaseSummary.rent')} €{displayRent.toFixed(2)} + {t('leaseSummary.charges')} €{displayCharges.toFixed(2)}</p>
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
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">{t('historyHeading')}</h3>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleDownloadPaymentNotice(0)}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center gap-2"
                title="Télécharger l'avis d'échéance du mois en cours"
              >
                📅 Avis mois actuel
              </button>
              <button
                onClick={() => handleDownloadPaymentNotice(1)}
                className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 flex items-center gap-2"
                title="Télécharger l'avis d'échéance du mois prochain"
              >
                📅 Avis mois prochain
              </button>
              <button
                onClick={handleExportTxt}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 flex items-center gap-2"
                title="Exporter l'historique en .txt"
              >
                📄 Exporter TXT
              </button>
              <button
                onClick={handleExportCsv}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
                title="Exporter l'historique en .csv"
              >
                📊 Exporter CSV
              </button>
              <button
                onClick={() => setShowAddPayment(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                + Ajouter un paiement
              </button>
            </div>
          </div>

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
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-gray-900">€{row.monthlyRent.toFixed(2)}</div>
                          <button
                            onClick={() => handleEditRent(row.month)}
                            className="text-gray-400 hover:text-blue-600 text-xs"
                            title="Modifier le loyer pour ce mois et les suivants"
                          >
                            ✏️
                          </button>
                        </div>
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
                        <div className="relative inline-block text-left">
                          <button
                            onClick={() => setActiveDropdown(activeDropdown === row.month ? null : row.month)}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                          >
                            Télécharger ▼
                          </button>
                          {activeDropdown === row.month && (
                            <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    handleDownloadReceipt(row.month, row.receiptType);
                                    setActiveDropdown(null);
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  📄 Format TXT
                                </button>
                                <button
                                  onClick={() => {
                                    handleDownloadReceiptPdf(row.month, row.receiptType);
                                    setActiveDropdown(null);
                                  }}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  📕 Format PDF
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
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

      {/* Add Payment Modal */}
      {showAddPayment && lease && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Ajouter un paiement</h3>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setShowAddPayment(false)}
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                <strong>{tenant.firstName} {tenant.lastName}</strong>
                <br />
                {lease.property.name}
              </p>
            </div>

            <form onSubmit={handleAddPayment}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant (€)
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
                  Date de paiement
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
                  Notes (optionnel)
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
                  onClick={() => setShowAddPayment(false)}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Enregistrer le paiement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Rent Modal */}
      {editingRentMonth && lease && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Modifier le loyer</h3>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setEditingRentMonth(null)}
              >
                ✕
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                ⚠️ Cette modification s'appliquera à partir de{' '}
                <strong>{monthlyRows.find(r => r.month === editingRentMonth)?.monthLabel}</strong>
                {' '}et tous les mois suivants. Les soldes seront recalculés automatiquement.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loyer hors charges (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={newRentAmount}
                onChange={(e) => setNewRentAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Exemple: 1000.00"
              />
              <p className="text-xs text-gray-500 mt-1">Loyer actuel: €{lease.rentAmount.toFixed(2)}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Charges (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={newChargesAmount}
                onChange={(e) => setNewChargesAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Exemple: 150.00"
              />
              <p className="text-xs text-gray-500 mt-1">Charges actuelles: €{lease.chargesAmount.toFixed(2)}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loyer total
              </label>
              <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-lg font-bold">
                €{(parseFloat(newRentAmount || '0') + parseFloat(newChargesAmount || '0')).toFixed(2)}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raison de la modification (optionnel)
              </label>
              <select
                value={rentChangeReason}
                onChange={(e) => setRentChangeReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Sélectionner --</option>
                <option value="IRL_REVISION">Révision IRL (indice de référence des loyers)</option>
                <option value="AGREEMENT">Accord amiable</option>
                <option value="WORK_COMPLETION">Fin de travaux</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                onClick={() => setEditingRentMonth(null)}
              >
                Annuler
              </button>
              <button
                onClick={handleSaveRentChange}
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
