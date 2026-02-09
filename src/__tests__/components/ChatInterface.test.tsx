import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatInterface from '@/components/ChatInterface';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock scrollIntoView (not available in JSDOM)
Element.prototype.scrollIntoView = vi.fn();

describe('ChatInterface', () => {
  const defaultProps = {
    petId: 'pet-123',
    petName: 'Fluffy',
    userId: 'user-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Rendering', () => {
    it('renders header with pet name', () => {
      render(<ChatInterface {...defaultProps} />);

      expect(screen.getByText('Chat with Fluffy')).toBeInTheDocument();
      expect(screen.getByText('Your AI companion is ready to talk!')).toBeInTheDocument();
    });

    it('renders input field with placeholder', () => {
      render(<ChatInterface {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message to Fluffy...');
      expect(input).toBeInTheDocument();
      expect(input).not.toBeDisabled();
    });

    it('renders send button', () => {
      render(<ChatInterface {...defaultProps} />);

      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeInTheDocument();
    });

    it('shows empty state message when no messages', () => {
      render(<ChatInterface {...defaultProps} />);

      expect(screen.getByText('💬')).toBeInTheDocument();
      expect(screen.getByText('Start a conversation with Fluffy!')).toBeInTheDocument();
      expect(screen.getByText('Your pet remembers your past interactions')).toBeInTheDocument();
    });

    it('shows keyboard hint', () => {
      render(<ChatInterface {...defaultProps} />);

      expect(screen.getByText('Press Enter to send, Shift+Enter for new line')).toBeInTheDocument();
    });
  });

  describe('User Input', () => {
    it('updates input value when typing', () => {
      render(<ChatInterface {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message to Fluffy...');
      fireEvent.change(input, { target: { value: 'Hello!' } });

      expect(input).toHaveValue('Hello!');
    });

    it('disables send button when input is empty', () => {
      render(<ChatInterface {...defaultProps} />);

      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeDisabled();
    });

    it('disables send button when input is only whitespace', () => {
      render(<ChatInterface {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message to Fluffy...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: '   ' } });
      expect(sendButton).toBeDisabled();
    });

    it('enables send button when input has text', () => {
      render(<ChatInterface {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message to Fluffy...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'Hello!' } });
      expect(sendButton).not.toBeDisabled();
    });
  });

  describe('Sending Messages', () => {
    it('sends message when send button is clicked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Woof! Hello!' }),
      });

      render(<ChatInterface {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message to Fluffy...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'Hello pet!' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            petId: 'pet-123',
            userId: 'user-123',
            message: 'Hello pet!',
          }),
        });
      });
    });

    it('sends message when Enter key is pressed', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Woof!' }),
      });

      render(<ChatInterface {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message to Fluffy...');

      fireEvent.change(input, { target: { value: 'Hello!' } });
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('does not send message when Shift+Enter is pressed', async () => {
      render(<ChatInterface {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message to Fluffy...');

      fireEvent.change(input, { target: { value: 'Hello!' } });
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('clears input after sending message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Woof!' }),
      });

      render(<ChatInterface {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message to Fluffy...') as HTMLInputElement;
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'Hello!' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('trims whitespace from message before sending', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Woof!' }),
      });

      render(<ChatInterface {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message to Fluffy...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: '  Hello!  ' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
          body: JSON.stringify({
            petId: 'pet-123',
            userId: 'user-123',
            message: 'Hello!',
          }),
        }));
      });
    });
  });

  describe('Message Display', () => {
    it('displays user message after sending', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Woof!' }),
      });

      render(<ChatInterface {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message to Fluffy...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'Hello!' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Hello!')).toBeInTheDocument();
      });
    });

    it('displays AI response after receiving', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Woof! Hello there!' }),
      });

      render(<ChatInterface {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message to Fluffy...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'Hello!' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Woof! Hello there!')).toBeInTheDocument();
      });
    });

    it('displays multiple messages in conversation order', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Response 1' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Response 2' }),
        });

      render(<ChatInterface {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message to Fluffy...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Send first message
      fireEvent.change(input, { target: { value: 'Message 1' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Message 1')).toBeInTheDocument();
      });

      // Send second message
      fireEvent.change(input, { target: { value: 'Message 2' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Message 2')).toBeInTheDocument();
        expect(screen.getByText('Response 2')).toBeInTheDocument();
      });
    });

    it('displays timestamp for each message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Woof!' }),
      });

      render(<ChatInterface {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message to Fluffy...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'Hello!' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        // Timestamps are rendered, check for time format pattern (e.g., "12:34 PM")
        const timestamps = screen.getAllByText(/\d{1,2}:\d{2}/);
        expect(timestamps.length).toBeGreaterThan(0);
      });
    });

    it('distinguishes between user and AI messages visually', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'AI response' }),
      });

      render(<ChatInterface {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message to Fluffy...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'User message' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        const userMessage = screen.getByText('User message').closest('div');
        const aiMessage = screen.getByText('AI response').closest('div');

        // User messages have blue background
        expect(userMessage).toHaveClass('bg-blue-500');
        // AI messages have gray background
        expect(aiMessage).toHaveClass('bg-gray-200');
      });
    });

    it('hides empty state message when messages exist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Woof!' }),
      });

      render(<ChatInterface {...defaultProps} />);

      // Initially shows empty state
      expect(screen.getByText('Start a conversation with Fluffy!')).toBeInTheDocument();

      const input = screen.getByPlaceholderText('Type a message to Fluffy...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'Hello!' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.queryByText('Start a conversation with Fluffy!')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator while waiting for response', async () => {
      mockFetch.mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ message: 'Woof!' }),
        }), 100))
      );

      render(<ChatInterface {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message to Fluffy...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'Hello!' } });
      fireEvent.click(sendButton);

      // Check for loading indicator (animated dots)
      await waitFor(() => {
        const loadingDots = screen.getAllByRole('generic').filter(el =>
          el.className.includes('animate-bounce')
        );
        expect(loadingDots.length).toBeGreaterThan(0);
      });
    });

    it('changes button text to "Sending..." during loading', async () => {
      mockFetch.mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ message: 'Woof!' }),
        }), 100))
      );

      render(<ChatInterface {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message to Fluffy...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'Hello!' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sending/i })).toBeInTheDocument();
      });
    });

    it('disables input and send button during loading', async () => {
      mockFetch.mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ message: 'Woof!' }),
        }), 100))
      );

      render(<ChatInterface {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message to Fluffy...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'Hello!' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(input).toBeDisabled();
        expect(sendButton).toBeDisabled();
      });
    });

    it('prevents sending another message while loading', async () => {
      mockFetch.mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ message: 'Woof!' }),
        }), 100))
      );

      render(<ChatInterface {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message to Fluffy...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'Hello!' } });
      fireEvent.click(sendButton);

      // Try to send another message
      fireEvent.change(input, { target: { value: 'Another message' } });
      fireEvent.click(sendButton);

      // Should only have called fetch once
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });

    it('hides loading indicator after response received', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Woof!' }),
      });

      render(<ChatInterface {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message to Fluffy...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'Hello!' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        const loadingDots = screen.queryAllByRole('generic').filter(el =>
          el.className.includes('animate-bounce')
        );
        expect(loadingDots.length).toBe(0);
      });
    });

    it('re-enables input and send button after response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Woof!' }),
      });

      render(<ChatInterface {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message to Fluffy...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'Hello!' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(input).not.toBeDisabled();
        // Button is disabled because input is empty after sending
        fireEvent.change(input, { target: { value: 'New message' } });
        expect(sendButton).not.toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when API returns error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to send message' }),
      });

      render(<ChatInterface {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message to Fluffy...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'Hello!' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to send message')).toBeInTheDocument();
      });
    });

    it('displays fallback message when API returns fallback response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          fallback: true,
          message: 'Sorry, I am feeling a bit tired right now.'
        }),
      });

      render(<ChatInterface {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message to Fluffy...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'Hello!' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Sorry, I am feeling a bit tired right now.')).toBeInTheDocument();
      });
    });

    it('displays network error message when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<ChatInterface {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message to Fluffy...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'Hello!' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Network error. Please check your connection and try again.')).toBeInTheDocument();
      });
    });

    it('clears previous error when sending new message', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Woof!' }),
        });

      render(<ChatInterface {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message to Fluffy...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      // First message fails
      fireEvent.change(input, { target: { value: 'Hello!' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Network error. Please check your connection and try again.')).toBeInTheDocument();
      });

      // Second message succeeds
      fireEvent.change(input, { target: { value: 'Hello again!' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.queryByText('Network error. Please check your connection and try again.')).not.toBeInTheDocument();
      });
    });

    it('still shows user message in UI even if API fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<ChatInterface {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message to Fluffy...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'Hello!' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Hello!')).toBeInTheDocument();
      });
    });
  });

  describe('Tutorial Integration', () => {
    it('updates tutorial step on first successful chat', async () => {
      mockLocalStorage.getItem.mockReturnValue('auth-token-123');
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Woof!' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      render(<ChatInterface {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message to Fluffy...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'Hello!' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/tutorial/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer auth-token-123',
          },
          body: JSON.stringify({ step: 'chat' }),
        });
      });
    });

    it('does not update tutorial if no auth token', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Woof!' }),
      });

      render(<ChatInterface {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message to Fluffy...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'Hello!' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1); // Only chat API, not tutorial
      });
    });

    it('does not update tutorial on subsequent messages', async () => {
      mockLocalStorage.getItem.mockReturnValue('auth-token-123');
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Woof 1!' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Woof 2!' }),
        });

      render(<ChatInterface {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message to Fluffy...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      // First message
      fireEvent.change(input, { target: { value: 'Hello!' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Woof 1!')).toBeInTheDocument();
      });

      mockFetch.mockClear();

      // Mock second message response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Woof 2!' }),
      });

      // Second message
      fireEvent.change(input, { target: { value: 'Hello again!' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Woof 2!')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Should only call chat API, not tutorial API
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
      expect(mockFetch).toHaveBeenCalledWith('/api/chat', expect.any(Object));
    });

    it.skip('handles tutorial update failure gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue('auth-token-123');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock chat API to succeed
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Woof!' }),
      });

      render(<ChatInterface {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message to Fluffy...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Now mock tutorial API to fail before sending the message
      mockFetch.mockRejectedValueOnce(new Error('Tutorial update failed'));

      fireEvent.change(input, { target: { value: 'Hello!' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Woof!')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Should still show the message even if tutorial update fails
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to update tutorial:', expect.any(Error));
      }, { timeout: 3000 });
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty API response gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: '' }),
      });

      render(<ChatInterface {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message to Fluffy...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'Hello!' } });
      fireEvent.click(sendButton);

      // Should not crash, message should be in the UI (empty string is valid)
      await waitFor(() => {
        expect(screen.getByText('Hello!')).toBeInTheDocument();
      });
    });

    it('handles long messages correctly', async () => {
      const longMessage = 'A'.repeat(500);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Got it!' }),
      });

      render(<ChatInterface {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message to Fluffy...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: longMessage } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(longMessage)).toBeInTheDocument();
      });
    });

    it('handles special characters in messages', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Got it! 😊' }),
      });

      render(<ChatInterface {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message to Fluffy...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      const specialMessage = 'Hello! @#$%^&*() 😊 <script>';
      fireEvent.change(input, { target: { value: specialMessage } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(specialMessage)).toBeInTheDocument();
      });
    });

    it.skip('handles rapid successive sends correctly', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Response 1' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Response 2' }),
        });

      render(<ChatInterface {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message to Fluffy...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Send first message
      fireEvent.change(input, { target: { value: 'Message 1' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Response 1')).toBeInTheDocument();
      });

      // Send second message
      fireEvent.change(input, { target: { value: 'Message 2' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Response 2')).toBeInTheDocument();
      });

      // Both messages and responses should be visible
      expect(screen.getByText('Message 1')).toBeInTheDocument();
      expect(screen.getByText('Message 2')).toBeInTheDocument();
    });
  });
});
