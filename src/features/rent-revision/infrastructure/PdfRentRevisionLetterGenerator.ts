import { jsPDF } from 'jspdf';

export interface RentRevisionLetterData {
  landlord: {
    name: string;
    address: string;
    managerName?: string;
  };
  tenant: {
    civility?: string;
    firstName: string;
    lastName: string;
  };
  property: {
    name: string;
    address: string;
    postalCode: string;
    city: string;
  };
  revision: {
    date: Date;
    oldIndex: number;
    newIndex: number;
    currentRent: number;
    newRent: number;
    charges: number;
    effectiveMonth: string;
    irlQuarter?: string;
  };
}

/**
 * Generates a PDF rent revision letter
 * Follows Clean Architecture - infrastructure layer for PDF generation
 */
export class PdfRentRevisionLetterGenerator {
  private readonly PAGE_WIDTH = 210; // A4 width in mm
  private readonly MARGIN_LEFT = 20;
  private readonly MARGIN_RIGHT = 20;
  private readonly LINE_HEIGHT = 7;
  private readonly CONTENT_WIDTH = this.PAGE_WIDTH - this.MARGIN_LEFT - this.MARGIN_RIGHT;

  /**
   * Generates a PDF rent revision letter
   * @param data Letter data
   * @returns PDF as ArrayBuffer
   */
  generate(data: RentRevisionLetterData): ArrayBuffer {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    let yPosition = 20;

    // Landlord address (top left)
    yPosition = this.addLandlordAddress(pdf, data.landlord, yPosition);
    yPosition += 10;

    // Tenant address
    yPosition = this.addTenantAddress(pdf, data, yPosition);
    yPosition += 10;

    // Date and place
    yPosition = this.addDateAndPlace(pdf, data, yPosition);
    yPosition += 10;

    // Subject
    yPosition = this.addSubject(pdf, yPosition);
    yPosition += 8;

    // Salutation
    yPosition = this.addSalutation(pdf, data.tenant, yPosition);
    yPosition += 5;

    // Body
    yPosition = this.addBody(pdf, data, yPosition);

    // Convert to ArrayBuffer
    const pdfOutput = pdf.output('arraybuffer');
    return pdfOutput;
  }

  private addLandlordAddress(pdf: jsPDF, landlord: RentRevisionLetterData['landlord'], y: number): number {
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text(landlord.name, this.MARGIN_LEFT, y);
    y += this.LINE_HEIGHT;

    pdf.setFont('helvetica', 'normal');
    // Split address into multiple lines if needed
    const addressLines = pdf.splitTextToSize(landlord.address, this.CONTENT_WIDTH);
    pdf.text(addressLines, this.MARGIN_LEFT, y);
    y += addressLines.length * this.LINE_HEIGHT;

    return y;
  }

  private addTenantAddress(pdf: jsPDF, data: RentRevisionLetterData, y: number): number {
    pdf.setFontSize(11);
    pdf.text(`${data.tenant.firstName} ${data.tenant.lastName}`, this.MARGIN_LEFT, y);
    y += this.LINE_HEIGHT;

    pdf.text(data.property.name, this.MARGIN_LEFT, y);
    y += this.LINE_HEIGHT;

    pdf.text(data.property.address, this.MARGIN_LEFT, y);
    y += this.LINE_HEIGHT;

    pdf.text(`${data.property.postalCode} ${data.property.city}`, this.MARGIN_LEFT, y);
    y += this.LINE_HEIGHT;

    return y;
  }

  private addDateAndPlace(pdf: jsPDF, data: RentRevisionLetterData, y: number): number {
    pdf.setFontSize(11);
    const cityName = data.property.city.charAt(0).toUpperCase() + data.property.city.slice(1).toLowerCase();
    const dateStr = data.revision.date.toLocaleDateString('fr-FR');
    const dateLine = `à ${cityName}, le ${dateStr}`;

    pdf.text(dateLine, this.MARGIN_LEFT, y);
    y += this.LINE_HEIGHT;

    return y;
  }

  private addSubject(pdf: jsPDF, y: number): number {
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Objet : Révision annuelle du loyer', this.MARGIN_LEFT, y);
    pdf.setFont('helvetica', 'normal');
    y += this.LINE_HEIGHT;

    return y;
  }

  private addSalutation(pdf: jsPDF, tenant: RentRevisionLetterData['tenant'], y: number): number {
    pdf.setFontSize(11);
    pdf.text(`${tenant.firstName} ${tenant.lastName},`, this.MARGIN_LEFT, y);
    y += this.LINE_HEIGHT;

    return y;
  }

