import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColourFilter } from '../../components/catalog/ColourFilter';

describe('ColourFilter (#191, FR002)', () => {
  it('should render nothing when there are no in-stock colours', () => {
    const { container } = render(<ColourFilter colours={[]} selected="" onChange={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();

    const { container: container2 } = render(
      <ColourFilter colours={undefined} selected="" onChange={vi.fn()} />
    );
    expect(container2).toBeEmptyDOMElement();
  });

  it('should show a swatch and count for each colour, marking the selected one', () => {
    render(
      <ColourFilter
        colours={[
          { name: 'Indigo', count: 4 },
          { name: 'Some Custom Dye', count: 1 },
        ]}
        selected="Indigo"
        onChange={vi.fn()}
      />
    );

    const indigo = screen.getByRole('button', { name: /Indigo/ });
    expect(indigo).toHaveAttribute('aria-pressed', 'true');
    expect(indigo).toHaveAttribute('title', 'Indigo (4)');

    const custom = screen.getByRole('button', { name: /Some Custom Dye/ });
    expect(custom).toHaveAttribute('aria-pressed', 'false');
    // Unknown colour names fall back to the neutral striped swatch.
    expect(custom.querySelector('.swatch-chip__dot--unknown')).toBeInTheDocument();
  });

  it('should select a colour on click and clear it when clicked again', async () => {
    const onChange = vi.fn();
    render(
      <ColourFilter colours={[{ name: 'Maroon', count: 2 }]} selected="" onChange={onChange} />
    );

    await userEvent.click(screen.getByRole('button', { name: /Maroon/ }));
    expect(onChange).toHaveBeenCalledWith('Maroon');

    onChange.mockClear();
    render(
      <ColourFilter
        colours={[{ name: 'Maroon', count: 2 }]}
        selected="Maroon"
        onChange={onChange}
      />
    );
    await userEvent.click(screen.getAllByRole('button', { name: /Maroon/ })[1]);
    expect(onChange).toHaveBeenCalledWith('');
  });
});
