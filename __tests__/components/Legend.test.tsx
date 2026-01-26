import { render, screen, fireEvent } from '@testing-library/react';
import Legend from '@/components/Map/Legend';
import { LENS_DEFINITIONS, DEFAULT_LENS, ALL_LENS_IDS, type LensId } from '@/types/lens';

describe('Legend Component', () => {
  // Get default lens definition for baseline tests
  const defaultLensDef = LENS_DEFINITIONS[DEFAULT_LENS];

  describe('Default lens (incumbents)', () => {
    it('renders all legend items for default lens', () => {
      render(<Legend />);

      // Verify all legend items from the default lens are rendered
      defaultLensDef.legendItems.forEach((item) => {
        expect(screen.getByText(item.label)).toBeInTheDocument();
      });
    });

    it('shows descriptions for each legend item', () => {
      render(<Legend />);

      defaultLensDef.legendItems.forEach((item) => {
        expect(screen.getByText(item.description)).toBeInTheDocument();
      });
    });

    it('shows correct footnote', () => {
      render(<Legend />);

      expect(screen.getByText(defaultLensDef.footnote)).toBeInTheDocument();
    });
  });

  describe('ARIA and accessibility', () => {
    it('has proper ARIA structure', () => {
      render(<Legend />);

      const list = screen.getByRole('list', { name: 'District status legend' });
      expect(list).toBeInTheDocument();

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(defaultLensDef.legendItems.length);
    });

    it('hides color indicators from screen readers', () => {
      const { container } = render(<Legend />);

      // Color swatches should have aria-hidden
      const hiddenSpans = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenSpans.length).toBe(defaultLensDef.legendItems.length);
    });
  });

  describe('Interactions', () => {
    it('can be collapsed and expanded', () => {
      render(<Legend />);

      // Button text includes lens label
      const header = screen.getByRole('button', { name: new RegExp(`${defaultLensDef.label} Legend`, 'i') });
      expect(header).toHaveAttribute('aria-expanded', 'true');

      // Collapse it
      fireEvent.click(header);
      expect(header).toHaveAttribute('aria-expanded', 'false');

      // Expand it again
      fireEvent.click(header);
      expect(header).toHaveAttribute('aria-expanded', 'true');
    });

    it('applies custom className', () => {
      const { container } = render(<Legend className="custom-class" />);

      const legendContainer = container.querySelector('.custom-class');
      expect(legendContainer).toBeInTheDocument();
    });
  });

  describe('All lenses', () => {
    it.each(ALL_LENS_IDS)('renders correct items for %s lens', (lensId: LensId) => {
      const lensDef = LENS_DEFINITIONS[lensId];
      render(<Legend activeLens={lensId} />);

      // Verify all legend items render
      lensDef.legendItems.forEach((item) => {
        expect(screen.getByText(item.label)).toBeInTheDocument();
      });

      // Verify footnote
      expect(screen.getByText(lensDef.footnote)).toBeInTheDocument();
    });

    it.each(ALL_LENS_IDS)('shows correct header for %s lens', (lensId: LensId) => {
      const lensDef = LENS_DEFINITIONS[lensId];
      render(<Legend activeLens={lensId} />);

      const header = screen.getByRole('button', { name: new RegExp(`${lensDef.label} Legend`, 'i') });
      expect(header).toBeInTheDocument();
    });

    it.each(ALL_LENS_IDS)('has correct number of list items for %s lens', (lensId: LensId) => {
      const lensDef = LENS_DEFINITIONS[lensId];
      render(<Legend activeLens={lensId} />);

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(lensDef.legendItems.length);
    });
  });
});
