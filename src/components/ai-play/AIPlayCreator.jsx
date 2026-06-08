import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useTeam } from '@/components/TeamContext';
import { toast } from 'sonner';
import {
  Wand2, X, ChevronDown, ChevronUp, RotateCcw,
  Loader2, Sparkles, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import AIPlayReview from './AIPlayReview';

const SAMPLE_PROMPTS = [
  'I Right power to the right with FB lead block',
  'Shotgun Trips Right flood route combo with backside hitch',
  'Double Wing wedge left with pulling guards',
  '6-2 edge blitz left with corners in contain',
  'Goal line power pass right — fake to FB, QB bootleg',
  'Kickoff return middle wedge',
  'I Right sweep left with reverse pivot fake',
  '5-3 outside blitz right with free safety alley fit',
];

const HELPER_OPTIONS = {
  side_of_ball: ['offense', 'defense', 'special_teams'],
  formation_family: ['i_formation', 'spread_2x2', 'spread_trips', 'wing_t', 'goal_line', 'six_two', 'five_three'],
  direction: ['left', 'right', 'middle'],
  age_level: ['youth', 'middle_school', 'high_school'],
  complexity_level: ['simple', 'moderate', 'advanced'],
};

const FORMATION_LABELS = {
  i_formation: 'I-Formation',
  spread_2x2: 'Spread 2x2',
  spread_trips: 'Spread Trips',
  wing_t: 'Wing-T / Double Wing',
  goal_line: 'Goal Line',
  six_two: '6-2 Defense',
  five_three: '5-3 Defense',
};

export default function AIPlayCreator({ onClose, initialPrompt = '' }) {
  const navigate = useNavigate();
  const { activeTeamId } = useTeam();

  const [prompt, setPrompt]           = useState(initialPrompt);
  const [showHelpers, setShowHelpers] = useState(false);
  const [helpers, setHelpers]         = useState({
    side_of_ball: '', formation_family: '', play_family: '',
    concept: '', direction: '', age_level: 'youth',
    complexity_level: 'simple', include_animation: true,
  });

  const [status, setStatus]     = useState('idle'); // idle | generating | review | saving
  const [generated, setGenerated] = useState(null);
  const [error, setError]       = useState(null);

  const textRef = useRef(null);

  const setHelper = (k, v) => setHelpers(h => ({ ...h, [k]: v }));

  // ── Generate ─────────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!prompt.trim() && !helpers.play_family) {
      setError('Enter a play description or fill in the helper fields below.');
      return;
    }
    setError(null);
    setStatus('generating');

    const res = await base44.functions.invoke('generatePlay', {
      prompt: prompt.trim(),
      ...Object.fromEntries(Object.entries(helpers).filter(([, v]) => v !== '')),
    });

    if (res.data?.success && res.data?.generated) {
      setGenerated(res.data.generated);
      setStatus('review');
    } else {
      setError(res.data?.error || 'Generation failed. Try rephrasing your prompt.');
      setStatus('idle');
    }
  };

  // ── Save play ─────────────────────────────────────────────────────────────────
  const handleSave = async (editedResult, saveMode) => {
    setStatus('saving');
    const { play_meta, diagram, assignments } = editedResult;

    const payload = {
      team_id: activeTeamId,
      name: play_meta.name,
      play_name: play_meta.name,
      short_name: play_meta.short_name,
      side: play_meta.side || 'offense',
      run_pass: play_meta.run_pass,
      play_type: play_meta.play_type,
      play_family: play_meta.play_family,
      formation: play_meta.formation,
      concept: play_meta.concept,
      direction: play_meta.direction,
      strength: play_meta.strength,
      personnel: play_meta.personnel,
      risk_level: play_meta.risk_level || 'medium',
      age_level_difficulty: play_meta.age_level_difficulty || 'youth',
      down_distance_tags: play_meta.down_distance_tags || [],
      field_zone_tags: play_meta.field_zone_tags || [],
      tags: play_meta.tags || [],
      coaching_points: play_meta.coaching_points,
      notes: play_meta.notes,
      is_active: saveMode !== 'draft' ? true : false,
      version: 1,
      diagram_data: {
        players: diagram?.players || [],
        paths: diagram?.paths || [],
        annotations: diagram?.annotations || [],
      },
    };

    const saved = await base44.entities.Play.create(payload);

    // Save assignments as PlayAssignment records
    if (assignments?.length && saved?.id) {
      const assignRecords = assignments.map((a, i) => ({
        play_id: saved.id,
        position_code: a.position_code,
        assignment_type: a.assignment_type,
        assignment_text: a.assignment_text,
        aiming_point: a.aiming_point || '',
        read_key: a.read_key || '',
        order_index: i,
      }));
      await Promise.all(assignRecords.map(r => base44.entities.PlayAssignment.create(r)));
    }

    setStatus('idle');
    toast.success(saveMode === 'designer' ? 'Play created — opening in Designer…' : 'Play saved to library');

    if (saveMode === 'designer' && saved?.id) {
      onClose?.();
      navigate(`/play-designer?id=${saved.id}`);
    } else {
      onClose?.();
    }
  };

  const handleRegenerate = () => {
    setGenerated(null);
    setStatus('idle');
  };

  // ── Review screen ─────────────────────────────────────────────────────────────
  if (status === 'review' || status === 'saving') {
    return (
      <AIPlayReview
        generated={generated}
        isSaving={status === 'saving'}
        onSave={handleSave}
        onRegenerate={handleRegenerate}
        onDiscard={() => { setStatus('idle'); setGenerated(null); }}
      />
    );
  }

  // ── Input screen ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <Wand2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">AI Play Creator</p>
            <p className="text-[10px] text-gray-500">Describe a play — get a draft diagram in seconds</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* Prompt area */}
        <div>
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
            Describe the play
          </label>
          <textarea
            ref={textRef}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
            placeholder="e.g. I Right power to the strong side with FB lead and QB reverse pivot fake"
            className="w-full h-28 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
          />
          <p className="text-[10px] text-gray-600 mt-1">Tip: ⌘+Enter to generate</p>
        </div>

        {/* Sample prompts */}
        <div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Quick Examples</p>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_PROMPTS.map(s => (
              <button
                key={s}
                onClick={() => { setPrompt(s); textRef.current?.focus(); }}
                className="text-[11px] bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-emerald-500/40 text-gray-400 hover:text-gray-200 px-2.5 py-1 rounded-lg transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Helper fields (collapsible) */}
        <div className="border border-gray-800 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowHelpers(v => !v)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 text-[11px] font-bold text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" />
              Optional Helper Fields
            </span>
            {showHelpers ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showHelpers && (
            <div className="px-3.5 pb-3.5 grid grid-cols-2 gap-2.5 border-t border-gray-800">
              {/* Side of ball */}
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Side of Ball</label>
                <div className="flex gap-1">
                  {HELPER_OPTIONS.side_of_ball.map(v => (
                    <button key={v}
                      onClick={() => setHelper('side_of_ball', helpers.side_of_ball === v ? '' : v)}
                      className={cn(
                        "flex-1 text-[10px] py-1 rounded font-medium transition-colors capitalize",
                        helpers.side_of_ball === v
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-800 text-gray-500 hover:text-gray-300"
                      )}>
                      {v === 'special_teams' ? 'ST' : v.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Direction */}
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Direction</label>
                <div className="flex gap-1">
                  {HELPER_OPTIONS.direction.map(v => (
                    <button key={v}
                      onClick={() => setHelper('direction', helpers.direction === v ? '' : v)}
                      className={cn(
                        "flex-1 text-[10px] py-1 rounded font-medium transition-colors capitalize",
                        helpers.direction === v
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-800 text-gray-500 hover:text-gray-300"
                      )}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Formation family */}
              <div className="col-span-2">
                <label className="text-[10px] text-gray-500 block mb-1">Formation Family</label>
                <div className="flex flex-wrap gap-1">
                  {HELPER_OPTIONS.formation_family.map(v => (
                    <button key={v}
                      onClick={() => setHelper('formation_family', helpers.formation_family === v ? '' : v)}
                      className={cn(
                        "text-[10px] px-2 py-1 rounded transition-colors",
                        helpers.formation_family === v
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-800 text-gray-500 hover:text-gray-300 border border-gray-700"
                      )}>
                      {FORMATION_LABELS[v] || v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Concept / play family */}
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Play Family / Concept</label>
                <input
                  value={helpers.play_family}
                  onChange={e => setHelper('play_family', e.target.value)}
                  placeholder="e.g. Power, Zone, Flood"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-[11px] text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Age level */}
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Age Level</label>
                <div className="flex gap-1">
                  {HELPER_OPTIONS.age_level.map(v => (
                    <button key={v}
                      onClick={() => setHelper('age_level', v)}
                      className={cn(
                        "flex-1 text-[10px] py-1 rounded capitalize transition-colors",
                        helpers.age_level === v
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-800 text-gray-500 hover:text-gray-300"
                      )}>
                      {v === 'middle_school' ? 'MS' : v.slice(0, 5)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Complexity */}
              <div className="col-span-2">
                <label className="text-[10px] text-gray-500 block mb-1">Complexity</label>
                <div className="flex gap-1">
                  {HELPER_OPTIONS.complexity_level.map(v => (
                    <button key={v}
                      onClick={() => setHelper('complexity_level', v)}
                      className={cn(
                        "flex-1 text-[10px] py-1 rounded capitalize transition-colors",
                        helpers.complexity_level === v
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-800 text-gray-500 hover:text-gray-300"
                      )}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="text-[11px] text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg px-3 py-2.5">
            {error}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="px-5 py-4 border-t border-gray-800 flex items-center gap-2 shrink-0">
        {prompt && (
          <button
            onClick={() => { setPrompt(''); setError(null); }}
            className="h-9 w-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
            title="Clear prompt"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
        <Button
          className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2 rounded-xl"
          disabled={status === 'generating'}
          onClick={handleGenerate}
        >
          {status === 'generating' ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating Draft…</>
          ) : (
            <><Sparkles className="h-3.5 w-3.5" /> Generate Play</>
          )}
        </Button>
      </div>
    </div>
  );
}