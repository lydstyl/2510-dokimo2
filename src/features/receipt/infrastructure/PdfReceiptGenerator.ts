import { jsPDF } from 'jspdf';
import { PhoneNumber } from '@/domain/value-objects/PhoneNumber';

export interface ReceiptData {
  receiptNumber: string;
  issueDate: Date;
  paymentDate: Date;
  period?: string; // e.g., "Janvier 2026"
  receiptType: 'full' | 'partial' | 'overpayment' | 'unpaid';
  landlord: {
    name: string;
    type: 'NATURAL_PERSON' | 'LEGAL_ENTITY';
    address: string;
    email?: string;
    phone?: string;
    siret?: string;
    managerName?: string;
  };
  tenants: Array<{
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  }>;
  property: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
  };
  lease: {
    rentAmount: number;
    chargesAmount: number;
    paymentDueDay: number;
  };
  payment: {
    amount: number;
    notes?: string;
  };
  payments?: Array<{
    id: string;
    amount: number;
    paymentDate: string;
    notes: string | null;
  }>;
  balance: {
    before: number;
    after: number;
  };
}

/**
 * Generates a PDF receipt for rent payments
 * Follows Clean Architecture - infrastructure layer for PDF generation
 */
export class PdfReceiptGenerator {
  private readonly PAGE_WIDTH = 210; // A4 width in mm
  private readonly MARGIN_LEFT = 20;
  private readonly MARGIN_RIGHT = 20;
  private readonly LINE_HEIGHT = 7;
  private readonly CONTENT_WIDTH = this.PAGE_WIDTH - this.MARGIN_LEFT - this.MARGIN_RIGHT;

  /**
   * Generates a PDF document from receipt data
   * @param data Receipt data to include in the PDF
   * @returns PDF as ArrayBuffer
   */
  generate(data: ReceiptData): ArrayBuffer {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    let yPosition = 20;

    // Title
    yPosition = this.addTitle(pdf, data.receiptType, yPosition);
    yPosition += 5;

    // Receipt metadata
    yPosition = this.addMetadata(pdf, data, yPosition);
    yPosition += 5;

    // Landlord and Tenant sections in 2 columns
    yPosition = this.addLandlordAndTenantsColumns(pdf, data.landlord, data.tenants, yPosition);
    yPosition += 5;

    // Property section
    yPosition = this.addPropertySection(pdf, data.property, yPosition);
    yPosition += 5;

    // Lease information
    yPosition = this.addLeaseSection(pdf, data.lease, yPosition);
    yPosition += 5;

    // Payment and balance details (TXT format)
    yPosition = this.addPaymentAndBalanceSection(pdf, data, yPosition);
    yPosition += 10;

    // Footer
    this.addFooter(pdf, data.issueDate, yPosition);

    return pdf.output('arraybuffer');
  }

  private addTitle(pdf: jsPDF, receiptType: string, y: number): number {
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');

    let title = '';
    switch (receiptType) {
      case 'full':
        title = 'QUITTANCE DE LOYER';
        break;
      case 'partial':
        title = 'REÇU PARTIEL DE LOYER';
        break;
      case 'overpayment':
        title = 'REÇU DE TROP-PERÇU';
        break;
      case 'unpaid':
        title = 'AVIS DE LOYER IMPAYÉ';
        break;
    }

    const titleWidth = pdf.getTextWidth(title);
    pdf.text(title, (this.PAGE_WIDTH - titleWidth) / 2, y);

    // Add line below title
    pdf.setLineWidth(0.5);
    pdf.line(this.MARGIN_LEFT, y + 3, this.PAGE_WIDTH - this.MARGIN_RIGHT, y + 3);

    return y + 8;
  }