  private addBody(pdf: jsPDF, data: RentRevisionLetterData, y: number): number {
    pdf.setFontSize(11);
    const revision = data.revision;
    const newTotal = revision.newRent + revision.charges;

    // Paragraph 1
    const quarterText = revision.irlQuarter
      ? `l'Indice de Référence des Loyers de l'INSEE du ${revision.irlQuarter} de chaque année`
      : `l'Indice de Référence des Loyers de l'INSEE`;
    const para1 = `Conformément aux dispositions de votre bail, la valeur de votre loyer est indexée sur l'évolution de ${quarterText}.`;
    const lines1 = pdf.splitTextToSize(para1, this.CONTENT_WIDTH);
    pdf.text(lines1, this.MARGIN_LEFT, y);
    y += lines1.length * this.LINE_HEIGHT + 3;

    // Paragraph 2
    const para2 = `Récemment publié, cet indice s'établit désormais à ${revision.newIndex.toFixed(2)}.`;
    const lines2 = pdf.splitTextToSize(para2, this.CONTENT_WIDTH);
    pdf.text(lines2, this.MARGIN_LEFT, y);
    y += lines2.length * this.LINE_HEIGHT + 3;

    // Paragraph 3
    const para3 = "La formule de calcul de votre loyer est la suivante :";
    pdf.text(para3, this.MARGIN_LEFT, y);
    y += this.LINE_HEIGHT + 2;

    // Formula
    pdf.setFont('helvetica', 'italic');
    const formula = "Nouveau loyer hors charges = Loyer hors charges × (Nouvel indice / Ancien indice)";
    pdf.text(formula, this.MARGIN_LEFT + 5, y);
    pdf.setFont('helvetica', 'normal');
    y += this.LINE_HEIGHT + 3;

    // Paragraph 4
    const para4 = `En conséquence, le montant de votre nouveau loyer hors charges indexé est de ${revision.newRent.toFixed(2)} € :`;
    const lines4 = pdf.splitTextToSize(para4, this.CONTENT_WIDTH);
    pdf.text(lines4, this.MARGIN_LEFT, y);
    y += lines4.length * this.LINE_HEIGHT + 2;

    // Calculation
    pdf.setFont('helvetica', 'bold');
    const calculation = `${revision.newRent.toFixed(2)} = ${revision.currentRent.toFixed(2)} × (${revision.newIndex.toFixed(2)} / ${revision.oldIndex.toFixed(2)})`;
    pdf.text(calculation, this.MARGIN_LEFT + 5, y);
    pdf.setFont('helvetica', 'normal');
    y += this.LINE_HEIGHT + 5;

    // Paragraph 5
    const para5 = `En ajoutant vos charges actuelles (${revision.charges.toFixed(2)} €) nous obtenons votre nouveau loyer charges comprises : ${newTotal.toFixed(2)} €.`;
    const lines5 = pdf.splitTextToSize(para5, this.CONTENT_WIDTH);
    pdf.text(lines5, this.MARGIN_LEFT, y);
    y += lines5.length * this.LINE_HEIGHT + 3;

    // Paragraph 6
    const para6 = `Je vous remercie de bien vouloir appliquer cette augmentation lors du règlement de votre loyer de ${revision.effectiveMonth}.`;
    const lines6 = pdf.splitTextToSize(para6, this.CONTENT_WIDTH);
    pdf.text(lines6, this.MARGIN_LEFT, y);
    y += lines6.length * this.LINE_HEIGHT + 3;

    // Closing
    const tenantName = data.tenant.civility
      ? `${data.tenant.civility} ${data.tenant.firstName} ${data.tenant.lastName}`
      : `${data.tenant.firstName} ${data.tenant.lastName}`;
    const closing = `Je vous prie de bien vouloir agréer, ${tenantName}, l'expression de mes sentiments cordiaux.`;
    const linesClosing = pdf.splitTextToSize(closing, this.CONTENT_WIDTH);
    pdf.text(linesClosing, this.MARGIN_LEFT, y);
    y += linesClosing.length * this.LINE_HEIGHT + 8;

    // Signature
    const signature = data.landlord.managerName
      ? `${data.landlord.managerName}, gérant de ${data.landlord.name}`
      : data.landlord.name;
    pdf.text(signature, this.MARGIN_LEFT, y);

    return y;
  }
}
