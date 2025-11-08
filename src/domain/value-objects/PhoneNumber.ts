/**
 * PhoneNumber Value Object
 * Handles phone number formatting following French format
 */
export class PhoneNumber {
  private constructor(private readonly value: string) {}

  /**
   * Format a phone number with spaces every 2 digits
   * Example: "0768349779" becomes "07 68 34 97 79"
   */
  static format(phone: string | null | undefined): string {
    if (!phone) return '';

    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // If empty after cleaning, return empty string
    if (cleaned.length === 0) return '';

    // Format with spaces every 2 digits
    const formatted = cleaned.match(/.{1,2}/g)?.join(' ') || cleaned;

    return formatted;
  }

  /**
   * Format name to uppercase (for last names)
   */
  static formatLastName(name: string | null | undefined): string {
    if (!name) return '';
    return name.toUpperCase();
  }
}
