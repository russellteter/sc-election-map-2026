import { render, screen, fireEvent } from '@testing-library/react';
import Legend from '@/components/Map/Legend';

describe('Legend Component', () => {
  it('renders all legend items', () => {
    render(<Legend />);

    expect(screen.getByText('Dem Incumbent')).toBeInTheDocument();
    expect(screen.getByText('Dem Challenger')).toBeInTheDocument();
    expect(screen.getByText('Close Race')).toBeInTheDocument();
    expect(screen.getByText('Safe R Seat')).toBeInTheDocument();
  });

  it('has proper ARIA structure', () => {
    render(<Legend />);

    const list = screen.getByRole('list', { name: 'District status legend' });
    expect(list).toBeInTheDocument();

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(4);
  });

  it('applies custom className', () => {
    const { container } = render(<Legend className="custom-class" />);

    const legendContainer = container.querySelector('.custom-class');
    expect(legendContainer).toBeInTheDocument();
  });

  it('shows descriptions for each legend item', () => {
    render(<Legend />);

    expect(screen.getByText('Current representative is Democrat')).toBeInTheDocument();
    expect(screen.getByText('Democrat filed to run')).toBeInTheDocument();
    expect(screen.getByText('No Dem filed, margin ≤15pts')).toBeInTheDocument();
    expect(screen.getByText('No Dem filed, margin >15pts')).toBeInTheDocument();
  });

  it('can be collapsed and expanded', () => {
    render(<Legend />);

    // Initially expanded
    const header = screen.getByRole('button', { name: /map legend/i });
    expect(header).toHaveAttribute('aria-expanded', 'true');

    // Collapse it
    fireEvent.click(header);
    expect(header).toHaveAttribute('aria-expanded', 'false');

    // Expand it again
    fireEvent.click(header);
    expect(header).toHaveAttribute('aria-expanded', 'true');
  });

  it('hides color indicators from screen readers', () => {
    const { container } = render(<Legend />);

    // Color spans should have aria-hidden
    const hiddenSpans = container.querySelectorAll('[aria-hidden="true"]');
    expect(hiddenSpans.length).toBe(4); // One per legend item
  });

  it('shows footnote about data source', () => {
    render(<Legend />);

    expect(screen.getByText(/SC Election Commission/)).toBeInTheDocument();
  });
});
