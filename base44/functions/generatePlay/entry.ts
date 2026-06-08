import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── Canvas geometry helpers ────────────────────────────────────────────────────
const LOS_Y = 290;
const CX    = 450;

// Offense pre-snap positions by formation family (clean, youth-appropriate)
const FORMATIONS = {
  i_formation: {
    name: 'I Right',
    players: [
      { token_id:'LT', position_code:'LT', display_label:'LT', x: CX-80, y: LOS_Y, team_side:'offense', role_type:'lineman' },
      { token_id:'LG', position_code:'LG', display_label:'LG', x: CX-40, y: LOS_Y, team_side:'offense', role_type:'lineman' },
      { token_id:'C',  position_code:'C',  display_label:'C',  x: CX,    y: LOS_Y, team_side:'offense', role_type:'lineman' },
      { token_id:'RG', position_code:'RG', display_label:'RG', x: CX+40, y: LOS_Y, team_side:'offense', role_type:'lineman' },
      { token_id:'RT', position_code:'RT', display_label:'RT', x: CX+80, y: LOS_Y, team_side:'offense', role_type:'lineman' },
      { token_id:'TE', position_code:'TE', display_label:'Y',  x: CX+120, y: LOS_Y, team_side:'offense', role_type:'receiver' },
      { token_id:'X',  position_code:'WR', display_label:'X',  x: CX-200, y: LOS_Y, team_side:'offense', role_type:'receiver' },
      { token_id:'QB', position_code:'QB', display_label:'QB', x: CX,    y: LOS_Y+35, team_side:'offense', role_type:'ball_carrier' },
      { token_id:'FB', position_code:'FB', display_label:'FB', x: CX,    y: LOS_Y+75, team_side:'offense', role_type:'ball_carrier' },
      { token_id:'TB', position_code:'RB', display_label:'TB', x: CX,    y: LOS_Y+115, team_side:'offense', role_type:'ball_carrier' },
    ],
  },
  spread_2x2: {
    name: 'Shotgun 2x2',
    players: [
      { token_id:'LT', position_code:'LT', display_label:'LT', x: CX-80, y: LOS_Y, team_side:'offense', role_type:'lineman' },
      { token_id:'LG', position_code:'LG', display_label:'LG', x: CX-40, y: LOS_Y, team_side:'offense', role_type:'lineman' },
      { token_id:'C',  position_code:'C',  display_label:'C',  x: CX,    y: LOS_Y, team_side:'offense', role_type:'lineman' },
      { token_id:'RG', position_code:'RG', display_label:'RG', x: CX+40, y: LOS_Y, team_side:'offense', role_type:'lineman' },
      { token_id:'RT', position_code:'RT', display_label:'RT', x: CX+80, y: LOS_Y, team_side:'offense', role_type:'lineman' },
      { token_id:'X',  position_code:'WR', display_label:'X',  x: CX-200, y: LOS_Y, team_side:'offense', role_type:'receiver' },
      { token_id:'H',  position_code:'WR', display_label:'H',  x: CX-140, y: LOS_Y, team_side:'offense', role_type:'receiver' },
      { token_id:'Z',  position_code:'WR', display_label:'Z',  x: CX+200, y: LOS_Y, team_side:'offense', role_type:'receiver' },
      { token_id:'Y',  position_code:'WR', display_label:'Y',  x: CX+140, y: LOS_Y, team_side:'offense', role_type:'receiver' },
      { token_id:'QB', position_code:'QB', display_label:'QB', x: CX,    y: LOS_Y+60, team_side:'offense', role_type:'ball_carrier' },
      { token_id:'RB', position_code:'RB', display_label:'RB', x: CX-30, y: LOS_Y+90, team_side:'offense', role_type:'ball_carrier' },
    ],
  },
  spread_trips: {
    name: 'Shotgun Trips Right',
    players: [
      { token_id:'LT', position_code:'LT', display_label:'LT', x: CX-80, y: LOS_Y, team_side:'offense', role_type:'lineman' },
      { token_id:'LG', position_code:'LG', display_label:'LG', x: CX-40, y: LOS_Y, team_side:'offense', role_type:'lineman' },
      { token_id:'C',  position_code:'C',  display_label:'C',  x: CX,    y: LOS_Y, team_side:'offense', role_type:'lineman' },
      { token_id:'RG', position_code:'RG', display_label:'RG', x: CX+40, y: LOS_Y, team_side:'offense', role_type:'lineman' },
      { token_id:'RT', position_code:'RT', display_label:'RT', x: CX+80, y: LOS_Y, team_side:'offense', role_type:'lineman' },
      { token_id:'X',  position_code:'WR', display_label:'X',  x: CX-200, y: LOS_Y, team_side:'offense', role_type:'receiver' },
      { token_id:'Z',  position_code:'WR', display_label:'Z',  x: CX+220, y: LOS_Y, team_side:'offense', role_type:'receiver' },
      { token_id:'Y',  position_code:'TE', display_label:'Y',  x: CX+150, y: LOS_Y, team_side:'offense', role_type:'receiver' },
      { token_id:'H',  position_code:'WR', display_label:'H',  x: CX+110, y: LOS_Y-18, team_side:'offense', role_type:'receiver' },
      { token_id:'QB', position_code:'QB', display_label:'QB', x: CX,    y: LOS_Y+60, team_side:'offense', role_type:'ball_carrier' },
      { token_id:'RB', position_code:'RB', display_label:'RB', x: CX-30, y: LOS_Y+95, team_side:'offense', role_type:'ball_carrier' },
    ],
  },
  wing_t: {
    name: 'Double Wing Right',
    players: [
      { token_id:'LT', position_code:'LT', display_label:'LT', x: CX-80, y: LOS_Y, team_side:'offense', role_type:'lineman' },
      { token_id:'LG', position_code:'LG', display_label:'LG', x: CX-40, y: LOS_Y, team_side:'offense', role_type:'lineman' },
      { token_id:'C',  position_code:'C',  display_label:'C',  x: CX,    y: LOS_Y, team_side:'offense', role_type:'lineman' },
      { token_id:'RG', position_code:'RG', display_label:'RG', x: CX+40, y: LOS_Y, team_side:'offense', role_type:'lineman' },
      { token_id:'RT', position_code:'RT', display_label:'RT', x: CX+80, y: LOS_Y, team_side:'offense', role_type:'lineman' },
      { token_id:'LTE',position_code:'TE', display_label:'LTE',x: CX-115, y: LOS_Y, team_side:'offense', role_type:'receiver' },
      { token_id:'RTE',position_code:'TE', display_label:'RTE',x: CX+115, y: LOS_Y, team_side:'offense', role_type:'receiver' },
      { token_id:'LWB',position_code:'WR', display_label:'LWB',x: CX-150, y: LOS_Y+22, team_side:'offense', role_type:'receiver' },
      { token_id:'RWB',position_code:'WR', display_label:'RWB',x: CX+150, y: LOS_Y+22, team_side:'offense', role_type:'receiver' },
      { token_id:'QB', position_code:'QB', display_label:'QB', x: CX,    y: LOS_Y+35, team_side:'offense', role_type:'ball_carrier' },
      { token_id:'FB', position_code:'FB', display_label:'FB', x: CX,    y: LOS_Y+80, team_side:'offense', role_type:'ball_carrier' },
    ],
  },
  goal_line: {
    name: 'Goal Line Power',
    players: [
      { token_id:'LT', position_code:'LT', display_label:'LT', x: CX-80, y: LOS_Y, team_side:'offense', role_type:'lineman' },
      { token_id:'LG', position_code:'LG', display_label:'LG', x: CX-40, y: LOS_Y, team_side:'offense', role_type:'lineman' },
      { token_id:'C',  position_code:'C',  display_label:'C',  x: CX,    y: LOS_Y, team_side:'offense', role_type:'lineman' },
      { token_id:'RG', position_code:'RG', display_label:'RG', x: CX+40, y: LOS_Y, team_side:'offense', role_type:'lineman' },
      { token_id:'RT', position_code:'RT', display_label:'RT', x: CX+80, y: LOS_Y, team_side:'offense', role_type:'lineman' },
      { token_id:'LTE',position_code:'TE', display_label:'LTE',x: CX-115, y: LOS_Y, team_side:'offense', role_type:'receiver' },
      { token_id:'RTE',position_code:'TE', display_label:'RTE',x: CX+115, y: LOS_Y, team_side:'offense', role_type:'receiver' },
      { token_id:'QB', position_code:'QB', display_label:'QB', x: CX,    y: LOS_Y+35, team_side:'offense', role_type:'ball_carrier' },
      { token_id:'FB', position_code:'FB', display_label:'FB', x: CX,    y: LOS_Y+75, team_side:'offense', role_type:'ball_carrier' },
      { token_id:'TB', position_code:'RB', display_label:'TB', x: CX,    y: LOS_Y+110, team_side:'offense', role_type:'ball_carrier' },
    ],
  },
  six_two: {
    name: '6-2 Base',
    players: [
      { token_id:'LDE', position_code:'DE', display_label:'LE', x: CX-130, y: LOS_Y, team_side:'defense', role_type:'lineman' },
      { token_id:'LDT', position_code:'DT', display_label:'LT', x: CX-80,  y: LOS_Y, team_side:'defense', role_type:'lineman' },
      { token_id:'LDG', position_code:'DT', display_label:'LG', x: CX-35,  y: LOS_Y, team_side:'defense', role_type:'lineman' },
      { token_id:'NG',  position_code:'DT', display_label:'NG', x: CX,     y: LOS_Y, team_side:'defense', role_type:'lineman' },
      { token_id:'RDG', position_code:'DT', display_label:'RG', x: CX+35,  y: LOS_Y, team_side:'defense', role_type:'lineman' },
      { token_id:'RDT', position_code:'DT', display_label:'RT', x: CX+80,  y: LOS_Y, team_side:'defense', role_type:'lineman' },
      { token_id:'RDE', position_code:'DE', display_label:'RE', x: CX+130, y: LOS_Y, team_side:'defense', role_type:'lineman' },
      { token_id:'LOLB', position_code:'LB', display_label:'LLB', x: CX-60, y: LOS_Y-45, team_side:'defense', role_type:'linebacker' },
      { token_id:'ROLB', position_code:'LB', display_label:'RLB', x: CX+60, y: LOS_Y-45, team_side:'defense', role_type:'linebacker' },
      { token_id:'LCB', position_code:'CB', display_label:'LC', x: CX-200, y: LOS_Y-80, team_side:'defense', role_type:'db' },
      { token_id:'S',   position_code:'S',  display_label:'S',  x: CX,     y: LOS_Y-110, team_side:'defense', role_type:'db' },
      { token_id:'RCB', position_code:'CB', display_label:'RC', x: CX+200, y: LOS_Y-80, team_side:'defense', role_type:'db' },
    ],
  },
  five_three: {
    name: '5-3 Base',
    players: [
      { token_id:'LDE', position_code:'DE', display_label:'LE', x: CX-120, y: LOS_Y, team_side:'defense', role_type:'lineman' },
      { token_id:'LDT', position_code:'DT', display_label:'LT', x: CX-65,  y: LOS_Y, team_side:'defense', role_type:'lineman' },
      { token_id:'NG',  position_code:'DT', display_label:'NG', x: CX,     y: LOS_Y, team_side:'defense', role_type:'lineman' },
      { token_id:'RDT', position_code:'DT', display_label:'RT', x: CX+65,  y: LOS_Y, team_side:'defense', role_type:'lineman' },
      { token_id:'RDE', position_code:'DE', display_label:'RE', x: CX+120, y: LOS_Y, team_side:'defense', role_type:'lineman' },
      { token_id:'LOLB',position_code:'LB', display_label:'LLB', x: CX-90, y: LOS_Y-42, team_side:'defense', role_type:'linebacker' },
      { token_id:'MLB', position_code:'LB', display_label:'MLB', x: CX,    y: LOS_Y-42, team_side:'defense', role_type:'linebacker' },
      { token_id:'ROLB',position_code:'LB', display_label:'RLB', x: CX+90, y: LOS_Y-42, team_side:'defense', role_type:'linebacker' },
      { token_id:'LCB', position_code:'CB', display_label:'LC', x: CX-210, y: LOS_Y-85, team_side:'defense', role_type:'db' },
      { token_id:'FS',  position_code:'S',  display_label:'FS', x: CX,     y: LOS_Y-115, team_side:'defense', role_type:'db' },
      { token_id:'RCB', position_code:'CB', display_label:'RC', x: CX+210, y: LOS_Y-85, team_side:'defense', role_type:'db' },
    ],
  },
};

