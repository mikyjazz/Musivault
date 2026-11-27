import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DistributionSection from './DistributionSection';
import type { CollectionStats } from '../../types/collection.types';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: { count?: number }) =>
            options?.count === undefined ? key : `${key}:${options.count}`,
    }),
}));

vi.mock('./DecadeChart', () => ({ default: () => null }));

const makeStats = (overrides: Partial<CollectionStats> = {}): CollectionStats => ({
    total: 3,
    formatCounts: { Vinyl: 2, CD: 1 },
    decadeCounts: { '1970s': 1, '1980s': 2 },
    genreCounts: { Jazz: 2, Rock: 1 },
    styleCounts: { Bop: 2, Modal: 1 },
    labelCounts: {},
    artistCounts: {},
    recentAdds: { thisWeek: 0, thisMonth: 0 },
    topArtist: null,
    topStyle: null,
    availableFormats: [],
    availableDecades: [],
    availableGenres: [],
    availableStyles: [],
    availableLabels: [],
    topLabel: null,
    totalValue: 0,
    itemsWithValue: 0,
    ...overrides,
});

describe('DistributionSection', () => {
    it('puts the genre breakdown between formats and styles', () => {
        render(<DistributionSection stats={makeStats()} />);

        expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
            'stats.byDecade',
            'stats.byFormat',
            'stats.byGenre',
            'stats.byStyle',
        ]);
    });

    it('measures genre shares against all genre tags, not the record count', () => {
        render(<DistributionSection stats={makeStats({ genreCounts: { Jazz: 3, Rock: 1 } })} />);

        expect(screen.getByText('75%')).toBeInTheDocument();
        expect(screen.getByText('25%')).toBeInTheDocument();
    });

    it('folds a long genre tail into an "other genres" row', () => {
        const genreCounts = Object.fromEntries(
            Array.from({ length: 9 }, (_, index) => [`Genre ${index + 1}`, index + 1])
        );

        render(<DistributionSection stats={makeStats({ genreCounts })} />);

        expect(screen.getByText('stats.otherGenres:1')).toBeInTheDocument();
    });
});
