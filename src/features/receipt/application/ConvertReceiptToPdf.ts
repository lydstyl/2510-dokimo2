import jsPDF from 'jspdf';
import { ReceiptContent } from './GenerateReceiptContent';

/**
 * Convert structured receipt content to PDF format
 * This renders the receipt identically to the TXT format
 */
export class ConvertReceiptToPdf {
  private readonly FONT_SIZE = 10;
  private readonly LINE_HEIGHT = 5;
  private readonly MARGIN_LEFT = 15;
  private readonly MARGIN_RIGHT = 195; // A4 width (210mm) - 15mm margin
  private readonly PAGE_WIDTH = 210; // A4 width in mm

  /**
   * Convert structured content to PDF
   */
  execute(content: ReceiptContent): Uint8Array {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Use monospace font for consistent layout with TXT
    doc.setFont('courier');
    doc.setFontSize(this.FONT_SIZE);

    let yPosition = 15;

    // Helper to add a line
    const addLine = (text: string, bold = false) => {
      if (bold) {
        doc.setFont('courier', 'bold');
      }
      doc.text(text, this.MARGIN_LEFT, yPosition);
      if (bold) {
        doc.setFont('courier', 'normal');
      }
      yPosition += this.LINE_HEIGHT;
    };

    // Helper to add blank line
    const addBlankLine = () => {
      yPosition += this.LINE_HEIGHT;
    };

    // Helper to draw a horizontal line
    const addHorizontalLine = () => {
      doc.setLineWidth(0.3);
      doc.line(this.MARGIN_LEFT, yPosition - 2, this.MARGIN_RIGHT, yPosition - 2);
      yPosition += this.LINE_HEIGHT;
    };

    // Header separator
    addHorizontalLine();
    addLine(`              ${content.title}`, true);
    addHorizontalLine();
    addBlankLine();

    // Period and date
    addLine(`Période : ${content.period}`);
    addLine(`Généré le : ${content.generatedDate}`);
    addBlankLine();
    addHorizontalLine();
    addBlankLine();

    // Tenants
    content.tenants.forEach((tenant, index) => {
      if (index > 0) addBlankLine();
      addLine(tenant.label, true);
      addLine(tenant.name);
      addLine(tenant.email);
      addLine(tenant.phone);
    });
    addBlankLine();

    // Property
    addLine('BIEN LOUÉ', true);
    addLine(content.property.name);
    addLine(content.property.address);
    addLine(`${content.property.postalCode} ${content.property.city}`);
    addBlankLine();
    addHorizontalLine();
    addBlankLine();

    // Rent details
    addLine('DÉTAILS DU LOYER', true);
    addBlankLine();

    if (content.receiptType === 'unpaid') {
      // Unpaid notice format
      addLine(`Loyer mensuel :                    ${content.rentDetails.monthlyRent.toFixed(2)} €`);
      addLine(`  • Loyer :                        ${content.rentDetails.rentAmount.toFixed(2)} €`);
      addLine(`  • Charges :                      ${content.rentDetails.chargesAmount.toFixed(2)} €`);
      addBlankLine();
      addLine('Montant payé :                     0,00 €');
      addBlankLine();
      addLine(`Solde antérieur (avant ce mois) :  ${content.rentDetails.balanceBefore.toFixed(2)} €`);
      addLine(`Solde dû après ce mois :           ${Math.abs(content.rentDetails.balanceAfter).toFixed(2)} €`);
    } else if (content.receiptType === 'full') {
      // Full receipt format
      addLine(`Loyer mensuel :                    ${content.rentDetails.monthlyRent.toFixed(2)} €`);
      addLine(`  • Loyer :                        ${content.rentDetails.rentAmount.toFixed(2)} €`);
      addLine(`  • Charges :                      ${content.rentDetails.chargesAmount.toFixed(2)} €`);
      addBlankLine();
      addLine(`Montant payé ce mois :             ${content.rentDetails.totalPaid.toFixed(2)} €`);
      addBlankLine();
      addLine(`Solde avant ce mois :              ${content.rentDetails.balanceBefore.toFixed(2)} €`);
      addLine(`Solde après ce mois :              ${content.rentDetails.balanceAfter.toFixed(2)} €`);
      addBlankLine();

      if (content.creditUsed) {
        addLine('UTILISATION DU CRÉDIT :', true);
        addLine(`Le loyer de ce mois a été intégralement réglé par imputation`);
        addLine(`sur le crédit existant de ${content.rentDetails.balanceBefore.toFixed(2)} €.`);
      } else {
        addLine('PAIEMENTS REÇUS :', true);
        content.payments.forEach((payment) => {
          const notesText = payment.notes ? ` (${payment.notes})` : '';
          addLine(`  • ${payment.date} : ${payment.amount.toFixed(2)} €${notesText}`);
        });
      }
    } else if (content.receiptType === 'partial') {
      // Partial payment format
      addLine(`Loyer mensuel dû :                 ${content.rentDetails.monthlyRent.toFixed(2)} €`);
      addLine(`  • Loyer :                        ${content.rentDetails.rentAmount.toFixed(2)} €`);
      addLine(`  • Charges :                      ${content.rentDetails.chargesAmount.toFixed(2)} €`);
      addBlankLine();
      addLine(`Montant payé ce mois :             ${content.rentDetails.totalPaid.toFixed(2)} €`);
      addLine(`Reste à payer :                    ${content.rentDetails.remainingDue!.toFixed(2)} €`);
      addBlankLine();
      addLine(`Solde avant ce mois :              ${content.rentDetails.balanceBefore.toFixed(2)} €`);
      addLine(`Solde après ce mois :              ${content.rentDetails.balanceAfter.toFixed(2)} €`);
      addBlankLine();

      if (content.creditUsed) {
        addLine('UTILISATION DU CRÉDIT :', true);
        addLine(`Le crédit existant de ${content.rentDetails.balanceBefore.toFixed(2)} € a été utilisé`);
        addLine(`pour régler partiellement le loyer de ce mois.`);
      } else {
        addLine('PAIEMENTS REÇUS :', true);
        content.payments.forEach((payment) => {
          const notesText = payment.notes ? ` (${payment.notes})` : '';
          addLine(`  • ${payment.date} : ${payment.amount.toFixed(2)} €${notesText}`);
        });
      }
    } else if (content.receiptType === 'overpayment') {
      // Overpayment format
      addLine(`Loyer mensuel dû :                 ${content.rentDetails.monthlyRent.toFixed(2)} €`);
      addLine(`  • Loyer :                        ${content.rentDetails.rentAmount.toFixed(2)} €`);
      addLine(`  • Charges :                      ${content.rentDetails.chargesAmount.toFixed(2)} €`);
      addBlankLine();
      addLine(`Montant payé :                     ${content.rentDetails.totalPaid.toFixed(2)} €`);
      addLine(`Excédent (trop-perçu) :            +${content.rentDetails.overpayment!.toFixed(2)} €`);
      addBlankLine();
      addLine(`Solde avant paiement :             ${content.rentDetails.balanceBefore.toFixed(2)} €`);
      addLine(`Solde après paiement :             +${content.rentDetails.balanceAfter.toFixed(2)} €`);
      addBlankLine();
      addLine('PAIEMENTS REÇUS :', true);
      content.payments.forEach((payment) => {
        const notesText = payment.notes ? ` (${payment.notes})` : '';
        addLine(`  • ${payment.date} : ${payment.amount.toFixed(2)} €${notesText}`);
      });
    }

    addBlankLine();
    addHorizontalLine();
    addBlankLine();

    // Attestation (split into lines for proper wrapping)
    const attestationLines = content.attestationText.split('\n');
    attestationLines.forEach(line => addLine(line));

    // Footer
    if (content.footerText) {
      addBlankLine();
      const footerLines = content.footerText.split('\n');
      footerLines.forEach(line => addLine(line));
    }

    addBlankLine();
    addHorizontalLine();

    // Return as Uint8Array
    return doc.output('arraybuffer') as unknown as Uint8Array;
  }
}
