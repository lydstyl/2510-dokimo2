/**
 * Service to generate rent revision letters (TXT and PDF)
 */

interface LetterData {
  landlordName: string;
  landlordAddress: string;
  tenantCivility?: string;
  tenantName: string;
  tenantAddress: string;
  propertyAddress: string;
  letterDate: string;
  oldIndex: string;
  newIndex: string;
  irlQuarter?: string;
  oldRent: number;
  newRent: number;
  oldCharges: number;
  newCharges: number;
  effectiveMonth: string;
}

export class RentRevisionLetterGenerator {
  /**
   * Generate TXT letter content
   */
  static generateTxtLetter(data: LetterData): string {
    const {
      landlordName,
      landlordAddress,
      tenantCivility = 'Madame, Monsieur',
      tenantName,
      tenantAddress,
      propertyAddress,
      letterDate,
      oldIndex,
      newIndex,
      irlQuarter,
      oldRent,
      newRent,
      oldCharges,
      newCharges,
      effectiveMonth,
    } = data;

    const formattedDate = new Date(letterDate).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const oldTotal = oldRent + oldCharges;
    const newTotal = newRent + newCharges;
    const increase = newTotal - oldTotal;
    const increasePercent = ((increase / oldTotal) * 100).toFixed(2);

    const quarterInfo = irlQuarter ? ` du ${irlQuarter}` : '';

    return `${landlordName}
${landlordAddress}

${tenantCivility} ${tenantName}
${tenantAddress}

                                                        Le ${formattedDate}

Objet : Révision annuelle du loyer

Lettre recommandée avec accusé de réception


${tenantCivility},

Par la présente, je vous informe de la révision annuelle du loyer de votre logement situé au ${propertyAddress}, conformément aux dispositions de l'article 17 d) de la loi n° 89-462 du 6 juillet 1989.

Rappel des éléments actuels :
- Loyer mensuel hors charges : ${oldRent.toFixed(2)} €
- Provision pour charges : ${oldCharges.toFixed(2)} €
- Total mensuel : ${oldTotal.toFixed(2)} €

Calcul de la révision :
La révision du loyer est calculée sur la base de l'évolution de l'indice de référence des loyers (IRL)${quarterInfo}.

- Ancien indice IRL : ${oldIndex}
- Nouvel indice IRL : ${newIndex}

Formule de calcul :
Nouveau loyer = (${oldRent.toFixed(2)} × ${newIndex}) / ${oldIndex} = ${newRent.toFixed(2)} €

Nouveaux montants à compter du ${effectiveMonth} :
- Loyer mensuel hors charges : ${newRent.toFixed(2)} €
- Provision pour charges : ${newCharges.toFixed(2)} €
- Total mensuel : ${newTotal.toFixed(2)} €

Augmentation : +${increase.toFixed(2)} € soit +${increasePercent}%

Cette révision prendra effet à compter du ${effectiveMonth}.

Pour toute question concernant cette révision, je reste à votre disposition.

Je vous prie d'agréer, ${tenantCivility}, l'expression de mes salutations distinguées.


${landlordName}


---
Information légale :
Conformément à l'article 17 d) de la loi n° 89-462 du 6 juillet 1989, la révision du loyer intervient chaque année à la date convenue entre les parties ou, à défaut, au terme de chaque année du contrat. L'indice de référence des loyers (IRL) est publié par l'INSEE.

Pour consulter les indices IRL : https://www.google.com/search?q=indice+IRL
`;
  }

  /**
   * Download TXT letter
   */
  static downloadTxtLetter(data: LetterData, filename?: string): void {
    const content = this.generateTxtLetter(data);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `revision-loyer-${data.tenantName.replace(/\s+/g, '-')}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Generate PDF letter (placeholder - would use a PDF library)
   */
  static async generatePdfLetter(data: LetterData): Promise<Blob> {
    // TODO: Implement PDF generation using jsPDF or similar
    // For now, return TXT as blob
    const content = this.generateTxtLetter(data);
    return new Blob([content], { type: 'application/pdf' });
  }

  /**
   * Download PDF letter
   */
  static async downloadPdfLetter(data: LetterData, filename?: string): Promise<void> {
    const blob = await this.generatePdfLetter(data);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `revision-loyer-${data.tenantName.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