// ── Path factory helpers ────────────────────────────────────────────────────────
function makePath(id, type, points, opts = {}) {
  return {
    path_id: id,
    path_type: type,
    points,
    stroke_color: opts.color || (type === 'route' ? '#f59e0b' : type === 'run' ? '#3b82f6' : type === 'block' ? '#6b7280' : type === 'blitz' ? '#ef4444' : '#10b981'),
    stroke_width: opts.width || 2,
    line_style: opts.style || 'solid',
    arrow_end: opts.arrow !== false,
    curve_type: opts.curve || 'straight',
    player_id: opts.player_id || null,
  };
}

// ── AI system prompt builder ────────────────────────────────────────────────────
function buildSystemPrompt() {
  return `You are an expert youth football coaching assistant. Convert play descriptions into structured, coach-ready diagram data.

ANALYSIS APPROACH:
1. Parse: Identify formation, concept, direction, and key assignments from the description
2. Infer: Fill gaps using standard football conventions for the formation
3. Generate: Clean, teachable diagrams for youth/middle school levels
4. Document: List ALL assumptions explicitly

Return ONLY valid JSON with this exact structure:

{
  "play_meta": {
    "name": "Formation + Concept + Direction (e.g., 'I Right Power Right')",
    "short_name": "2-4 word call (e.g., 'Power Rt')",
    "side": "offense|defense|special_teams",
    "run_pass": "run|pass|rpo|special_teams",
    "play_type": "run|pass|screen|play_action|rpo|trick",
    "play_family": "Power|Zone|Iso|Trap|Slant|Flood|Mesh|Blitz",
    "formation": "Specific name (e.g., 'I Right', 'Shotgun Trips Right')",
    "formation_family": "i_formation|spread_2x2|spread_trips|wing_t|goal_line|six_two|five_three",
    "concept": "Primary concept (e.g., 'Inside Zone', 'Power', 'Curl-Flat')",
    "direction": "left|right|middle",
    "strength": "left|right|balanced",
    "personnel": "base|11|12|21|22",
    "risk_level": "low|medium|high",
    "age_level_difficulty": "youth|middle_school|high_school",
    "down_distance_tags": ["1st-10", "2nd-short"],
    "field_zone_tags": ["any", "red_zone", "goal_line"],
    "tags": ["power", "gap_scheme", "lead_block"],
    "coaching_points": "1-2 sentences on KEY technique/timing/read",
    "notes": "1-sentence summary"
  },
  "formation_snapshot": {
    "formation_name": "Same as play_meta.formation",
    "strength_call": "right|left|balanced"
  },
  "diagram": {
    "players": [ /* player objects */ ],
    "paths": [ /* path objects */ ],
    "annotations": [ /* annotation objects */ ]
  },
  "assignments": [ /* assignment objects - ONE per player */ ],
  "animation_events": [ /* timeline events */ ],
  "assumptions": ["List EVERY assumption made"]
}

PLAYER OBJECT:
{
  "token_id": "QB|FB|TB|WR|TE|LT|LG|C|RG|RT|DE|DT|LB|CB|S",
  "position_code": "QB|RB|FB|WR|TE|LT|LG|C|RG|RT|DE|DT|LB|CB|S",
  "display_label": "1-3 chars (QB, C, X, DE)",
  "x": "0-900 (center=450)",
  "y": "0-560 (LOS=290, offense y>290, defense y<290)",
  "team_side": "offense|defense",
  "role_type": "lineman|ball_carrier|receiver|linebacker|db|other"
}

PATH OBJECT:
{
  "path_id": "unique (e.g., path_RB_1)",
  "path_type": "run|route|block|pull|motion|blitz|contain|zone_drop|ball|fake",
  "points": [{"x": num, "y": num}, ...],
  "stroke_color": "#hex (see conventions below)",
  "stroke_width": 2,
  "line_style": "solid|dashed|dotted",
  "arrow_end": true,
  "curve_type": "straight|curved",
  "player_id": "matching token_id or null"
}

PATH COLOR CONVENTIONS (ALWAYS use these):
- run: "#3b82f6" (blue)
- route: "#f59e0b" (amber)
- block: "#6b7280" (gray)
- pull: "#8b5cf6" (purple)
- motion: "#06b6d4" (cyan)
- blitz: "#ef4444" (red)
- contain: "#10b981" (green)
- zone_drop: "#059669" (dark green)
- ball: "#ffffff" (white)
- fake: "#f97316" (orange)

ANNOTATION OBJECT:
{
  "annotation_id": "ann_1",
  "label": "short text",
  "x": number,
  "y": number,
  "style": "callout|arrow|label"
}

ASSIGNMENT OBJECT (CRITICAL - be specific and actionable):
{
  "position_code": "e.g., FB, LT, QB",
  "assignment_type": "block|kickout|lead|pull|route|fake|handoff|read|fill|blitz|contain|drop|rush",
  "assignment_text": "SPECIFIC 1-2 sentence assignment with technique/detail",
  "aiming_point": "Specific landmark (e.g., 'outside hip of playside guard')",
  "read_key": "What player reads (e.g., 'backside DE')"
}

ANIMATION EVENT:
{
  "event_id": "evt_1",
  "event_type": "motion_start|snap|handoff|route_release|throw|end_state",
  "label": "short label",
  "time_ms": number (start at 0, snap at 500)
}

CRITICAL RULES:
1. LOS at y=290. Offense at/below y=290. Defense at/above y=290.
2. Center x=450. Field width 0-900.
3. Clean diagrams: 8-11 players max per side.
4. Valid JSON ONLY. No markdown, no explanation.
5. Youth-appropriate: simple routes, basic blocking.
6. Offense minimum: QB + 5 OL + relevant skill players.
7. Defense: appropriate front + secondary.
8. Run paths: start at ball carrier, end realistically.
9. Block paths: short, realistic from lineman positions.
10. Always include snap event at time_ms=500.`;
}