  private addMetadata(pdf: jsPDF, data: ReceiptData, y: number): number {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    // Add period if provided
    if (data.period) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text(`Période : ${data.period}`, this.MARGIN_LEFT, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      y += this.LINE_HEIGHT;
    }

    pdf.text(`Numéro de reçu : ${data.receiptNumber}`, this.MARGIN_LEFT, y);
    y += this.LINE_HEIGHT;

    pdf.text(
      `Date d'émission : ${this.formatDate(data.issueDate)}`,
      this.MARGIN_LEFT,
      y
    );
    y += this.LINE_HEIGHT;

    pdf.text(
      `Date de paiement : ${this.formatDate(data.paymentDate)}`,
      this.MARGIN_LEFT,
      y
    );

    return y + this.LINE_HEIGHT;
  }

  private addLandlordSection(
    pdf: jsPDF,
    landlord: ReceiptData['landlord'],
    receiptType: ReceiptData['receiptType'],
    y: number
  ): number {
    y = this.addSectionHeader(pdf, 'BAILLEUR', y);

    pdf.text(`Nom : ${landlord.name}`, this.MARGIN_LEFT, y);
    y += this.LINE_HEIGHT;

    // Only show Type for non-partial receipts
    if (receiptType !== 'partial') {
      const landlordType =
        landlord.type === 'NATURAL_PERSON' ? 'Personne physique' : 'Personne morale';
      pdf.text(`Type : ${landlordType}`, this.MARGIN_LEFT, y);
      y += this.LINE_HEIGHT;
    }

    pdf.text(`Adresse : ${landlord.address}`, this.MARGIN_LEFT, y);
    y += this.LINE_HEIGHT;

    if (landlord.email) {
      pdf.text(`Email : ${landlord.email}`, this.MARGIN_LEFT, y);
      y += this.LINE_HEIGHT;
    }

    if (landlord.phone) {
      pdf.text(`Téléphone : ${landlord.phone}`, this.MARGIN_LEFT, y);
      y += this.LINE_HEIGHT;
    }

    if (landlord.siret) {
      pdf.text(`SIRET : ${landlord.siret}`, this.MARGIN_LEFT, y);
      y += this.LINE_HEIGHT;
    }

    return y;
  }

  private addTenantSection(
    pdf: jsPDF,
    tenants: ReceiptData['tenants'],
    y: number
  ): number {
    tenants.forEach((tenant, index) => {
      const label = tenants.length > 1 ? `LOCATAIRE ${index + 1}` : 'LOCATAIRE';
      y = this.addSectionHeader(pdf, label, y);

      pdf.text(`Nom : ${tenant.firstName} ${tenant.lastName}`, this.MARGIN_LEFT, y);
      y += this.LINE_HEIGHT;

      if (tenant.email) {
        pdf.text(`Email : ${tenant.email}`, this.MARGIN_LEFT, y);
        y += this.LINE_HEIGHT;
      }

      if (tenant.phone) {
        pdf.text(`Téléphone : ${tenant.phone}`, this.MARGIN_LEFT, y);
        y += this.LINE_HEIGHT;
      }

      // Add spacing between tenants if there are multiple
      if (tenants.length > 1 && index < tenants.length - 1) {
        y += this.LINE_HEIGHT * 0.5;
      }
    });

    return y;
  }

