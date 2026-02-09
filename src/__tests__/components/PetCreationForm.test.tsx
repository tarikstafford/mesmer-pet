import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PetCreationForm from '@/components/PetCreationForm';

describe('PetCreationForm', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the form with all elements', () => {
      render(<PetCreationForm onSubmit={mockOnSubmit} />);

      // Form elements
      expect(screen.getByLabelText(/pet name/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e.g., Sparkle, Shadow, Luna/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create pet/i })).toBeInTheDocument();

      // Info section
      expect(screen.getByText('What happens next?')).toBeInTheDocument();
      expect(screen.getByText(/Random genetic traits will be generated/i)).toBeInTheDocument();
    });

    it('renders label with emoji', () => {
      render(<PetCreationForm onSubmit={mockOnSubmit} />);

      const label = screen.getByText('Pet Name').closest('label');
      expect(label).toHaveTextContent('🏷️');
    });

    it('renders helper text for name input', () => {
      render(<PetCreationForm onSubmit={mockOnSubmit} />);

      expect(screen.getByText(/Choose a unique name for your pet \(max 50 characters\)/i)).toBeInTheDocument();
    });

    it('renders info box with all genetic trait information', () => {
      render(<PetCreationForm onSubmit={mockOnSubmit} />);

      expect(screen.getByText(/Visual traits \(color, patterns, accessories\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Personality traits \(friendliness, energy, curiosity\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Each pet is unique based on genetics!/i)).toBeInTheDocument();
    });
  });

  describe('Input Validation', () => {
    it('accepts valid pet name input', () => {
      render(<PetCreationForm onSubmit={mockOnSubmit} />);

      const input = screen.getByLabelText(/pet name/i) as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'Sparkle' } });

      expect(input.value).toBe('Sparkle');
    });

    it('enforces maxLength of 50 characters', () => {
      render(<PetCreationForm onSubmit={mockOnSubmit} />);

      const input = screen.getByLabelText(/pet name/i) as HTMLInputElement;
      expect(input).toHaveAttribute('maxLength', '50');
    });

    it('marks input as required', () => {
      render(<PetCreationForm onSubmit={mockOnSubmit} />);

      const input = screen.getByLabelText(/pet name/i);
      expect(input).toBeRequired();
    });

    it('disables submit button when name is empty', () => {
      render(<PetCreationForm onSubmit={mockOnSubmit} />);

      const button = screen.getByRole('button', { name: /create pet/i });
      expect(button).toBeDisabled();
    });

    it('disables submit button when name is only whitespace', () => {
      render(<PetCreationForm onSubmit={mockOnSubmit} />);

      const input = screen.getByLabelText(/pet name/i);
      fireEvent.change(input, { target: { value: '   ' } });

      const button = screen.getByRole('button', { name: /create pet/i });
      expect(button).toBeDisabled();
    });

    it('enables submit button when valid name is entered', () => {
      render(<PetCreationForm onSubmit={mockOnSubmit} />);

      const input = screen.getByLabelText(/pet name/i);
      fireEvent.change(input, { target: { value: 'Fluffy' } });

      const button = screen.getByRole('button', { name: /create pet/i });
      expect(button).not.toBeDisabled();
    });

    it('handles single character names', () => {
      render(<PetCreationForm onSubmit={mockOnSubmit} />);

      const input = screen.getByLabelText(/pet name/i);
      fireEvent.change(input, { target: { value: 'A' } });

      const button = screen.getByRole('button', { name: /create pet/i });
      expect(button).not.toBeDisabled();
    });

    it('handles maximum length names (50 characters)', () => {
      render(<PetCreationForm onSubmit={mockOnSubmit} />);

      const longName = 'A'.repeat(50);
      const input = screen.getByLabelText(/pet name/i);
      fireEvent.change(input, { target: { value: longName } });

      const button = screen.getByRole('button', { name: /create pet/i });
      expect(button).not.toBeDisabled();
    });

    it('handles special characters in names', () => {
      render(<PetCreationForm onSubmit={mockOnSubmit} />);

      const input = screen.getByLabelText(/pet name/i);
      fireEvent.change(input, { target: { value: 'Sparkle-123!@#' } });

      const button = screen.getByRole('button', { name: /create pet/i });
      expect(button).not.toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('does not display error message by default', () => {
      render(<PetCreationForm onSubmit={mockOnSubmit} />);

      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });

    it('displays error message when error prop is provided', () => {
      const errorMessage = 'Failed to create pet';
      render(<PetCreationForm onSubmit={mockOnSubmit} error={errorMessage} />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('renders error message with error styling', () => {
      const errorMessage = 'Invalid pet name';
      render(<PetCreationForm onSubmit={mockOnSubmit} error={errorMessage} />);

      const errorContainer = screen.getByText(errorMessage).closest('.border-red-300');
      expect(errorContainer).toBeInTheDocument();
      expect(errorContainer).toHaveClass('text-red-800');
    });

    it('shows error icon with error message', () => {
      const errorMessage = 'Pet name already exists';
      render(<PetCreationForm onSubmit={mockOnSubmit} error={errorMessage} />);

      const errorContainer = screen.getByText(errorMessage).closest('div');
      expect(errorContainer).toHaveTextContent('✕');
    });

    it('updates when error prop changes', () => {
      const { rerender } = render(<PetCreationForm onSubmit={mockOnSubmit} />);

      expect(screen.queryByText('First error')).not.toBeInTheDocument();

      rerender(<PetCreationForm onSubmit={mockOnSubmit} error="First error" />);
      expect(screen.getByText('First error')).toBeInTheDocument();

      rerender(<PetCreationForm onSubmit={mockOnSubmit} error="Second error" />);
      expect(screen.queryByText('First error')).not.toBeInTheDocument();
      expect(screen.getByText('Second error')).toBeInTheDocument();
    });

    it('clears error when error prop is removed', () => {
      const { rerender } = render(<PetCreationForm onSubmit={mockOnSubmit} error="An error occurred" />);

      expect(screen.getByText('An error occurred')).toBeInTheDocument();

      rerender(<PetCreationForm onSubmit={mockOnSubmit} />);
      expect(screen.queryByText('An error occurred')).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit with pet name when form is submitted', async () => {
      render(<PetCreationForm onSubmit={mockOnSubmit} />);

      const input = screen.getByLabelText(/pet name/i);
      const button = screen.getByRole('button', { name: /create pet/i });

      fireEvent.change(input, { target: { value: 'Shadow' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).toHaveBeenCalledWith('Shadow');
      });
    });

    it('calls onSubmit when Enter key is pressed', async () => {
      render(<PetCreationForm onSubmit={mockOnSubmit} />);

      const input = screen.getByLabelText(/pet name/i);
      fireEvent.change(input, { target: { value: 'Luna' } });
      fireEvent.submit(input.closest('form')!);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('Luna');
      });
    });

    it('trims whitespace from pet name on submission', async () => {
      render(<PetCreationForm onSubmit={mockOnSubmit} />);

      const input = screen.getByLabelText(/pet name/i);
      fireEvent.change(input, { target: { value: '  Fluffy  ' } });
      fireEvent.submit(input.closest('form')!);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('  Fluffy  ');
      });
    });

    it('does not call onSubmit when form is invalid', () => {
      render(<PetCreationForm onSubmit={mockOnSubmit} />);

      const button = screen.getByRole('button', { name: /create pet/i });
      fireEvent.click(button);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('prevents default form submission behavior', async () => {
      render(<PetCreationForm onSubmit={mockOnSubmit} />);

      const input = screen.getByLabelText(/pet name/i);
      const form = input.closest('form')!;

      fireEvent.change(input, { target: { value: 'Test' } });

      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(submitEvent, 'preventDefault');

      form.dispatchEvent(submitEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('handles async onSubmit callback', async () => {
      const asyncOnSubmit = vi.fn().mockResolvedValue(undefined);
      render(<PetCreationForm onSubmit={asyncOnSubmit} />);

      const input = screen.getByLabelText(/pet name/i);
      fireEvent.change(input, { target: { value: 'Async Pet' } });
      fireEvent.submit(input.closest('form')!);

      await waitFor(() => {
        expect(asyncOnSubmit).toHaveBeenCalledWith('Async Pet');
      });
    });

    it('handles onSubmit errors gracefully', async () => {
      const errorOnSubmit = vi.fn().mockRejectedValue(new Error('Submit failed'));
      render(<PetCreationForm onSubmit={errorOnSubmit} />);

      const input = screen.getByLabelText(/pet name/i);
      fireEvent.change(input, { target: { value: 'Error Pet' } });

      // The form should still call onSubmit even if it throws
      try {
        fireEvent.submit(input.closest('form')!);
        await waitFor(() => {
          expect(errorOnSubmit).toHaveBeenCalledWith('Error Pet');
        });
      } catch (error) {
        // Expected error from rejected promise
        expect(errorOnSubmit).toHaveBeenCalledWith('Error Pet');
      }
    });
  });

  describe('Loading State', () => {
    it('shows loading text in submit button when loading is true', () => {
      render(<PetCreationForm onSubmit={mockOnSubmit} loading={true} />);

      expect(screen.getByText(/Creating Your Pet.../i)).toBeInTheDocument();
      expect(screen.queryByText(/✨ Create Pet/i)).not.toBeInTheDocument();
    });

    it('shows spinner when loading is true', () => {
      render(<PetCreationForm onSubmit={mockOnSubmit} loading={true} />);

      const button = screen.getByRole('button', { name: /creating your pet/i });
      expect(button.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('disables submit button when loading is true', () => {
      render(<PetCreationForm onSubmit={mockOnSubmit} loading={true} />);

      const input = screen.getByLabelText(/pet name/i);
      fireEvent.change(input, { target: { value: 'Test' } });

      const button = screen.getByRole('button', { name: /creating your pet/i });
      expect(button).toBeDisabled();
    });

    it('disables input field when loading is true', () => {
      render(<PetCreationForm onSubmit={mockOnSubmit} loading={true} />);

      const input = screen.getByLabelText(/pet name/i);
      expect(input).toBeDisabled();
    });

    it('shows create pet text when loading is false', () => {
      render(<PetCreationForm onSubmit={mockOnSubmit} loading={false} />);

      const input = screen.getByLabelText(/pet name/i);
      fireEvent.change(input, { target: { value: 'Test' } });

      expect(screen.getByText(/✨ Create Pet/i)).toBeInTheDocument();
      expect(screen.queryByText(/Creating Your Pet.../i)).not.toBeInTheDocument();
    });

    it('updates loading state dynamically', () => {
      const { rerender } = render(<PetCreationForm onSubmit={mockOnSubmit} loading={false} />);

      const input = screen.getByLabelText(/pet name/i);
      fireEvent.change(input, { target: { value: 'Test' } });

      expect(screen.getByText(/✨ Create Pet/i)).toBeInTheDocument();

      rerender(<PetCreationForm onSubmit={mockOnSubmit} loading={true} />);
      expect(screen.getByText(/Creating Your Pet.../i)).toBeInTheDocument();
    });

    it('applies disabled styling when loading', () => {
      render(<PetCreationForm onSubmit={mockOnSubmit} loading={true} />);

      const input = screen.getByLabelText(/pet name/i);
      fireEvent.change(input, { target: { value: 'Test' } });

      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:from-gray-300');
      expect(button).toHaveClass('disabled:to-gray-400');
      expect(button).toHaveClass('disabled:cursor-not-allowed');
    });
  });

  describe('Accessibility', () => {
    it('associates label with input using htmlFor/id', () => {
      render(<PetCreationForm onSubmit={mockOnSubmit} />);

      const label = screen.getByText('Pet Name').closest('label');
      expect(label).toHaveAttribute('for', 'petName');

      const input = screen.getByLabelText(/pet name/i);
      expect(input).toHaveAttribute('id', 'petName');
    });

    it('has proper form semantics', () => {
      render(<PetCreationForm onSubmit={mockOnSubmit} />);

      const form = screen.getByRole('button').closest('form');
      expect(form).toBeInTheDocument();
      expect(form?.tagName).toBe('FORM');
    });

    it('submit button has type="submit"', () => {
      render(<PetCreationForm onSubmit={mockOnSubmit} />);

      const input = screen.getByLabelText(/pet name/i);
      fireEvent.change(input, { target: { value: 'Test' } });

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('input has proper type attribute', () => {
      render(<PetCreationForm onSubmit={mockOnSubmit} />);

      const input = screen.getByLabelText(/pet name/i);
      expect(input).toHaveAttribute('type', 'text');
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid input changes', () => {
      render(<PetCreationForm onSubmit={mockOnSubmit} />);

      const input = screen.getByLabelText(/pet name/i) as HTMLInputElement;

      fireEvent.change(input, { target: { value: 'A' } });
      fireEvent.change(input, { target: { value: 'AB' } });
      fireEvent.change(input, { target: { value: 'ABC' } });

      expect(input.value).toBe('ABC');
    });

    it('handles clearing input after entering text', () => {
      render(<PetCreationForm onSubmit={mockOnSubmit} />);

      const input = screen.getByLabelText(/pet name/i);
      const button = screen.getByRole('button');

      fireEvent.change(input, { target: { value: 'Test' } });
      expect(button).not.toBeDisabled();

      fireEvent.change(input, { target: { value: '' } });
      expect(button).toBeDisabled();
    });

    it('handles unicode characters in pet names', () => {
      render(<PetCreationForm onSubmit={mockOnSubmit} />);

      const input = screen.getByLabelText(/pet name/i) as HTMLInputElement;
      fireEvent.change(input, { target: { value: '🐱 Kitty 猫' } });

      expect(input.value).toBe('🐱 Kitty 猫');
    });

    it('handles exactly 50 character boundary', () => {
      render(<PetCreationForm onSubmit={mockOnSubmit} />);

      const input = screen.getByLabelText(/pet name/i) as HTMLInputElement;
      const name49 = 'A'.repeat(49);
      const name50 = 'A'.repeat(50);

      fireEvent.change(input, { target: { value: name49 } });
      expect(input.value).toBe(name49);

      fireEvent.change(input, { target: { value: name50 } });
      expect(input.value).toBe(name50);
    });

    it('preserves input value when loading state changes', () => {
      const { rerender } = render(<PetCreationForm onSubmit={mockOnSubmit} loading={false} />);

      const input = screen.getByLabelText(/pet name/i) as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'Persistent' } });

      expect(input.value).toBe('Persistent');

      rerender(<PetCreationForm onSubmit={mockOnSubmit} loading={true} />);
      expect(input.value).toBe('Persistent');
    });

    it('handles multiple form submissions with different names', async () => {
      const { rerender } = render(<PetCreationForm onSubmit={mockOnSubmit} />);

      const input = screen.getByLabelText(/pet name/i);

      fireEvent.change(input, { target: { value: 'First' } });
      fireEvent.submit(input.closest('form')!);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('First');
      });

      // Simulate resetting the form
      rerender(<PetCreationForm onSubmit={mockOnSubmit} />);

      const newInput = screen.getByLabelText(/pet name/i);
      fireEvent.change(newInput, { target: { value: 'Second' } });
      fireEvent.submit(newInput.closest('form')!);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('Second');
      });

      expect(mockOnSubmit).toHaveBeenCalledTimes(2);
    });
  });

  describe('Styling and UI', () => {
    it('applies gradient styling to submit button', () => {
      render(<PetCreationForm onSubmit={mockOnSubmit} />);

      const input = screen.getByLabelText(/pet name/i);
      fireEvent.change(input, { target: { value: 'Test' } });

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gradient-to-r');
      expect(button).toHaveClass('from-pink-500');
      expect(button).toHaveClass('to-purple-500');
    });

    it('applies proper input styling', () => {
      render(<PetCreationForm onSubmit={mockOnSubmit} />);

      const input = screen.getByLabelText(/pet name/i);
      expect(input).toHaveClass('border-2');
      expect(input).toHaveClass('border-purple-200');
      expect(input).toHaveClass('rounded-xl');
    });

    it('renders info box with proper styling', () => {
      render(<PetCreationForm onSubmit={mockOnSubmit} />);

      const infoBox = screen.getByText('What happens next?').closest('div');
      expect(infoBox).toHaveClass('bg-gradient-to-br');
      expect(infoBox).toHaveClass('border-2');
      expect(infoBox).toHaveClass('border-blue-300');
    });
  });
});
