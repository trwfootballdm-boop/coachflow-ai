import type { LoggedPlay, FieldZone } from './liveTracker';

export interface TendencySplit {
  label: string;
  total: number;
  runPct: number;
  passPct: number;
  explosiveRate: number;
  successRate: number;
}

export interface ConceptEfficiency {
  concept: string;
  calls: number;
  avgYards: number;
  successRate: number;
  explosiveRate: number;
}

export interface TendencyAlert {
  label: string;
  tendencyPct: number;
  tendencyType: 'run' | 'pass';
  note: string;
}

export interface SelfScoutReport {
  sampleSize: number;
  overview: {
    runPct: number;
    passPct: number;
    explosiveRate: number;
    successRate: number;
  };
  byDownDistance: TendencySplit[];
  byFieldZone: TendencySplit[];
  byFormation: TendencySplit[];
  byPersonnel: TendencySplit[];
  conceptEfficiency: ConceptEfficiency[];
  alerts: TendencyAlert[];
  notes: string[];
}

function pct(n: number, d: number) {
  return d === 0 ? 0 : Math.round((n / d) * 1000) / 10;
}

function isRun(play: LoggedPlay) {
  return play.playType === 'run';
}

function isPass(play: LoggedPlay) {
  return ['pass', 'screen', 'play_action', 'rpo'].includes(play.playType);
}

function isExplosive(play: LoggedPlay) {
  return play.result.tags.includes('explosive');
}

function isSuccess(play: LoggedPlay) {
  if (play.result.tags.includes('success')) return true;

  if (play.down === 1) return play.result.yards >= Math.ceil(play.distance * 0.4);
  if (play.down === 2) return play.result.yards >= Math.ceil(play.distance * 0.6);
  return play.result.yards >= play.distance;
}

function bucketDownDistance(play: LoggedPlay) {
  if (play.down === 1) return '1st Down';
  if (play.down === 2) {
    if (play.distance <= 3) return '2nd & Short';
    if (play.distance <= 6) return '2nd & Medium';
    return '2nd & Long';
  }
  if (play.down === 3) {
    if (play.distance <= 3) return '3rd & Short';
    if (play.distance <= 6) return '3rd & Medium';
    return '3rd & Long';
  }
  return '4th Down';
}

function buildSplit(label: string, plays: LoggedPlay[]): TendencySplit {
  const runs = plays.filter(isRun).length;
  const passes = plays.filter(isPass).length;
  const explosives = plays.filter(isExplosive).length;
  const successes = plays.filter(isSuccess).length;

  return {
    label,
    total: plays.length,
    runPct: pct(runs, plays.length),
    passPct: pct(passes, plays.length),
    explosiveRate: pct(explosives, plays.length),
    successRate: pct(successes, plays.length),
  };
}

function groupBy<T extends string>(plays: LoggedPlay[], keyFn: (p: LoggedPlay) => T | undefined) {
  const map = new Map<string, LoggedPlay[]>();

  for (const play of plays) {
    const key = keyFn(play) || 'Unknown';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(play);
  }

  return [...map.entries()].map(([label, bucket]) => ({ label, plays: bucket }));
}

function buildTendencyAlerts(splits: TendencySplit[]): TendencyAlert[] {
  const alerts: TendencyAlert[] = [];

  for (const split of splits) {
    if (split.total < 4) continue;

    if (split.runPct >= 70) {
      alerts.push({
        label: split.label,
        tendencyPct: split.runPct,
        tendencyType: 'run',
        note: `${split.label} is run-heavy enough to flag as a likely tendency.`,
      });
    }

    if (split.passPct >= 70) {
      alerts.push({
        label: split.label,
        tendencyPct: split.passPct,
        tendencyType: 'pass',
        note: `${split.label} is pass-heavy enough to flag as a likely tendency.`,
      });
    }
  }

  return alerts;
}

export function buildSelfScoutReport(plays: LoggedPlay[]): SelfScoutReport {
  const sampleSize = plays.length;
  const overview = buildSplit('Overview', plays);

  const byDownDistance = groupBy(plays, bucketDownDistance).map((g) => buildSplit(g.label, g.plays));
  const byFieldZone = groupBy(plays, (p) => p.fieldZone as FieldZone).map((g) => buildSplit(g.label, g.plays));
  const byFormation = groupBy(plays, (p) => p.formation).map((g) => buildSplit(g.label, g.plays));
  const byPersonnel = groupBy(plays, (p) => p.personnel).map((g) => buildSplit(g.label, g.plays));

  const conceptEfficiency = groupBy(plays, (p) => p.concept).map(({ label, plays }) => ({
    concept: label,
    calls: plays.length,
    avgYards: Math.round((plays.reduce((sum, p) => sum + p.result.yards, 0) / Math.max(plays.length, 1)) * 10) / 10,
    successRate: pct(plays.filter(isSuccess).length, plays.length),
    explosiveRate: pct(plays.filter(isExplosive).length, plays.length),
  }));

  const alerts = [
    ...buildTendencyAlerts(byDownDistance),
    ...buildTendencyAlerts(byFieldZone),
    ...buildTendencyAlerts(byFormation),
    ...buildTendencyAlerts(byPersonnel),
  ].slice(0, 12);

  const notes: string[] = [];
  if (sampleSize < 15) {
    notes.push('Sample size is small; tendency alerts may be noisy.');
  }
  if (sampleSize >= 15) {
    notes.push('Use this report to compare weekly tendencies against season-long identity.');
  }

  return {
    sampleSize,
    overview: {
      runPct: overview.runPct,
      passPct: overview.passPct,
      explosiveRate: overview.explosiveRate,
      successRate: overview.successRate,
    },
    byDownDistance,
    byFieldZone,
    byFormation,
    byPersonnel,
    conceptEfficiency: conceptEfficiency.sort((a, b) => b.successRate - a.successRate),
    alerts,
    notes,
  };
}