  private addLandlordAndTenantsColumns(
    pdf: jsPDF,
    landlord: ReceiptData['landlord'],
    tenants: ReceiptData['tenants'],
    y: number
  ): number {
    const columnWidth = this.CONTENT_WIDTH / 2;
    const leftColumnX = this.MARGIN_LEFT;
    const rightColumnX = this.MARGIN_LEFT + columnWidth + 5;

    // LEFT COLUMN - BAILLEUR
    let leftY = y;
    leftY = this.addSectionHeader(pdf, 'BAILLEUR', leftY);

    // Show company name and manager name if legal entity with manager
    if (landlord.type === 'LEGAL_ENTITY' && landlord.managerName) {
      pdf.text(`Nom : ${landlord.name}`, leftColumnX, leftY);
      leftY += this.LINE_HEIGHT;
      pdf.text(`Gérant : ${landlord.managerName}`, leftColumnX, leftY);
      leftY += this.LINE_HEIGHT;
    } else {
      pdf.text(`Nom : ${landlord.name}`, leftColumnX, leftY);
      leftY += this.LINE_HEIGHT;
    }

    pdf.text(`Adresse : ${landlord.address}`, leftColumnX, leftY);
    leftY += this.LINE_HEIGHT;

    if (landlord.email) {
      pdf.text(`Email : ${landlord.email}`, leftColumnX, leftY);
      leftY += this.LINE_HEIGHT;
    }

    if (landlord.phone) {
      pdf.text(`Téléphone : ${PhoneNumber.format(landlord.phone)}`, leftColumnX, leftY);
      leftY += this.LINE_HEIGHT;
    }

    if (landlord.siret) {
      pdf.text(`SIRET : ${landlord.siret}`, leftColumnX, leftY);
      leftY += this.LINE_HEIGHT;
    }

    // RIGHT COLUMN - LOCATAIRE(S)
    let rightY = y;
    tenants.forEach((tenant, index) => {
      const label = tenants.length > 1 ? `LOCATAIRE ${index + 1}` : 'LOCATAIRE';

      // Add header for each tenant
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, rightColumnX, rightY);
      pdf.setFont('helvetica', 'normal');
      rightY += this.LINE_HEIGHT;

      pdf.text(`Nom : ${tenant.firstName} ${PhoneNumber.formatLastName(tenant.lastName)}`, rightColumnX, rightY);
      rightY += this.LINE_HEIGHT;

      if (tenant.email) {
        pdf.text(`Email : ${tenant.email}`, rightColumnX, rightY);
        rightY += this.LINE_HEIGHT;
      }

      if (tenant.phone) {
        pdf.text(`Téléphone : ${PhoneNumber.format(tenant.phone)}`, rightColumnX, rightY);
        rightY += this.LINE_HEIGHT;
      }

      // Add spacing between tenants if there are multiple
      if (tenants.length > 1 && index < tenants.length - 1) {
        rightY += this.LINE_HEIGHT * 0.5;
      }
    });

