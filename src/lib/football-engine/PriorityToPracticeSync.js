const DEFAULT_DAY_FOCUS = {
  monday: 'Install and teach the week',
  tuesday: 'Heavy reps and core game-plan work',
  wednesday: 'Situational and pressure answers',
  thursday: 'Polish, review, and ready calls',
};

const DEFAULT_PERIOD_ORDER = {
  monday: [
    { type: 'indy', label: 'Indy', durationMinutes: 12 },
    { type: 'group', label: 'Group', durationMinutes: 12 },
    { type: 'team', label: 'Team Install', durationMinutes: 18 },
    { type: '7on7', label: '7-on-7', durationMinutes: 12 },
    { type: 'special', label: 'Special Situations', durationMinutes: 10 },
    { type: 'walkthrough', label: 'Walkthrough', durationMinutes: 10 },
  ],
  tuesday: [
    { type: 'indy', label: 'Indy', durationMinutes: 10 },
    { type: 'inside_run', label: 'Inside Run', durationMinutes: 12 },
    { type: 'group', label: 'Group', durationMinutes: 12 },
    { type: 'team', label: 'Team', durationMinutes: 20 },
    { type: '7on7', label: '7-on-7', durationMinutes: 12 },
    { type: 'red_zone', label: 'Red Zone', durationMinutes: 10 },
  ],
  wednesday: [
    { type: 'indy', label: 'Indy', durationMinutes: 10 },
    { type: 'third_down', label: '3rd Down', durationMinutes: 12 },
    { type: 'team', label: 'Team', durationMinutes: 18 },
    { type: 'two_minute', label: '2-Minute', durationMinutes: 10 },
    { type: 'backed_up', label: 'Backed Up', durationMinutes: 10 },
    { type: 'red_zone', label: 'Red Zone', durationMinutes: 10 },
  ],
  thursday: [
    { type: 'walkthrough', label: 'Walkthrough', durationMinutes: 12 },
    { type: 'team', label: 'Team Review', durationMinutes: 12 },
    { type: 'third_down', label: 'Money Downs', durationMinutes: 8 },
    { type: 'red_zone', label: 'Red Zone Review', durationMinutes: 8 },
    { type: 'special', label: 'Special Situations', durationMinutes: 8 },
  ],
};

const PERIOD_LABEL_MAP = {
  indy: 'indy',
  pod: 'group',
  group: 'group',
  'inside run': 'inside_run',
  '7-on-7': '7on7',
  team: 'team',
  'red zone': 'red_zone',
  '3rd down': 'third_down',
  '2-minute': 'two_minute',
  walkthrough: 'walkthrough',
  special: 'special',
};

function makeId(prefix) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizePeriodLabel(label) {
  return PERIOD_LABEL_MAP[label.trim().toLowerCase()] ?? null;
}

function priorityWeight(priority) {
  if (priority === 'high') return 3;
  if (priority === 'medium') return 2;
  return 1;
}

function statusWeight(status) {
  if (status === 'new') return 4;
  if (status === 'planned') return 3;
  if (status === 'repped') return 2;
  if (status === 'ready') return 1;
  return 0;
}

function pickDaysForPriority(item) {
  if (item.status === 'done') return [];
  if (item.priority === 'high') return ['monday', 'tuesday', 'wednesday', 'thursday'];
  if (item.priority === 'medium') return ['monday', 'tuesday', 'wednesday'];
  return ['tuesday', 'wednesday'];
}

function emphasisForDay(day) {
  if (day === 'monday') return 'install';
  if (day === 'tuesday') return 'rep';
  if (day === 'wednesday') return 'review';
  return 'polish';
}

function defaultCoachingPoints(item, day) {
  const points = [];

  if (day === 'monday') points.push('Teach core rules and communication.');
  if (day === 'tuesday') points.push('Rep versus primary opponent looks at full speed.');
  if (day === 'wednesday') points.push('Stress situational execution and adjustments.');
  if (day === 'thursday') points.push('Polish tempo, communication, and confidence.');

  if (item.source === 'self_scout') points.push('Break the tendency without losing core identity.');
  if (item.category === 'callsheet') points.push('Tie this emphasis directly to game-day call sheet notes.');
  if (item.category === 'personnel') points.push('Confirm player assignments and substitution clarity.');

  return points;
}

