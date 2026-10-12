import { formatCurrency, formatDate, getAccountTypeLabel, getTransactionTypeColor, getTransactionTypeBg } from './utils';

describe('formatCurrency', () => {
  it('formats positive numbers', () => {
    expect(formatCurrency('1000')).toBe('$1,000.00');
    expect(formatCurrency('1000.50')).toBe('$1,000.50');
    expect(formatCurrency(1000)).toBe('$1,000.00');
  });

  it('formats with different currencies', () => {
    expect(formatCurrency('1000', 'EUR')).toBe('€1,000.00');
    expect(formatCurrency('1000', 'GBP')).toBe('£1,000.00');
  });

  it('handles zero', () => {
    expect(formatCurrency('0')).toBe('$0.00');
  });
});

describe('formatDate', () => {
  it('formats ISO date strings', () => {
    const result = formatDate('2024-01-15T10:30:00Z');
    expect(result).toMatch(/Jan 15, 2024/);
  });
});

describe('getAccountTypeLabel', () => {
  it('returns correct labels', () => {
    expect(getAccountTypeLabel('checking')).toBe('Checking');
    expect(getAccountTypeLabel('savings')).toBe('Savings');
    expect(getAccountTypeLabel('credit')).toBe('Credit Card');
    expect(getAccountTypeLabel('investment')).toBe('Investment');
    expect(getAccountTypeLabel('cash')).toBe('Cash');
    expect(getAccountTypeLabel('other')).toBe('Other');
    expect(getAccountTypeLabel('unknown')).toBe('unknown');
  });
});

describe('getTransactionTypeColor', () => {
  it('returns correct colors', () => {
    expect(getTransactionTypeColor('income')).toBe('text-success-600');
    expect(getTransactionTypeColor('expense')).toBe('text-danger-600');
  });
});

describe('getTransactionTypeBg', () => {
  it('returns correct backgrounds', () => {
    expect(getTransactionTypeBg('income')).toBe('bg-success-50');
    expect(getTransactionTypeBg('expense')).toBe('bg-danger-50');
  });
});