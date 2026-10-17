import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navbar } from './Navbar';
import { AuthProvider } from '@/lib/auth-context';
import { I18nProvider } from '@/lib/i18n-context';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  usePathname: () => '/app/ai-assistant',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

describe('Navbar Navigation Simplification', () => {
  const renderNavbar = () =>
    render(
      <AuthProvider>
        <I18nProvider>
          <Navbar />
        </I18nProvider>
      </AuthProvider>
    );

  it('renders primary navigation with AI Copilot as first destination', () => {
    renderNavbar();

    // Verify AI Copilot is present with link to /app/ai-assistant
    const aiCopilotLinks = screen.getAllByRole('link', { name: /AI Copilot/i });
    expect(aiCopilotLinks.length).toBeGreaterThan(0);
    expect(aiCopilotLinks[0]).toHaveAttribute('href', '/app/ai-assistant');

    // Verify Overview link is present
    const overviewLinks = screen.getAllByRole('link', { name: /Overview/i });
    expect(overviewLinks.length).toBeGreaterThan(0);
    expect(overviewLinks[0]).toHaveAttribute('href', '/app/home');

    // Verify Ledger link is present
    const ledgerLinks = screen.getAllByRole('link', { name: /Ledger/i });
    expect(ledgerLinks.length).toBeGreaterThan(0);
    expect(ledgerLinks[0]).toHaveAttribute('href', '/app/expense-tracking');

    // Verify Budgets link is present
    const budgetsLinks = screen.getAllByRole('link', { name: /Budgets/i });
    expect(budgetsLinks.length).toBeGreaterThan(0);
    expect(budgetsLinks[0]).toHaveAttribute('href', '/app/budgeting');
  });

  it('renders Financial Tools dropdown and reveals secondary modules when clicked', () => {
    renderNavbar();

    const toolsButton = screen.getByRole('button', { name: /Financial Tools/i });
    expect(toolsButton).toBeInTheDocument();

    fireEvent.click(toolsButton);

    // Verify secondary tools are rendered in the dropdown
    expect(screen.getAllByText('Net Worth').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Debt Watchdog').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Credit Health').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pre-Spend Check').length).toBeGreaterThan(0);
  });

  it('toggles mobile menu drawer on mobile trigger click', () => {
    renderNavbar();

    const mobileToggle = screen.getByLabelText(/Toggle navigation menu/i);
    expect(mobileToggle).toBeInTheDocument();

    fireEvent.click(mobileToggle);
    expect(screen.getByRole('button', { name: /Toggle navigation menu/i })).toHaveAttribute('aria-expanded', 'true');
  });
});