    // Return the maximum Y position from both columns
    return Math.max(leftY, rightY);
  }

  private addPropertySection(
    pdf: jsPDF,
    property: ReceiptData['property'],
    y: number
  ): number {
    y = this.addSectionHeader(pdf, 'BIEN LOUÉ', y);

    pdf.text(`Nom : ${property.name}`, this.MARGIN_LEFT, y);
    y += this.LINE_HEIGHT;

    pdf.text(`Adresse : ${property.address}`, this.MARGIN_LEFT, y);
    y += this.LINE_HEIGHT;

    pdf.text(`${property.postalCode} ${property.city}`, this.MARGIN_LEFT, y);
    y += this.LINE_HEIGHT;

    return y;
  }

  private addLeaseSection(
    pdf: jsPDF,
    lease: ReceiptData['lease'],
    y: number
  ): number {
    y = this.addSectionHeader(pdf, 'INFORMATIONS DU BAIL', y);

    const monthlyTotal = lease.rentAmount + lease.chargesAmount;

    pdf.text(`Loyer mensuel : ${this.formatCurrency(lease.rentAmount)}`, this.MARGIN_LEFT, y);
    y += this.LINE_HEIGHT;

    pdf.text(`Charges mensuelles : ${this.formatCurrency(lease.chargesAmount)}`, this.MARGIN_LEFT, y);
    y += this.LINE_HEIGHT;

    pdf.setFont('helvetica', 'bold');
    pdf.text(`Total mensuel : ${this.formatCurrency(monthlyTotal)}`, this.MARGIN_LEFT, y);
    pdf.setFont('helvetica', 'normal');
    y += this.LINE_HEIGHT;

    pdf.text(`Jour d'échéance : ${lease.paymentDueDay}`, this.MARGIN_LEFT, y);
    y += this.LINE_HEIGHT;

    return y;
  }

  private addPaymentAndBalanceSection(
    pdf: jsPDF,
    data: ReceiptData,
    y: number
  ): number {
    y = this.addSectionHeader(pdf, 'DÉTAILS DU PAIEMENT', y);

    // Montant payé ce mois
    pdf.text(
      `Montant payé ce mois :             ${this.formatCurrency(data.payment.amount)}`,
      this.MARGIN_LEFT,
      y
    );
    y += this.LINE_HEIGHT;

    // For partial payments, show remaining amount
    if (data.receiptType === 'partial') {
      pdf.text(
        `Reste à payer :                    ${this.formatCurrency(Math.abs(data.balance.after))}`,
        this.MARGIN_LEFT,
        y
      );
      y += this.LINE_HEIGHT;
    }

    // For overpayments, show excess amount
    if (data.receiptType === 'overpayment') {
      pdf.text(
        `Excédent (trop-perçu) :            +${this.formatCurrency(data.balance.after)}`,
        this.MARGIN_LEFT,
        y
      );
      y += this.LINE_HEIGHT;
    }

    y += 2; // Small spacing

    // Soldes
    const beforeSign = data.balance.before < 0 ? '-' : '+';
    const afterSign = data.balance.after < 0 ? '-' : '+';

    pdf.text(
      `Solde avant ce mois :              ${beforeSign}${this.formatCurrency(Math.abs(data.balance.before))}`,
      this.MARGIN_LEFT,
      y
    );
    y += this.LINE_HEIGHT;

    pdf.text(
      `Solde après ce mois :              ${afterSign}${this.formatCurrency(Math.abs(data.balance.after))}`,
      this.MARGIN_LEFT,
      y
    );
    y += this.LINE_HEIGHT + 3;

    // List of payments (if available)
    if (data.payments && data.payments.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('PAIEMENTS REÇUS :', this.MARGIN_LEFT, y);
      pdf.setFont('helvetica', 'normal');
      y += this.LINE_HEIGHT;

      data.payments.forEach(payment => {
        const paymentDate = new Date(payment.paymentDate);
        const formattedDate = paymentDate.toLocaleDateString('fr-FR');
        const paymentText = `  • ${formattedDate} : ${this.formatCurrency(payment.amount)}${payment.notes ? ' (' + payment.notes + ')' : ''}`;

        pdf.text(paymentText, this.MARGIN_LEFT, y);
        y += this.LINE_HEIGHT;
      });
    } else if (data.payment.amount === 0 && data.balance.before > 0) {
      // Credit was used
      pdf.setFont('helvetica', 'bold');
      pdf.text('UTILISATION DU CRÉDIT :', this.MARGIN_LEFT, y);
      pdf.setFont('helvetica', 'normal');
      y += this.LINE_HEIGHT;

      pdf.text(
        `Le loyer de ce mois a été intégralement réglé par imputation`,
        this.MARGIN_LEFT,
        y
      );
      y += this.LINE_HEIGHT;

      pdf.text(
        `sur le crédit existant de ${this.formatCurrency(data.balance.before)}.`,
        this.MARGIN_LEFT,
        y
      );
      y += this.LINE_HEIGHT;
    }

    return y;
  }


  private addFooter(pdf: jsPDF, issueDate: Date, y: number): number {
    // Add separator line
    pdf.setLineWidth(0.3);
    pdf.line(this.MARGIN_LEFT, y, this.PAGE_WIDTH - this.MARGIN_RIGHT, y);
    y += 5;

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');

    pdf.text(
      'Ce reçu est généré électroniquement et est valable sans signature.',
      this.MARGIN_LEFT,
      y
    );
    y += this.LINE_HEIGHT - 2;

    pdf.text(
      `Généré le : ${this.formatDateTime(issueDate)}`,
      this.MARGIN_LEFT,
      y
    );

    return y;
  }

  private addSectionHeader(pdf: jsPDF, title: string, y: number): number {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text(title, this.MARGIN_LEFT, y);

    // Add underline
    const titleWidth = pdf.getTextWidth(title);
    pdf.setLineWidth(0.3);
    pdf.line(this.MARGIN_LEFT, y + 1, this.MARGIN_LEFT + titleWidth, y + 1);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);

    return y + this.LINE_HEIGHT;
  }

  private formatCurrency(amount: number): string {
    return `${amount.toFixed(2)} €`;
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  private formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
}
