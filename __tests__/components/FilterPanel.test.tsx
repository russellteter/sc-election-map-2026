import { render, screen, fireEvent } from '@testing-library/react';
import FilterPanel, { defaultFilters, FilterState } from '@/components/Search/FilterPanel';

describe('FilterPanel Component', () => {
  const mockOnFilterChange = jest.fn();

  beforeEach(() => {
    mockOnFilterChange.mockClear();
  });

  describe('Horizontal variant (default)', () => {
    it('renders filter bar with label', () => {
      render(
        <FilterPanel
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByText('FILTERS')).toBeInTheDocument();
    });

    it('renders party dropdown', () => {
      render(
        <FilterPanel
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByText('PARTY')).toBeInTheDocument();
    });

    it('renders status dropdown', () => {
      render(
        <FilterPanel
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByText('STATUS')).toBeInTheDocument();
    });

    it('renders opportunity dropdown', () => {
      render(
        <FilterPanel
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByText('OPPORTUNITY')).toBeInTheDocument();
    });

    it('shows party options when party dropdown is opened', () => {
      render(
        <FilterPanel
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      // Find the party dropdown button (shows "All" by default)
      const partyButtons = screen.getAllByRole('button', { name: /all/i });
      const partyDropdown = partyButtons[0]; // First "All" is the party dropdown

      fireEvent.click(partyDropdown);

      expect(screen.getByText('Democrats')).toBeInTheDocument();
      expect(screen.getByText('Republicans')).toBeInTheDocument();
      expect(screen.getByText('Unknown Party')).toBeInTheDocument();
    });

    it('calls onFilterChange when party is selected', () => {
      render(
        <FilterPanel
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      // Open party dropdown
      const partyButtons = screen.getAllByRole('button', { name: /all/i });
      fireEvent.click(partyButtons[0]);

      // Select Democrats
      fireEvent.click(screen.getByText('Democrats'));

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        ...defaultFilters,
        party: ['Democratic'],
      });
    });

    it('shows reset button when filters are active', () => {
      const activeFilters: FilterState = {
        party: ['Democratic'],
        hasCandidate: 'all',
        contested: 'all',
        opportunity: [],
        showRepublicanData: false,
        republicanDataMode: 'none',
      };

      render(
        <FilterPanel
          filters={activeFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByRole('button', { name: /reset all/i })).toBeInTheDocument();
    });

    it('clears all filters when reset button is clicked', () => {
      const activeFilters: FilterState = {
        party: ['Democratic', 'Republican'],
        hasCandidate: 'yes',
        contested: 'yes',
        opportunity: ['HIGH_OPPORTUNITY'],
        showRepublicanData: true,
        republicanDataMode: 'all',
      };

      render(
        <FilterPanel
          filters={activeFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /reset all/i }));

      expect(mockOnFilterChange).toHaveBeenCalledWith(defaultFilters);
    });

    it('does not show reset button when no filters are active', () => {
      render(
        <FilterPanel
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.queryByRole('button', { name: /reset all/i })).not.toBeInTheDocument();
    });

    it('has More button for additional filters', () => {
      render(
        <FilterPanel
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByRole('button', { name: /more/i })).toBeInTheDocument();
    });

    it('shows race type options when More is clicked', () => {
      render(
        <FilterPanel
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /more/i }));

      expect(screen.getByText('Race Type')).toBeInTheDocument();
      expect(screen.getByText('All Races')).toBeInTheDocument();
      expect(screen.getByText('Contested')).toBeInTheDocument();
      expect(screen.getByText('Uncontested')).toBeInTheDocument();
    });

    it('shows Republican data toggle when More is clicked', () => {
      render(
        <FilterPanel
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /more/i }));

      expect(screen.getByText('Opposition Data')).toBeInTheDocument();
      expect(screen.getByText('Show Republican Data')).toBeInTheDocument();
    });
  });

  describe('Dropdown variant', () => {
    it('renders filter toggle button', () => {
      render(
        <FilterPanel
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          variant="dropdown"
        />
      );

      expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument();
    });

    it('expands panel when toggle button is clicked', () => {
      render(
        <FilterPanel
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          variant="dropdown"
        />
      );

      const toggleBtn = screen.getByRole('button', { name: /filters/i });
      expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(toggleBtn);

      expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
    });

    it('shows active filter count badge when filters are applied', () => {
      const activeFilters: FilterState = {
        party: ['Democratic', 'Republican'],
        hasCandidate: 'yes',
        contested: 'all',
        opportunity: [],
        showRepublicanData: false,
        republicanDataMode: 'none',
      };

      render(
        <FilterPanel
          filters={activeFilters}
          onFilterChange={mockOnFilterChange}
          variant="dropdown"
        />
      );

      // Count should be 3: 2 parties + 1 hasCandidate
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });
});
