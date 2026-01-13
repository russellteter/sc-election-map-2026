import { render, screen } from '@testing-library/react';
import Legend from '@/components/Map/Legend';

describe('Legend Component', () => {
  it('renders all legend items', () => {
    render(<Legend />);

    expect(screen.getByText('Democrat Running')).toBeInTheDocument();
    expect(screen.getByText('Republican Running')).toBeInTheDocument();
    expect(screen.getByText('Both Parties (Contested)')).toBeInTheDocument();
    expect(screen.getByText('Filed (Party Unknown)')).toBeInTheDocument();
    expect(screen.getByText('No Candidates Yet')).toBeInTheDocument();
  });

  it('displays symbol indicators for accessibility', () => {
    render(<Legend />);

    // Check that symbols are present
    expect(screen.getByText('D')).toBeInTheDocument();
    expect(screen.getByText('R')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.getByText('?')).toBeInTheDocument();
    // Em dash for no candidates
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('has proper ARIA structure', () => {
    render(<Legend />);

    const list = screen.getByRole('list', { name: 'Map legend' });
    expect(list).toBeInTheDocument();

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(5);
  });

  it('applies custom className', () => {
    const { container } = render(<Legend className="custom-class" />);

    const legendContainer = container.querySelector('.custom-class');
    expect(legendContainer).toBeInTheDocument();
  });

  it('hides color blocks from screen readers', () => {
    const { container } = render(<Legend />);

    // Color blocks should have aria-hidden
    const colorBlocks = container.querySelectorAll('[aria-hidden="true"]');
    expect(colorBlocks.length).toBe(5); // One per legend item
  });
});
