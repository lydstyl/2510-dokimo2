import { MonthlyPaymentData } from '@/features/lease-payment-history/domain/MonthlyPaymentData';

/**
 * Structured receipt content that can be rendered as TXT or PDF
 */
export interface ReceiptContent {
  receiptType: 'full' | 'partial' | 'overpayment' | 'unpaid';
  title: string;
  period: string;
  generatedDate: string;

  // Tenant information
  tenants: Array<{
    label: string;
    name: string;
    email: string;
    phone: string;
  }>;

  // Property information
  property: {
    name: string;
    address: string;
    postalCode: string;
    city: string;
  };

  // Rent details
  rentDetails: {
    monthlyRent: number;
    rentAmount: number;
    chargesAmount: number;
    totalPaid: number;
    remainingDue?: number; // For partial payments
    overpayment?: number; // For overpayments
    balanceBefore: number;
    balanceAfter: number;
  };

  // Payment information
  payments: Array<{
    date: string;
    amount: number;
    notes: string | null;
  }>;

  // Credit usage flag
  creditUsed: boolean;

  // Signature information
  landlordName: string;
  tenantNames: string;

  // Additional sections
  attestationText: string;
  footerText?: string;
}

interface LeaseInfo {
  tenants: Array<{
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  }>;
  property: {
    name: string;
    address: string;
    postalCode: string;
    city: string;
    landlord: {
      type: string;
      name: string;
      managerName: string | null;
    };
  };
}

/**
 * Use case: Generate structured receipt content from monthly payment data
 * This is the single source of truth for receipt generation (both TXT and PDF)
 */
