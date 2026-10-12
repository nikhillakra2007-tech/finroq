import { render, screen } from '@testing-library/react';
import { Input } from './Input';

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Email" placeholder="Enter email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<Input label="Email" error="Invalid email" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid email');
  });

  it('shows helper text', () => {
    render(<Input label="Password" helperText="Must be 8+ characters" />);
    expect(screen.getByText('Must be 8+ characters')).toBeInTheDocument();
  });

  it('applies error styling', () => {
    render(<Input label="Email" error="Invalid" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveClass('border-danger-500');
  });

  it('forwards ref', () => {
    const ref = jest.fn();
    render(<Input label="Test" ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });
});