import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Hello from '../Hello';

describe('Hello component', () => {
    it('renders correctly', () => {
        const { getByText } = render(<Hello />);
        expect(getByText('Hello, World!')).toBeInTheDocument();
    });
});