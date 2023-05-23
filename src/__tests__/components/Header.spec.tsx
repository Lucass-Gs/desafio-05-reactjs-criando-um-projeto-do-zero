import { render, screen } from '@testing-library/react';
import Header from '../../components/Header';

describe('Header', () => {
  it('should be able to render logo', () => {
    render(<Header />);
    screen.getByAltText('logo');
  });

  it('should navigate to home page after a click', () => {
    render(<Header />);
    const logoLink = screen.getByRole('link', { name: /logo/i });
    expect(logoLink).toHaveAttribute('href', '/');
  });
});
