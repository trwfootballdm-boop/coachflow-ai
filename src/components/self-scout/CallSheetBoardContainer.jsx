import React, { useMemo } from 'react';
import { usePlayLibraryStore } from '@/lib/football-engine/playLibraryStore.js';
import BaseCallSheetBoard from './CallSheetBoard.jsx';

export default function CallSheetBoardContainer({ onOpenCall }) {
  const state = usePlayLibraryStore();

  const eligibleCalls = useMemo(
    () =>
      state.calls.filter(
        (call) => !call.archived && call.activation === 'callsheet'
      ),
    [state.calls]
  );

  const callSheet = useMemo(() => {
    return buildCallSheetFromLibrary(
      eligibleCalls,
      state.weekly.weekLabel,
      state.weekly.opponent
    );
  }, [eligibleCalls, state.weekly.opponent, state.weekly.weekLabel]);

  const lookup = useMemo(
    () => new Map(eligibleCalls.map((call) => [call.id, call])),
    [eligibleCalls]
  );

  return (
    <BaseCallSheetBoard
      callSheet={callSheet}
      onOpenPlay={(play) => {
        const source = lookup.get(play.playId);
        if (source) onOpenCall?.(source);
      }}
    />
  );
}

function buildCallSheetFromLibrary(calls, weekLabel, opponent) {
  const sections = [
    section('opening_script', 'Opening Script', takeCalls(calls, ['first_and_ten', 'base'], 10)),
    section('first_and_ten', '1st & 10', takeCalls(calls, ['first_and_ten', 'base'], 8)),
    section('second_short', '2nd Short', takeCalls(calls, ['second_short', 'shot'], 5)),
    section('second_medium', '2nd Medium', takeCalls(calls, ['second_medium'], 5)),
    section('second_long', '2nd Long', takeCalls(calls, ['second_long', 'screen'], 5)),
    section('third_short', '3rd Short', takeCalls(calls, ['third_short'], 5)),
    section('third_medium', '3rd Medium', takeCalls(calls, ['third_medium'], 5)),
    section('third_long', '3rd Long', takeCalls(calls, ['third_long'], 5)),
    section('fourth_short', '4th Short', takeCalls(calls, ['fourth_short', 'goal_line'], 3)),
    section('red_zone', 'Red Zone', takeCalls(calls, ['red_zone', 'goal_line'], 6)),
    section('backed_up', 'Backed Up', takeCalls(calls, ['backed_up'], 4)),
    section('two_minute', '2-Minute', takeCalls(calls, ['two_minute'], 6)),
    section('four_minute', '4-Minute', takeCalls(calls, ['four_minute'], 4)),
    section('shot_plays', 'Shot Plays', takeCalls(calls, ['shot'], 4)),
    section('zero_answers', 'Pressure Answers', takeCalls(calls, ['pressure'], 5)),
    section('favorites', 'Favorites', calls.slice(0, 6)),
    section('gimmicks', 'Gimmicks', []),
    section('notes', 'Notes', []),
  ];

  return {
    weekLabel,
    opponent,
    sections,
    summary: [
      'Call sheet is pulled only from callsheet-activated menu items.',
      'Opening script and situation boxes should reflect plays practiced exactly as called.',
      'Use the sheet as a decision surface, not a storage bin.',
    ],
  };
}

function section(bucket, label, calls) {
  return {
    bucket,
    label,
    plays: calls.map((call, index) => ({
      playId: call.id,
      playName: call.callName,
      concept: call.tags.length ? call.tags.join(' · ') : 'Base call',
      formation: call.formation,
      personnel: call.personnel,
      tags: call.tags,
      situations: call.situations,
      bestFor: call.situations.map(formatSituation),
      preferredLook: [],
      notes: call.notes ? [call.notes] : [],
      openerScore: bucket === 'opening_script' ? index + 1 : undefined,
    })),
    notes: [],
  };
}

function takeCalls(calls, situations, limit) {
  return calls.filter((call) => call.situations.some((s) => situations.includes(s))).slice(0, limit);
}

function formatSituation(value) {
  return value.replace(/_/g, ' ');
}