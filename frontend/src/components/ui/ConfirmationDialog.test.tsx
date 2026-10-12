import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmationDialog } from './ConfirmationDialog';

describe('ConfirmationDialog', () => {
  it('renders title and message when open', () => {
    render(
      <ConfirmationDialog
        isOpen={true}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction?"
      />
    );
    expect(screen.getByText('Delete Transaction')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this transaction?')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <ConfirmationDialog
        isOpen={false}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        title="Hidden Title"
        message="Hidden Message"
      />
    );
    expect(screen.queryByText('Hidden Title')).not.toBeInTheDocument();
  });

  it('triggers onConfirm when confirm button is clicked', () => {
    const handleConfirm = jest.fn();
    render(
      <ConfirmationDialog
        isOpen={true}
        onClose={jest.fn()}
        onConfirm={handleConfirm}
        title="Confirm Action"
        message="Proceed?"
        confirmLabel="Yes, Delete"
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /yes, delete/i }));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('triggers onClose when cancel button is clicked', () => {
    const handleClose = jest.fn();
    render(
      <ConfirmationDialog
        isOpen={true}
        onClose={handleClose}
        onConfirm={jest.fn()}
        title="Cancel Action"
        message="Proceed?"
        cancelLabel="Dismiss"
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
