import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { team_id, opponent_id, week_number, side_of_ball } = await req.json();

    if (!team_id || !side_of_ball) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Fetch opponent data if provided
    let opponent = null;
    if (opponent_id) {
      const opponents = await base44.entities.Opponent.filter({ id: opponent_id });
      opponent = opponents[0] || null;
    }

    // Fetch team's existing plays
    const teamPlays = await base44.entities.Play.filter({ team_id, side: side_of_ball, is_active: true });

    // Fetch team readiness data (recently practiced plays)
    const recentScripts = await base44.entities.PracticeScript.filter({ 
      team_id, 
      active: true 
    }, '-script_date', 5);

    const practicedPlayIds = new Set();
    recentScripts.forEach(script => {
      if (script.play_ids) {
        script.play_ids.forEach(id => practicedPlayIds.add(id));
      }
    });

    // Build context for AI
    const context = {
      team_id,
      opponent: opponent ? {
        name: opponent.name,
        base_defense: opponent.base_defense,
        base_offense: opponent.base_offense,
        defensive_tendencies: opponent.defensive_tendencies,
        offensive_tendencies: opponent.offensive_tendencies,
        blitz_tendencies: opponent.blitz_tendencies,
        strengths: opponent.strengths,
        weaknesses: opponent.weaknesses
      } : null,
      team_readiness: {
        practiced_play_count: practicedPlayIds.size,
        recent_install_count: recentScripts.length
      },
      existing_plays: teamPlays.map(p => ({
        id: p.id,
        name: p.name,
        formation: p.formation,
        play_family: p.play_family,
        run_pass: p.run_pass,
        situation_tags: p.situation_tags || [],
        down_distance_tags: p.down_distance_tags || [],
        field_zone_tags: p.field_zone_tags || [],
        opponent_front_tags: p.opponent_front_tags || [],
        coverage_tags: p.coverage_tags || [],
        risk_level: p.risk_level,
        age_level_difficulty: p.age_level_difficulty,
        install_day: p.install_day,
        is_favorite: p.is_favorite
      }))
    };

    // Call AI to generate recommendations
    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert football coach assisting with game planning. Based on the team's existing playbook and opponent analysis, recommend the best plays for this week's game plan.

Context:
${JSON.stringify(context, null, 2)}

Task:
Analyze the team's playbook and recommend 8-12 plays that would be most effective against this opponent. Consider:
1. Opponent tendencies and weaknesses
2. Team's proficiency level (age/skill)
3. Recently practiced plays (higher confidence)
4. Balance of run/pass and formations
5. Situational effectiveness (red zone, 3rd down, etc.)
6. Play complexity vs opponent's defensive/offsive capabilities

Return a JSON array of play recommendations with this structure:
[
  {
    "play_id": "string (ID from existing plays)",
    "priority_rank": number (1-12),
    "situation": "string (e.g., base, red_zone, 3rd_short)",
    "confidence_level": "high" | "medium" | "low",
    "why_recommended": "string (2-3 sentences explaining why this play matches up well)",
    "readiness_status": "practiced_recently" | "installed_but_stale" | "new_this_week",
    "coaching_point": "string (key focus for this play vs this opponent)"
  }
]

Only recommend plays that exist in the team's playbook (use the play_id from existing_plays). If the playbook lacks certain concepts needed, note that in a separate "gaps" array.`,
      response_json_schema: {
        type: "object",
        properties: {
          recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                play_id: { type: "string" },
                priority_rank: { type: "integer" },
                situation: { type: "string" },
                confidence_level: { type: "string", enum: ["high", "medium", "low"] },
                why_recommended: { type: "string" },
                readiness_status: { type: "string", enum: ["practiced_recently", "installed_but_stale", "new_this_week"] },
                coaching_point: { type: "string" }
              },
              required: ["play_id", "priority_rank", "situation", "confidence_level", "why_recommended", "readiness_status"]
            }
          },
          gaps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                concept_missing: { type: "string" },
                situation: { type: "string" },
                recommendation: { type: "string" }
              }
            }
          },
          game_plan_summary: {
            type: "string"
          }
        },
        required: ["recommendations"]
      },
      model: "claude_sonnet_4_6"
    });

    return Response.json({
      recommendations: aiResponse.recommendations || [],
      gaps: aiResponse.gaps || [],
      game_plan_summary: aiResponse.game_plan_summary || '',
      generated_at: new Date().toISOString(),
      generated_by: user.full_name
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});