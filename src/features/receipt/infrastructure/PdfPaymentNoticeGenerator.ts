import { jsPDF } from 'jspdf';

export interface PaymentNoticeData {
  landlord: {
    name: string;
    type: 'NATURAL_PERSON' | 'LEGAL_ENTITY';
    address: string;
    email?: string;
    phone?: string;
  };
  tenant: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
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
  notice: {
    month: string; // Format: "Janvier 2025"
    issueDate: Date;
    previousBalance: number;
  };
}

/**
 * Generates a PDF payment notice (avis d'échéance)
 * Follows Clean Architecture - infrastructure layer for PDF generation
 */
export class PdfPaymentNoticeGenerator {
  private readonly PAGE_WIDTH = 210; // A4 width in mm
  private readonly MARGIN_LEFT = 20;
  private readonly MARGIN_RIGHT = 20;
  private readonly LINE_HEIGHT = 7;
  private readonly CONTENT_WIDTH = this.PAGE_WIDTH - this.MARGIN_LEFT - this.MARGIN_RIGHT;

  /**
   * Generates a PDF payment notice
   * @param data Payment notice data
   * @returns PDF as ArrayBuffer
   */
  generate(data: PaymentNoticeData): ArrayBuffer {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    let yPosition = 20;

    // Title
    yPosition = this.addTitle(pdf, yPosition);
    yPosition += 5;

    // Issue date
    yPosition = this.addIssueDate(pdf, data.notice.issueDate, yPosition);
    yPosition += 5;

    // Month notice
    yPosition = this.addMonthNotice(pdf, data.notice.month, yPosition);
    yPosition += 5;

    // Landlord section
    yPosition = this.addLandlordSection(pdf, data.landlord, yPosition);
    yPosition += 5;

    // Tenant section
    yPosition = this.addTenantSection(pdf, data.tenant, yPosition);
    yPosition += 5;

    // Property section
    yPosition = this.addPropertySection(pdf, data.property, yPosition);
    yPosition += 5;

    // Payment details
    yPosition = this.addPaymentDetails(pdf, data, yPosition);

    // Convert to ArrayBuffer
    const pdfOutput = pdf.output('arraybuffer');
    return pdfOutput;
  }

  private addTitle(pdf: jsPDF, y: number): number {
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    const title = 'AVIS D\'ÉCHÉANCE';
    const titleWidth = pdf.getTextWidth(title);
    const titleX = (this.PAGE_WIDTH - titleWidth) / 2;
    pdf.text(title, titleX, y);
    pdf.setFont('helvetica', 'normal');
    return y + 10;
  }

  private addIssueDate(pdf: jsPDF, issueDate: Date, y: number): number {
    pdf.setFontSize(10);
    const dateStr = `Généré le : ${issueDate.toLocaleDateString('fr-FR')}`;
    pdf.text(dateStr, this.MARGIN_LEFT, y);
    return y + this.LINE_HEIGHT;
  }

  private addMonthNotice(pdf: jsPDF, month: string, y: number): number {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Mois concerné : ${month}`, this.MARGIN_LEFT, y);
    pdf.setFont('helvetica', 'normal');
    return y + this.LINE_HEIGHT + 2;
  }

  private addSectionHeader(pdf: jsPDF, title: string, y: number): number {
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, this.MARGIN_LEFT, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    return y + this.LINE_HEIGHT;
  }

  private addLandlordSection(
    pdf: jsPDF,
    landlord: PaymentNoticeData['landlord'],
    y: number
  ): number {
    y = this.addSectionHeader(pdf, 'BAILLEUR', y);

    pdf.text(`Nom : ${landlord.name}`, this.MARGIN_LEFT, y);
    y += this.LINE_HEIGHT;

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

    return y;
  }

  private addTenantSection(
    pdf: jsPDF,
    tenant: PaymentNoticeData['tenant'],
    y: number
  ): number {
    y = this.addSectionHeader(pdf, 'LOCATAIRE', y);

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

    return y;
  }

  private addPropertySection(
    pdf: jsPDF,
    property: PaymentNoticeData['property'],
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

  private addPaymentDetails(pdf: jsPDF, data: PaymentNoticeData, y: number): number {
    y = this.addSectionHeader(pdf, 'DÉTAILS DU PAIEMENT', y);

    const rentAmount = data.lease.rentAmount;
    const chargesAmount = data.lease.chargesAmount;
    const totalMonthly = rentAmount + chargesAmount;
    const previousBalance = data.notice.previousBalance;
    const totalToPay = totalMonthly + previousBalance;

    // Due day
    pdf.text(`Jour d'échéance : ${data.lease.paymentDueDay}`, this.MARGIN_LEFT, y);
    y += this.LINE_HEIGHT + 2;

    // Previous balance
    pdf.text(`Solde antérieur : ${previousBalance.toFixed(2)} €`, this.MARGIN_LEFT, y);
    y += this.LINE_HEIGHT;

    // Rent breakdown
    pdf.text(`Loyer nu : ${rentAmount.toFixed(2)} €`, this.MARGIN_LEFT, y);
    y += this.LINE_HEIGHT;

    pdf.text(`Charges : ${chargesAmount.toFixed(2)} €`, this.MARGIN_LEFT, y);
    y += this.LINE_HEIGHT + 2;

    // Total to pay
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text(`TOTAL À PAYER : ${totalToPay.toFixed(2)} €`, this.MARGIN_LEFT, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    y += this.LINE_HEIGHT + 5;

    // Footer note
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    const footerText = 'Ce document est un avis d\'échéance. Il ne constitue pas une quittance de loyer.';
    const wrappedFooter = pdf.splitTextToSize(footerText, this.CONTENT_WIDTH);
    pdf.text(wrappedFooter, this.MARGIN_LEFT, y);
    pdf.setTextColor(0, 0, 0);

    return y;
  }
}
