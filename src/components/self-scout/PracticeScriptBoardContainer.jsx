import React, { useMemo } from 'react';
import { usePlayLibraryStore } from '@/lib/football-engine/playLibraryStore.js';
import BasePracticeScriptBoard from './PracticeScriptBoard.jsx';

export default function PracticeScriptBoardContainer({ onChange, onOpenCall }) {
  const state = usePlayLibraryStore();

  const eligibleCalls = useMemo(
    () =>
      state.calls.filter(
        (call) =>
          !call.archived &&
          (call.activation === 'installed' || call.activation === 'practiced')
      ),
    [state.calls]
  );

  const callById = useMemo(
    () => new Map(state.calls.map((call) => [call.id, call])),
    [state.calls]
  );

  const plan = useMemo(() => {
    return buildPracticePlan(eligibleCalls, state.weekly.weekLabel);
  }, [eligibleCalls, state.weekly.weekLabel]);

  const handleOpenEntry = (entry) => {
    const sourceCall = callById.get(entry.priorityId);
    if (sourceCall) onOpenCall?.(sourceCall);
  };

  return (
    <BasePracticeScriptBoard
      plan={plan}
      onChange={onChange}
      onOpenEntry={handleOpenEntry}
    />
  );
}

function buildPracticePlan(calls, weekLabel) {
  const practiced = calls.filter((call) => call.activation === 'practiced');
  const installed = calls.filter((call) => call.activation === 'installed');

  const prioritized = [...practiced, ...installed];

  const monday = prioritized.filter((call) =>
    hasSituation(call, ['base', 'first_and_ten', 'second_medium'])
  );
  const tuesday = prioritized.filter((call) =>
    hasSituation(call, ['third_short', 'third_medium', 'third_long', 'pressure'])
  );
  const wednesday = prioritized.filter((call) =>
    hasSituation(call, ['red_zone', 'goal_line', 'shot'])
  );
  const thursday = prioritized.filter((call) =>
    hasSituation(call, ['backed_up', 'two_minute', 'four_minute'])
  );

  return {
    weekSummary: [
      `${weekLabel}: installed and practiced menu only.`,
      'Monday emphasizes base menu and clean execution.',
      'Tuesday emphasizes conversion and pressure answers.',
      'Wednesday emphasizes scoring area and explosive complements.',
      'Thursday emphasizes situational polish and communication.',
    ],
    days: [
      buildDayPlan('monday', 'Base menu + early down install', monday),
      buildDayPlan('tuesday', '3rd down + pressure menu', tuesday),
      buildDayPlan('wednesday', 'Red zone + shot menu', wednesday),
      buildDayPlan('thursday', 'Situational polish', thursday),
    ],
    unscheduled: [],
  };
}

function buildDayPlan(day, focus, calls) {
  const indy = calls.slice(0, 3);
  const group = calls.slice(3, 6);
  const team = calls.slice(6, 10);
  const situational = calls.slice(10, 14);

  const periods = [
    {
      id: `${day}-indy`,
      day,
      periodType: 'indy',
      label: 'Indy / Teach',
      durationMinutes: 10,
      entries: indy.map((call) => toEntry(call, 'install')),
    },
    {
      id: `${day}-group`,
      day,
      periodType: 'group',
      label: 'Group / Routes + Fits',
      durationMinutes: 10,
      entries: group.map((call) => toEntry(call, 'rep')),
    },
    {
      id: `${day}-team`,
      day,
      periodType: 'team',
      label: 'Team',
      durationMinutes: 16,
      entries: team.map((call) => toEntry(call, 'rep')),
    },
    {
      id: `${day}-situational`,
      day,
      periodType: 'team',
      label: 'Situational Team',
      durationMinutes: 12,
      entries: situational.map((call) => toEntry(call, 'polish')),
    },
  ];

  return { day, focus, periods };
}

function toEntry(call, emphasis) {
  return {
    id: `practice-${call.id}`,
    title: call.callName,
    priorityId: call.id,
    source: 'gameplan',
    emphasis,
    coachingPoints: [
      `${call.formation} · ${call.personnel} personnel`,
      call.motion ? `Motion: ${call.motion}` : 'No tagged motion',
      `${call.situations.length} tagged situations`,
    ],
    linkedPlayIds: [call.id],
    notes: call.notes,
  };
}

function hasSituation(call, targets) {
  return call.situations.some((item) => targets.includes(item));
}