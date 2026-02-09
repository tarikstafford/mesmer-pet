/**
 * US-TEST-024: MarketplaceCard Component Tests
 * Comprehensive test suite for pet marketplace card component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MarketplaceCard from '@/components/MarketplaceCard';

describe('MarketplaceCard Component', () => {
  // Default props for testing
  const defaultProps = {
    listingId: 'listing-123',
    petName: 'Fluffy',
    price: 100,
    sellerName: 'Alice',
    sellerId: 'seller-123',
    currentUserId: 'buyer-456',
    userCurrency: 200,
  };

  describe('Rendering', () => {
    it('renders the component without crashing', () => {
      render(<MarketplaceCard {...defaultProps} />);
      expect(screen.getByTestId('marketplace-card')).toBeInTheDocument();
    });

    it('displays the pet name correctly', () => {
      render(<MarketplaceCard {...defaultProps} />);
      expect(screen.getByText('Fluffy')).toBeInTheDocument();
    });

    it('displays the seller name correctly', () => {
      render(<MarketplaceCard {...defaultProps} />);
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('displays the seller label', () => {
      render(<MarketplaceCard {...defaultProps} />);
      expect(screen.getByText('Seller:')).toBeInTheDocument();
    });

    it('displays the price correctly', () => {
      render(<MarketplaceCard {...defaultProps} />);
      expect(screen.getByText('100 coins')).toBeInTheDocument();
    });

    it('displays price with correct formatting for large numbers', () => {
      render(<MarketplaceCard {...defaultProps} price={9999} />);
      expect(screen.getByText('9999 coins')).toBeInTheDocument();
    });

    it('displays the purchase button', () => {
      render(<MarketplaceCard {...defaultProps} />);
      expect(screen.getByTestId('purchase-button')).toBeInTheDocument();
    });

    it('renders with minimal required props', () => {
      const minimalProps = {
        listingId: 'listing-1',
        petName: 'Test Pet',
        price: 50,
        sellerName: 'Seller',
        sellerId: 'seller-1',
      };
      render(<MarketplaceCard {...minimalProps} />);
      expect(screen.getByText('Test Pet')).toBeInTheDocument();
    });
  });

  describe('Pet Image', () => {
    it('displays pet image when provided', () => {
      render(<MarketplaceCard {...defaultProps} petImage="/images/pet.png" />);
      const img = screen.getByAltText('Fluffy') as HTMLImageElement;
      expect(img).toBeInTheDocument();
      expect(img.src).toContain('/images/pet.png');
    });

    it('does not display image container when petImage is not provided', () => {
      render(<MarketplaceCard {...defaultProps} />);
      expect(screen.queryByAltText('Fluffy')).not.toBeInTheDocument();
    });

    it('uses pet name as alt text for image', () => {
      render(
        <MarketplaceCard
          {...defaultProps}
          petName="Sparky"
          petImage="/test.jpg"
        />
      );
      expect(screen.getByAltText('Sparky')).toBeInTheDocument();
    });
  });

  describe('Sold Indicator', () => {
    it('shows sold indicator when isSold is true', () => {
      render(<MarketplaceCard {...defaultProps} isSold={true} />);
      expect(screen.getByText('✓ Sold')).toBeInTheDocument();
    });

    it('does not show sold indicator when isSold is false', () => {
      render(<MarketplaceCard {...defaultProps} isSold={false} />);
      expect(screen.queryByText('✓ Sold')).not.toBeInTheDocument();
    });

    it('applies opacity styling when sold', () => {
      render(<MarketplaceCard {...defaultProps} isSold={true} />);
      const card = screen.getByTestId('marketplace-card');
      expect(card.className).toContain('opacity-60');
    });

    it('applies gray border when sold', () => {
      render(<MarketplaceCard {...defaultProps} isSold={true} />);
      const card = screen.getByTestId('marketplace-card');
      expect(card.className).toContain('border-gray-300');
    });

    it('shows "Sold Out" button text when sold', () => {
      render(<MarketplaceCard {...defaultProps} isSold={true} />);
      expect(screen.getByText('Sold Out')).toBeInTheDocument();
    });
  });

  describe('Purchase Button States', () => {
    it('enables purchase button when user has sufficient funds', () => {
      render(
        <MarketplaceCard {...defaultProps} userCurrency={200} price={100} />
      );
      const button = screen.getByTestId('purchase-button');
      expect(button).not.toBeDisabled();
    });

    it('disables purchase button when user has insufficient funds', () => {
      render(
        <MarketplaceCard {...defaultProps} userCurrency={50} price={100} />
      );
      const button = screen.getByTestId('purchase-button');
      expect(button).toBeDisabled();
    });

    it('shows "Insufficient Funds" text when user cannot afford', () => {
      render(
        <MarketplaceCard {...defaultProps} userCurrency={50} price={100} />
      );
      expect(screen.getByText('Insufficient Funds')).toBeInTheDocument();
    });

    it('disables purchase button when listing is sold', () => {
      render(<MarketplaceCard {...defaultProps} isSold={true} />);
      const button = screen.getByTestId('purchase-button');
      expect(button).toBeDisabled();
    });

    it('disables purchase button for own listing', () => {
      render(
        <MarketplaceCard
          {...defaultProps}
          currentUserId="seller-123"
          sellerId="seller-123"
        />
      );
      const button = screen.getByTestId('purchase-button');
      expect(button).toBeDisabled();
    });

    it('shows "Your Listing" text for own listing', () => {
      render(
        <MarketplaceCard
          {...defaultProps}
          currentUserId="seller-123"
          sellerId="seller-123"
        />
      );
      expect(screen.getByText('Your Listing')).toBeInTheDocument();
    });

    it('shows "Buy Now" text when purchase is possible', () => {
      render(<MarketplaceCard {...defaultProps} />);
      expect(screen.getByText('Buy Now')).toBeInTheDocument();
    });

    it('shows loading state when loading prop is true', () => {
      render(<MarketplaceCard {...defaultProps} loading={true} />);
      expect(screen.getByText('Purchasing...')).toBeInTheDocument();
    });

    it('disables button during loading', () => {
      render(<MarketplaceCard {...defaultProps} loading={true} />);
      const button = screen.getByTestId('purchase-button');
      expect(button).toBeDisabled();
    });
  });

  describe('Purchase Action', () => {
    it('calls onPurchase callback when purchase button is clicked', () => {
      const onPurchase = vi.fn();
      render(<MarketplaceCard {...defaultProps} onPurchase={onPurchase} />);
      const button = screen.getByTestId('purchase-button');
      fireEvent.click(button);
      expect(onPurchase).toHaveBeenCalledTimes(1);
      expect(onPurchase).toHaveBeenCalledWith('listing-123');
    });

    it('does not call onPurchase when button is disabled (insufficient funds)', () => {
      const onPurchase = vi.fn();
      render(
        <MarketplaceCard
          {...defaultProps}
          userCurrency={50}
          price={100}
          onPurchase={onPurchase}
        />
      );
      const button = screen.getByTestId('purchase-button');
      fireEvent.click(button);
      expect(onPurchase).not.toHaveBeenCalled();
    });

    it('does not call onPurchase when listing is sold', () => {
      const onPurchase = vi.fn();
      render(
        <MarketplaceCard {...defaultProps} isSold={true} onPurchase={onPurchase} />
      );
      const button = screen.getByTestId('purchase-button');
      fireEvent.click(button);
      expect(onPurchase).not.toHaveBeenCalled();
    });

    it('does not call onPurchase for own listing', () => {
      const onPurchase = vi.fn();
      render(
        <MarketplaceCard
          {...defaultProps}
          currentUserId="seller-123"
          sellerId="seller-123"
          onPurchase={onPurchase}
        />
      );
      const button = screen.getByTestId('purchase-button');
      fireEvent.click(button);
      expect(onPurchase).not.toHaveBeenCalled();
    });

    it('does not call onPurchase during loading', () => {
      const onPurchase = vi.fn();
      render(
        <MarketplaceCard {...defaultProps} loading={true} onPurchase={onPurchase} />
      );
      const button = screen.getByTestId('purchase-button');
      fireEvent.click(button);
      expect(onPurchase).not.toHaveBeenCalled();
    });

    it('handles missing onPurchase callback gracefully', () => {
      render(<MarketplaceCard {...defaultProps} />);
      const button = screen.getByTestId('purchase-button');
      expect(() => fireEvent.click(button)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero price correctly', () => {
      render(<MarketplaceCard {...defaultProps} price={0} />);
      expect(screen.getByText('0 coins')).toBeInTheDocument();
    });

    it('handles zero user currency correctly', () => {
      render(
        <MarketplaceCard {...defaultProps} userCurrency={0} price={100} />
      );
      expect(screen.getByText('Insufficient Funds')).toBeInTheDocument();
    });

    it('handles exact currency match (boundary)', () => {
      render(
        <MarketplaceCard {...defaultProps} userCurrency={100} price={100} />
      );
      const button = screen.getByTestId('purchase-button');
      expect(button).not.toBeDisabled();
      expect(screen.getByText('Buy Now')).toBeInTheDocument();
    });

    it('handles currency one less than price (boundary)', () => {
      render(
        <MarketplaceCard {...defaultProps} userCurrency={99} price={100} />
      );
      const button = screen.getByTestId('purchase-button');
      expect(button).toBeDisabled();
    });

    it('handles empty pet name', () => {
      render(<MarketplaceCard {...defaultProps} petName="" />);
      expect(screen.getByTestId('marketplace-card')).toBeInTheDocument();
    });

    it('handles empty seller name', () => {
      render(<MarketplaceCard {...defaultProps} sellerName="" />);
      expect(screen.getByTestId('marketplace-card')).toBeInTheDocument();
    });

    it('handles very long pet names', () => {
      const longName = 'A'.repeat(100);
      render(<MarketplaceCard {...defaultProps} petName={longName} />);
      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('handles very large prices', () => {
      render(<MarketplaceCard {...defaultProps} price={999999} />);
      expect(screen.getByText('999999 coins')).toBeInTheDocument();
    });

    it('handles undefined currentUserId', () => {
      const props = { ...defaultProps };
      delete (props as any).currentUserId;
      render(<MarketplaceCard {...props} />);
      const button = screen.getByTestId('purchase-button');
      expect(button).not.toBeDisabled();
    });

    it('handles undefined userCurrency (defaults to 0)', () => {
      const props = { ...defaultProps };
      delete (props as any).userCurrency;
      render(<MarketplaceCard {...props} price={100} />);
      expect(screen.getByText('Insufficient Funds')).toBeInTheDocument();
    });
  });

  describe('Styling and CSS Classes', () => {
    it('applies marketplace-card class', () => {
      render(<MarketplaceCard {...defaultProps} />);
      const card = screen.getByTestId('marketplace-card');
      expect(card.className).toContain('marketplace-card');
    });

    it('applies correct border color for active listing', () => {
      render(<MarketplaceCard {...defaultProps} isSold={false} />);
      const card = screen.getByTestId('marketplace-card');
      expect(card.className).toContain('border-purple-100');
    });

    it('applies hover scale effect for active listings', () => {
      render(<MarketplaceCard {...defaultProps} isSold={false} />);
      const card = screen.getByTestId('marketplace-card');
      expect(card.className).toContain('hover:scale-[1.02]');
    });

    it('does not apply hover scale for sold listings', () => {
      render(<MarketplaceCard {...defaultProps} isSold={true} />);
      const card = screen.getByTestId('marketplace-card');
      expect(card.className).not.toContain('hover:scale-[1.02]');
    });

    it('applies gradient text to price', () => {
      render(<MarketplaceCard {...defaultProps} />);
      const price = screen.getByText('100 coins');
      expect(price.className).toContain('bg-gradient-to-r');
      expect(price.className).toContain('text-transparent');
    });

    it('applies correct button styling for enabled state', () => {
      render(<MarketplaceCard {...defaultProps} />);
      const button = screen.getByTestId('purchase-button');
      expect(button.className).toContain('bg-gradient-to-r');
      expect(button.className).toContain('from-purple-500');
    });

    it('applies disabled styling for insufficient funds', () => {
      render(
        <MarketplaceCard {...defaultProps} userCurrency={50} price={100} />
      );
      const button = screen.getByTestId('purchase-button');
      expect(button.className).toContain('bg-gray-300');
    });
  });

  describe('Accessibility', () => {
    it('has descriptive text for all interactive elements', () => {
      render(<MarketplaceCard {...defaultProps} />);
      const button = screen.getByTestId('purchase-button');
      expect(button.textContent).toBeTruthy();
    });

    it('includes title attribute for insufficient funds button', () => {
      render(
        <MarketplaceCard {...defaultProps} userCurrency={50} price={100} />
      );
      const button = screen.getByTestId('purchase-button');
      expect(button).toHaveAttribute('title', 'Insufficient funds');
    });

    it('uses semantic HTML for pet name (h3)', () => {
      const { container } = render(<MarketplaceCard {...defaultProps} />);
      const heading = container.querySelector('h3.pet-name');
      expect(heading).toBeInTheDocument();
    });

    it('properly associates seller label with seller name', () => {
      render(<MarketplaceCard {...defaultProps} />);
      expect(screen.getByText('Seller:')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
  });

  describe('Multiple Instances', () => {
    it('renders multiple cards with different data', () => {
      const { rerender } = render(<MarketplaceCard {...defaultProps} />);
      expect(screen.getByText('Fluffy')).toBeInTheDocument();

      rerender(
        <MarketplaceCard
          {...defaultProps}
          listingId="listing-456"
          petName="Sparky"
        />
      );
      expect(screen.getByText('Sparky')).toBeInTheDocument();
    });

    it('maintains independent state for multiple cards', () => {
      const onPurchase1 = vi.fn();
      const onPurchase2 = vi.fn();

      const { container } = render(
        <div>
          <MarketplaceCard
            {...defaultProps}
            listingId="listing-1"
            onPurchase={onPurchase1}
          />
          <MarketplaceCard
            {...defaultProps}
            listingId="listing-2"
            onPurchase={onPurchase2}
          />
        </div>
      );

      const buttons = container.querySelectorAll('[data-testid="purchase-button"]');
      expect(buttons).toHaveLength(2);
    });
  });
});