// ── Select formation template ─────────────────────────────────────────────────
function pickFormationTemplate(formationFamily) {
  return FORMATIONS[formationFamily] || FORMATIONS['i_formation'];
}

// ── Main handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      prompt,
      side_of_ball,
      formation_family,
      play_family,
      concept,
      direction,
      age_level,
      complexity_level,
      include_animation,
    } = body;

    if (!prompt && !play_family) {
      return Response.json({ error: 'prompt or play_family required' }, { status: 400 });
    }

    // Build enriched prompt
    const helperContext = [
      side_of_ball    && `Side: ${side_of_ball}`,
      formation_family && `Formation: ${formation_family}`,
      play_family      && `Play family: ${play_family}`,
      concept          && `Concept: ${concept}`,
      direction        && `Direction: ${direction}`,
      age_level        && `Age: ${age_level}`,
      complexity_level && `Complexity: ${complexity_level}`,
    ].filter(Boolean).join('. ');

    const fullPrompt = [prompt, helperContext].filter(Boolean).join('. ');

    const userMsg = `Generate a complete football play for: "${fullPrompt}". Return ONLY valid JSON.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: userMsg,
      response_json_schema: {
        type: 'object',
        properties: {
          play_meta: { type: 'object' },
          formation_snapshot: { type: 'object' },
          diagram: { type: 'object' },
          assignments: { type: 'array', items: { type: 'object' } },
          animation_events: { type: 'array', items: { type: 'object' } },
          assumptions: { type: 'array', items: { type: 'string' } },
        },
      },
      model: 'claude_sonnet_4_6',
    });

    // Validate
    if (!result?.play_meta || !result?.diagram) {
      return Response.json({ error: 'AI returned incomplete data' }, { status: 500 });
    }

    // Merge with formation template if needed
    const aiPlayers = result.diagram?.players || [];
    if (aiPlayers.length < 5) {
      const template = pickFormationTemplate(result.play_meta?.formation_family || formation_family || 'i_formation');
      result.diagram.players = template.players;
      result.assumptions = [...(result.assumptions || []), `Used formation template: ${template.name}`];
    }

    // Ensure paths have required fields
    result.diagram.paths = (result.diagram.paths || []).map(p => ({
      stroke_width: 2,
      arrow_end: true,
      curve_type: 'straight',
      line_style: 'solid',
      ...p,
    }));

    // Add snap event if missing
    if (include_animation !== false && (!result.animation_events || result.animation_events.length === 0)) {
      result.animation_events = [
        { event_id: 'evt_snap', event_type: 'snap', label: 'SNAP', time_ms: 500 },
      ];
    }

    return Response.json({ success: true, generated: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});