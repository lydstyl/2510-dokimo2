import { ReceiptContent } from './GenerateReceiptContent';

/**
 * Convert structured receipt content to TXT format
 */
export class ConvertReceiptToTxt {
  execute(content: ReceiptContent): string {
    const lines: string[] = [];

    // Header
    lines.push('═══════════════════════════════════════════════════════');
    lines.push(`              ${content.title}`);
    lines.push('═══════════════════════════════════════════════════════');
    lines.push('');
    lines.push(`Période : ${content.period}`);
    lines.push(`Généré le : ${content.generatedDate}`);
    lines.push('');
    lines.push('─────────────────────────────────────────────────────');
    lines.push('');

    // Tenants
    content.tenants.forEach((tenant, index) => {
      if (index > 0) lines.push('');
      lines.push(tenant.label);
      lines.push(tenant.name);
      lines.push(tenant.email);
      lines.push(tenant.phone);
    });
    lines.push('');

    // Property
    lines.push('BIEN LOUÉ');
    lines.push(content.property.name);
    lines.push(content.property.address);
    lines.push(`${content.property.postalCode} ${content.property.city}`);
    lines.push('');
    lines.push('─────────────────────────────────────────────────────');
    lines.push('');

    // Rent details
    lines.push('DÉTAILS DU LOYER');
    lines.push('');

    if (content.receiptType === 'unpaid') {
      // Unpaid notice format
      lines.push(`Loyer mensuel :                    ${content.rentDetails.monthlyRent.toFixed(2)} €`);
      lines.push(`  • Loyer :                        ${content.rentDetails.rentAmount.toFixed(2)} €`);
      lines.push(`  • Charges :                      ${content.rentDetails.chargesAmount.toFixed(2)} €`);
      lines.push('');
      lines.push('Montant payé :                     0,00 €');
      lines.push('');
      lines.push(`Solde antérieur (avant ce mois) :  ${content.rentDetails.balanceBefore.toFixed(2)} €`);
      lines.push(`Solde dû après ce mois :           ${Math.abs(content.rentDetails.balanceAfter).toFixed(2)} €`);
    } else if (content.receiptType === 'full') {
      // Full receipt format
      lines.push(`Loyer mensuel :                    ${content.rentDetails.monthlyRent.toFixed(2)} €`);
      lines.push(`  • Loyer :                        ${content.rentDetails.rentAmount.toFixed(2)} €`);
      lines.push(`  • Charges :                      ${content.rentDetails.chargesAmount.toFixed(2)} €`);
      lines.push('');
      lines.push(`Montant payé ce mois :             ${content.rentDetails.totalPaid.toFixed(2)} €`);
      lines.push('');
      lines.push(`Solde avant ce mois :              ${content.rentDetails.balanceBefore.toFixed(2)} €`);
      lines.push(`Solde après ce mois :              ${content.rentDetails.balanceAfter.toFixed(2)} €`);
      lines.push('');

      if (content.creditUsed) {
        lines.push('UTILISATION DU CRÉDIT :');
        lines.push(`Le loyer de ce mois a été intégralement réglé par imputation`);
        lines.push(`sur le crédit existant de ${content.rentDetails.balanceBefore.toFixed(2)} €.`);
      } else {
        lines.push('PAIEMENTS REÇUS :');
        content.payments.forEach((payment) => {
          const notesText = payment.notes ? ` (${payment.notes})` : '';
          lines.push(`  • ${payment.date} : ${payment.amount.toFixed(2)} €${notesText}`);
        });
      }
    } else if (content.receiptType === 'partial') {
      // Partial payment format
      lines.push(`Loyer mensuel dû :                 ${content.rentDetails.monthlyRent.toFixed(2)} €`);
      lines.push(`  • Loyer :                        ${content.rentDetails.rentAmount.toFixed(2)} €`);
      lines.push(`  • Charges :                      ${content.rentDetails.chargesAmount.toFixed(2)} €`);
      lines.push('');
      lines.push(`Montant payé ce mois :             ${content.rentDetails.totalPaid.toFixed(2)} €`);
      lines.push(`Reste à payer :                    ${content.rentDetails.remainingDue!.toFixed(2)} €`);
      lines.push('');
      lines.push(`Solde avant ce mois :              ${content.rentDetails.balanceBefore.toFixed(2)} €`);
      lines.push(`Solde après ce mois :              ${content.rentDetails.balanceAfter.toFixed(2)} €`);
      lines.push('');

      if (content.creditUsed) {
        lines.push('UTILISATION DU CRÉDIT :');
        lines.push(`Le crédit existant de ${content.rentDetails.balanceBefore.toFixed(2)} € a été utilisé`);
        lines.push(`pour régler partiellement le loyer de ce mois.`);
      } else {
        lines.push('PAIEMENTS REÇUS :');
        content.payments.forEach((payment) => {
          const notesText = payment.notes ? ` (${payment.notes})` : '';
          lines.push(`  • ${payment.date} : ${payment.amount.toFixed(2)} €${notesText}`);
        });
      }
    } else if (content.receiptType === 'overpayment') {
      // Overpayment format
      lines.push(`Loyer mensuel dû :                 ${content.rentDetails.monthlyRent.toFixed(2)} €`);
      lines.push(`  • Loyer :                        ${content.rentDetails.rentAmount.toFixed(2)} €`);
      lines.push(`  • Charges :                      ${content.rentDetails.chargesAmount.toFixed(2)} €`);
      lines.push('');
      lines.push(`Montant payé :                     ${content.rentDetails.totalPaid.toFixed(2)} €`);
      lines.push(`Excédent (trop-perçu) :            +${content.rentDetails.overpayment!.toFixed(2)} €`);
      lines.push('');
      lines.push(`Solde avant paiement :             ${content.rentDetails.balanceBefore.toFixed(2)} €`);
      lines.push(`Solde après paiement :             +${content.rentDetails.balanceAfter.toFixed(2)} €`);
      lines.push('');
      lines.push('PAIEMENTS REÇUS :');
      content.payments.forEach((payment) => {
        const notesText = payment.notes ? ` (${payment.notes})` : '';
        lines.push(`  • ${payment.date} : ${payment.amount.toFixed(2)} €${notesText}`);
      });
    }

    lines.push('');
    lines.push('─────────────────────────────────────────────────────');
    lines.push('');

    // Attestation
    lines.push(content.attestationText);

    // Footer
    if (content.footerText) {
      lines.push('');
      lines.push(content.footerText);
    }

    lines.push('');
    lines.push('═══════════════════════════════════════════════════════');

    return lines.join('\n');
  }

  /**
   * Get filename for the TXT receipt
   */
  getFilename(content: ReceiptContent, month: string): string {
    switch (content.receiptType) {
      case 'unpaid':
        return `avis-impaye-${month}.txt`;
      case 'full':
        return `quittance-loyer-${month}.txt`;
      case 'partial':
        return `recu-partiel-${month}.txt`;
      case 'overpayment':
        return `recu-trop-percu-${month}.txt`;
    }
  }
}