export class GenerateReceiptContent {
  /**
   * Format phone number (same logic as PhoneNumber.format)
   */
  private formatPhone(phone: string | null): string {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    }
    return phone;
  }

  /**
   * Format last name (same logic as PhoneNumber.formatLastName)
   */
  private formatLastName(lastName: string): string {
    return lastName.toUpperCase();
  }

  /**
   * Get landlord name (manager name for legal entities)
   */
  private getLandlordName(lease: LeaseInfo): string {
    if (lease.property.landlord.type === 'LEGAL_ENTITY' && lease.property.landlord.managerName) {
      return lease.property.landlord.managerName;
    }
    return lease.property.landlord.name;
  }

  /**
   * Format tenant names for signature (e.g., "Jean Dupont et Marie Martin")
   */
  private formatTenantNames(lease: LeaseInfo): string {
    if (!lease.tenants || lease.tenants.length === 0) {
      return 'le(s) locataire(s)';
    }
    if (lease.tenants.length === 1) {
      return `${lease.tenants[0].firstName} ${this.formatLastName(lease.tenants[0].lastName)}`;
    }
    const names = lease.tenants.map(
      (t) => `${t.firstName} ${this.formatLastName(t.lastName)}`
    );
    const lastTenant = names.pop()!;
    return `${names.join(', ')} et ${lastTenant}`;
  }

  /**
   * Generate structured receipt content
   */
  execute(monthData: MonthlyPaymentData, lease: LeaseInfo): ReceiptContent {
    const currentDate = new Date().toLocaleDateString('fr-FR');
    const landlordName = this.getLandlordName(lease);
    const tenantNames = this.formatTenantNames(lease);
    const creditUsed = monthData.totalPaid === 0 && monthData.balanceBefore > 0;

    // Format tenants
    const tenants = lease.tenants.map((t, index) => ({
      label: lease.tenants.length > 1 ? `LOCATAIRE ${index + 1}` : 'LOCATAIRE',
      name: `${t.firstName} ${this.formatLastName(t.lastName)}`,
      email: t.email || 'Email non renseigné',
      phone: this.formatPhone(t.phone) || 'Téléphone non renseigné',
    }));

    // Format payments
    const payments = monthData.payments.map((p) => ({
      date: new Date(p.paymentDate).toLocaleDateString('fr-FR'),
      amount: p.amount,
      notes: p.notes,
    }));

    // Build content based on receipt type
    let title: string;
    let attestationText: string;
    let footerText: string | undefined;

    switch (monthData.receiptType) {
      case 'unpaid':
        title = 'AVIS DE LOYER IMPAYÉ';
        attestationText = `Ce document atteste que le loyer du mois de ${monthData.monthLabel}\nn'a pas été réglé à la date d'édition de cet avis.`;
        break;

      case 'full':
        title = 'QUITTANCE DE LOYER';
        if (creditUsed) {
          attestationText = `Je soussigné(e), ${landlordName}, bailleur du bien immobilier désigné\nci-dessus, atteste que le loyer pour la période du ${monthData.monthLabel}\na été intégralement réglé par utilisation du crédit existant.`;
        } else {
          attestationText = `Je soussigné(e), ${landlordName}, bailleur du bien immobilier désigné\nci-dessus, reconnais avoir reçu de ${tenantNames} la somme de ${monthData.totalPaid.toFixed(2)} € au titre\ndu loyer et des charges pour la période du ${monthData.monthLabel}.`;
        }
        footerText = `Cette quittance annule tous les reçus qui auraient pu\nêtre donnés précédemment en cas d'acomptes versés sur\nla période en question.`;
        break;

      case 'partial':
        title = 'REÇU DE PAIEMENT PARTIEL';
        if (creditUsed) {
          attestationText = `Je soussigné(e), ${landlordName}, bailleur du bien immobilier désigné\nci-dessus, atteste qu'un crédit de ${monthData.balanceBefore.toFixed(2)} € a été imputé\nsur le loyer pour la période du ${monthData.monthLabel}.`;
        } else {
          attestationText = `Je soussigné(e), ${landlordName}, bailleur du bien immobilier désigné\nci-dessus, reconnais avoir reçu de ${tenantNames} la somme de ${monthData.totalPaid.toFixed(2)} € au titre\nd'un paiement partiel pour la période du ${monthData.monthLabel}.`;
        }
        footerText = `ATTENTION : Ce document ne constitue pas une quittance\nde loyer. Le solde restant dû de ${Math.abs(monthData.balanceAfter).toFixed(2)} €\ndevra être réglé.`;
        break;

      case 'overpayment':
        title = 'REÇU DE PAIEMENT - TROP-PERÇU';
        attestationText = `Je soussigné(e), ${landlordName}, bailleur du bien immobilier désigné\nci-dessus, reconnais avoir reçu de ${tenantNames}\nla somme de ${monthData.totalPaid.toFixed(2)} € pour\nla période du ${monthData.monthLabel}.`;
        footerText = `Le montant versé est supérieur au loyer dû, générant\nun crédit de ${monthData.balanceAfter.toFixed(2)} € qui sera déduit du\nprochain loyer ou remboursé selon accord entre les parties.`;
        break;
    }

    return {
      receiptType: monthData.receiptType,
      title,
      period: monthData.monthLabel,
      generatedDate: currentDate,
      tenants,
      property: {
        name: lease.property.name,
        address: lease.property.address,
        postalCode: lease.property.postalCode,
        city: lease.property.city,
      },
      rentDetails: {
        monthlyRent: monthData.monthlyRent,
        rentAmount: monthData.rentAmount,
        chargesAmount: monthData.chargesAmount,
        totalPaid: monthData.totalPaid,
        remainingDue: monthData.receiptType === 'partial' ? Math.abs(monthData.balanceAfter) : undefined,
        overpayment: monthData.receiptType === 'overpayment' ? monthData.balanceAfter : undefined,
        balanceBefore: monthData.balanceBefore,
        balanceAfter: monthData.balanceAfter,
      },
      payments,
      creditUsed,
      landlordName,
      tenantNames,
      attestationText,
      footerText,
    };
  }
}
