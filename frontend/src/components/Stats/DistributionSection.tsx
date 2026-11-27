import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import DecadeChart from './DecadeChart';
import BarBreakdown, { type BarBreakdownEntry } from './BarBreakdown';
import type { CollectionStats } from '../../types/collection.types';

interface DistributionSectionProps {
    stats: CollectionStats;
}

/** Genres and styles past this fold into a single "others" row rather than a long tail. */
const VISIBLE_BREAKDOWN_ENTRIES = 8;

const byCountDesc = (a: BarBreakdownEntry, b: BarBreakdownEntry) => b.count - a.count;

const toEntries = (counts: Record<string, number>): BarBreakdownEntry[] =>
    Object.entries(counts).map(([name, count]) => ({ name, count })).sort(byCountDesc);

const sumCounts = (counts: Record<string, number>): number =>
    Object.values(counts).reduce((sum, count) => sum + count, 0);

const foldEntries = (
    counts: Record<string, number>,
    otherLabel: (hiddenCount: number) => string
): BarBreakdownEntry[] => {
    const all = toEntries(counts);
    if (all.length <= VISIBLE_BREAKDOWN_ENTRIES) return all;

    const shown = all.slice(0, VISIBLE_BREAKDOWN_ENTRIES);
    const rest = all.slice(VISIBLE_BREAKDOWN_ENTRIES);
    return [
        ...shown,
        {
            name: otherLabel(rest.length),
            count: rest.reduce((sum, entry) => sum + entry.count, 0),
        },
    ];
};

const Panel: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-base-100 rounded-box shadow-panel p-4 md:p-6 flex flex-col gap-4">
        <h2 className="text-lg font-bold">{title}</h2>
        {children}
    </div>
);

/**
 * What the collection is actually made of.
 *
 * Replaces three tiles that counted distinct categories — "Formats: 5" says
 * nothing about a collection, the split does.
 */
const DistributionSection: React.FC<DistributionSectionProps> = ({ stats }) => {
    const { t } = useTranslation();

    const formats = useMemo(() => toEntries(stats.formatCounts), [stats.formatCounts]);

    const genres = useMemo(
        () => foldEntries(stats.genreCounts, (count) => t('stats.otherGenres', { count })),
        [stats.genreCounts, t]
    );

    const styles = useMemo(
        () => foldEntries(stats.styleCounts, (count) => t('stats.otherStyles', { count })),
        [stats.styleCounts, t]
    );

    // A record can carry several genres and styles at once, so those counts sum
    // past the collection size. Their shares are read against all tags of that
    // kind, not against every record.
    const genreTotal = useMemo(() => sumCounts(stats.genreCounts), [stats.genreCounts]);
    const styleTotal = useMemo(() => sumCounts(stats.styleCounts), [stats.styleCounts]);

    if (stats.total === 0) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-3">
                <Panel title={t('stats.byDecade')}>
                    <DecadeChart decadeCounts={stats.decadeCounts} />
                </Panel>
            </div>

            {formats.length > 0 && (
                <Panel title={t('stats.byFormat')}>
                    <BarBreakdown entries={formats} total={stats.total} />
                </Panel>
            )}

            {genres.length > 0 && (
                <Panel title={t('stats.byGenre')}>
                    <BarBreakdown entries={genres} total={genreTotal} />
                </Panel>
            )}

            {styles.length > 0 && (
                <Panel title={t('stats.byStyle')}>
                    <BarBreakdown entries={styles} total={styleTotal} />
                </Panel>
            )}
        </div>
    );
};

export default DistributionSection;
