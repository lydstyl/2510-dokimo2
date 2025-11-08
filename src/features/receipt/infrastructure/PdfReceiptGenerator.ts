import { jsPDF } from 'jspdf';

export interface ReceiptData {
  receiptNumber: string;
  issueDate: Date;
  paymentDate: Date;
  receiptType: 'full' | 'partial' | 'overpayment' | 'unpaid';
  landlord: {
    name: string;
    type: 'NATURAL_PERSON' | 'LEGAL_ENTITY';
    address: string;
    email?: string;
    phone?: string;
    siret?: string;
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

    // Landlord section
    yPosition = this.addLandlordSection(pdf, data.landlord, data.receiptType, yPosition);
    yPosition += 5;

    // Tenant section
    yPosition = this.addTenantSection(pdf, data.tenants, yPosition);
    yPosition += 5;

    // Property section
    yPosition = this.addPropertySection(pdf, data.property, yPosition);
    yPosition += 5;

    // Lease information
    yPosition = this.addLeaseSection(pdf, data.lease, yPosition);
    yPosition += 5;

    // Payment details
    yPosition = this.addPaymentSection(pdf, data.payment, yPosition);
    yPosition += 5;

    // Balance information
    yPosition = this.addBalanceSection(pdf, data.balance, yPosition);
    yPosition += 5;

    // Status message
    yPosition = this.addStatusSection(pdf, data.receiptType, data.balance.after, yPosition);
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

  private addPaymentSection(
    pdf: jsPDF,
    payment: ReceiptData['payment'],
    y: number
  ): number {
    y = this.addSectionHeader(pdf, 'DÉTAILS DU PAIEMENT', y);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text(`Montant payé : ${this.formatCurrency(payment.amount)}`, this.MARGIN_LEFT, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    y += this.LINE_HEIGHT + 2;

    if (payment.notes) {
      pdf.text(`Notes : ${payment.notes}`, this.MARGIN_LEFT, y);
      y += this.LINE_HEIGHT;
    }

    return y;
  }

  private addBalanceSection(
    pdf: jsPDF,
    balance: ReceiptData['balance'],
    y: number
  ): number {
    y = this.addSectionHeader(pdf, 'SOLDE DU COMPTE', y);

    const beforeSign = balance.before < 0 ? '-' : '+';
    const afterSign = balance.after < 0 ? '-' : '+';

    pdf.text(
      `Solde avant paiement : ${beforeSign}${this.formatCurrency(Math.abs(balance.before))}`,
      this.MARGIN_LEFT,
      y
    );
    y += this.LINE_HEIGHT;

    pdf.setFont('helvetica', 'bold');
    pdf.text(
      `Solde après paiement : ${afterSign}${this.formatCurrency(Math.abs(balance.after))}`,
      this.MARGIN_LEFT,
      y
    );
    pdf.setFont('helvetica', 'normal');
    y += this.LINE_HEIGHT;

    return y;
  }

  private addStatusSection(
    pdf: jsPDF,
    receiptType: string,
    balanceAfter: number,
    y: number
  ): number {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);

    let statusText = '';
    let statusDetail = '';

    switch (receiptType) {
      case 'full':
        statusText = 'STATUT : LOYER PAYÉ INTÉGRALEMENT';
        statusDetail = 'Le locataire est à jour dans ses paiements.';
        break;
      case 'partial':
        statusText = 'STATUT : PAIEMENT PARTIEL';
        statusDetail = `Solde restant dû : ${this.formatCurrency(Math.abs(balanceAfter))}`;
        break;
      case 'overpayment':
        statusText = 'STATUT : TROP-PERÇU';
        statusDetail = `Crédit disponible : ${this.formatCurrency(balanceAfter)}`;
        break;
      case 'unpaid':
        statusText = 'STATUT : LOYER IMPAYÉ';
        statusDetail = `Montant dû : ${this.formatCurrency(Math.abs(balanceAfter))}`;
        break;
    }

    pdf.text(statusText, this.MARGIN_LEFT, y);
    y += this.LINE_HEIGHT;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(statusDetail, this.MARGIN_LEFT, y);

    return y + this.LINE_HEIGHT;
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