function inferPeriods(item) {
  const explicit = (item.periods || [])
    .map(normalizePeriodLabel)
    .filter(Boolean);

  if (explicit.length) return explicit;

  if (item.category === 'install') return ['indy', 'group', 'team'];
  if (item.category === 'practice') return ['group', 'team'];
  if (item.category === 'callsheet') return ['team', 'third_down', 'red_zone'];
  if (item.category === 'personnel') return ['group', 'team'];
  if (item.category === 'film') return ['walkthrough'];

  return ['team'];
}

function buildEntry(item, day) {
  return {
    id: makeId('entry'),
    title: item.title,
    priorityId: item.id,
    source: item.source,
    emphasis: emphasisForDay(day),
    coachingPoints: defaultCoachingPoints(item, day),
    linkedPlayIds: item.linkedPlayIds || [],
    notes: item.notes,
  };
}

function createEmptyPlan() {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday'].map((day) => ({
    day,
    focus: DEFAULT_DAY_FOCUS[day],
    periods: DEFAULT_PERIOD_ORDER[day].map((period) => ({
      id: makeId(`${day}-${period.type}`),
      day,
      periodType: period.type,
      label: period.label,
      durationMinutes: period.durationMinutes,
      entries: [],
    })),
  }));

  return {
    weekSummary: [],
    days,
    unscheduled: [],
  };
}

function sortPriorities(items) {
  return [...items].sort((a, b) => {
    const aScore = priorityWeight(a.priority) * 10 + statusWeight(a.status);
    const bScore = priorityWeight(b.priority) * 10 + statusWeight(b.status);
    return bScore - aScore;
  });
}

function findPeriod(dayPlan, periodType) {
  return dayPlan.periods.find((p) => p.periodType === periodType);
}

function dedupeEntries(entries) {
  const seen = new Set();
  const next = [];

  for (const entry of entries) {
    const key = `${entry.priorityId}-${entry.emphasis}`;
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(entry);
  }

  return next;
}

function buildWeekSummary(plan, priorities) {
  const total = priorities.length;
  const high = priorities.filter((p) => p.priority === 'high' && p.status !== 'done').length;
  const selfScout = priorities.filter((p) => p.source === 'self_scout' && p.status !== 'done').length;
  const unscheduled = plan.unscheduled.length;

  return [
    `Synced ${total - unscheduled} of ${total} priorities into the weekly practice structure.`,
    `${high} active high-priority items were distributed across the week.`,
    `${selfScout} active self-scout items were carried into practice planning.`,
    unscheduled > 0
      ? `${unscheduled} priorities still need manual scheduling.`
      : 'All active priorities were assigned to at least one practice period.',
  ];
}

export function syncPrioritiesToPractice(priorities) {
  const plan = createEmptyPlan();
  const sorted = sortPriorities(priorities);

  for (const item of sorted) {
    const targetDays = pickDaysForPriority(item);
    const targetPeriods = inferPeriods(item);

    if (!targetDays.length) continue;

    let scheduledAtLeastOnce = false;

    for (const day of targetDays) {
      const dayPlan = plan.days.find((d) => d.day === day);
      if (!dayPlan) continue;

      for (const periodType of targetPeriods) {
        const period = findPeriod(dayPlan, periodType);
        if (!period) continue;

        period.entries.push(buildEntry(item, day));
        scheduledAtLeastOnce = true;

        if (item.priority === 'low') break;
      }
    }

    if (!scheduledAtLeastOnce) {
      plan.unscheduled.push(item);
    }
  }

  for (const dayPlan of plan.days) {
    for (const period of dayPlan.periods) {
      period.entries = dedupeEntries(period.entries);
    }
  }

  plan.weekSummary = buildWeekSummary(plan, priorities);
  return plan;
}