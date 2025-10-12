export class Money {
  private constructor(private readonly amount: number) {
    if (amount < 0) {
      throw new Error('Money amount cannot be negative');
    }
  }

  static create(amount: number): Money {
    return new Money(amount);
  }

  getValue(): number {
    return this.amount;
  }

  add(other: Money): Money {
    return Money.create(this.amount + other.amount);
  }

  subtract(other: Money): Money {
    return Money.create(this.amount - other.amount);
  }

  isGreaterThan(other: Money): boolean {
    return this.amount > other.amount;
  }

  isLessThan(other: Money): boolean {
    return this.amount < other.amount;
  }

  equals(other: Money): boolean {
    return this.amount === other.amount;
  }
}
