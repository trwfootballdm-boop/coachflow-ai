import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { team_id, opponent_id, week_number, side_of_ball = 'all' } = await req.json();

    if (!team_id) {
      return Response.json({ error: 'team_id is required' }, { status: 400 });
    }

    // Fetch opponent data
    let opponent = null;
    if (opponent_id) {
      const opponents = await base44.entities.Opponent.filter({ team_id, id: opponent_id });
      opponent = opponents[0] || null;
    }

    // Fetch team data
    const teams = await base44.entities.Team.filter({ id: team_id });
    const team = teams[0];
    if (!team) {
      return Response.json({ error: 'Team not found' }, { status: 404 });
    }

    // Fetch all plays for this team
    const allPlays = await base44.entities.Play.filter({ team_id, is_active: true });
    
    // Fetch practice scripts to determine readiness
    const practiceScripts = await base44.entities.PracticeScript.filter({ team_id });
    let practicedPlayIds = new Set();
    
    if (practiceScripts.length > 0) {
      const scriptItemsPromises = practiceScripts.map(async (script) => {
        const items = await base44.entities.PracticeScriptItem.filter({ practice_script_id: script.id });
        return items;
      });
      const allScriptItems = (await Promise.all(scriptItemsPromises)).flat();
      practicedPlayIds = new Set(allScriptItems.map(item => item.play_id).filter(Boolean));
    }

    // Categorize plays by readiness and side
    const playsBySide = {
      offense: allPlays.filter(p => p.side === 'offense'),
      defense: allPlays.filter(p => p.side === 'defense'),
      special_teams: allPlays.filter(p => p.side === 'special_teams'),
    };

    const practicedPlays = allPlays.filter(p => practicedPlayIds.has(p.id));
    const unpracticedPlays = allPlays.filter(p => !practicedPlayIds.has(p.id));

    // Build structured prompt for AI
    const opponentContext = opponent ? {
      base_offense: opponent.base_offense || 'Unknown',
      base_defense: opponent.base_defense || 'Unknown',
      base_coverage: opponent.base_coverage || 'Unknown',
      offensive_tendencies: opponent.offensive_tendencies || 'No data',
      defensive_tendencies: opponent.defensive_tendencies || 'No data',
      blitz_tendencies: opponent.blitz_tendencies || 'No data',
      strengths: opponent.strengths || 'No data',
      weaknesses: opponent.weaknesses || 'No data',
    } : {
      base_offense: 'Unknown (no opponent selected)',
      base_defense: 'Unknown (no opponent selected)',
      base_coverage: 'Unknown (no opponent selected)',
      offensive_tendencies: 'No opponent data - assuming balanced attack',
      defensive_tendencies: 'No opponent data - assuming base 4-3',
      blitz_tendencies: 'No opponent data - assuming moderate pressure',
      strengths: 'Unknown',
      weaknesses: 'Unknown',
    };

    const teamContext = {
      age_level: team.age_group || 'youth',
      offensive_system: team.offensive_system || 'multiple',
      defensive_system: team.defensive_system || 'multiple',
      practiced_plays_count: practicedPlays.length,
      unpracticed_plays_count: unpracticedPlays.length,
      total_plays: allPlays.length,
    };

    // Build play library summary for AI
    const playLibrarySummary = {
      offense: {
        total: playsBySide.offense.length,
        practiced: playsBySide.offense.filter(p => practicedPlayIds.has(p.id)).length,
        by_family: groupByFamily(playsBySide.offense),
        by_situation: groupBySituation(playsBySide.offense),
      },
      defense: {
        total: playsBySide.defense.length,
        practiced: playsBySide.defense.filter(p => practicedPlayIds.has(p.id)).length,
        by_front: groupByFront(playsBySide.defense),
      },
      special_teams: {
        total: playsBySide.special_teams.length,
        practiced: playsBySide.special_teams.filter(p => practicedPlayIds.has(p.id)).length,
      },
    };

    const aiPrompt = buildAIPrompt({
      team: teamContext,
      opponent: opponentContext,
      play_library: playLibrarySummary,
      side_of_ball,
      week_number,
    });

    // Call LLM with structured output
    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt: aiPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          opponent_summary: {
            type: "object",
            properties: {
              base_offense: { type: "string" },
              base_defense: { type: "string" },
              base_coverage: { type: "string" },
              offensive_tendencies: { type: "string" },
              defensive_tendencies: { type: "string" },
              blitz_tendencies: { type: "string" },
              strengths: { type: "string" },
              weaknesses: { type: "string" },
              key_exploitable_matchups: { type: "string" },
            },
          },
          team_readiness: {
            type: "object",
            properties: {
              practiced_plays_count: { type: "integer" },
              unpracticed_plays_count: { type: "integer" },
              readiness_gaps: { type: "array", items: { type: "string" } },
              complexity_tolerance: { type: "string" },
              age_level: { type: "string" },
            },
          },
          offense_plan: {
            type: "object",
            properties: {
              core_plays: { type: "array", items: { type: "string" }, description: "Play names (not IDs) for 8-10 core plays" },
              complementary_plays: { type: "array", items: { type: "string" } },
              openers: { type: "array", items: { type: "string" }, description: "First 6-8 scripted plays" },
              red_zone_plan: { type: "array", items: { type: "string" } },
              short_yardage_plan: { type: "array", items: { type: "string" } },
              backed_up_plan: { type: "array", items: { type: "string" } },
              practice_emphasis: { type: "string" },
              coaching_points: { type: "string" },
            },
          },
          defense_plan: {
            type: "object",
            properties: {
              base_fronts: { type: "array", items: { type: "string" } },
              pressure_packages: { type: "array", items: { type: "string" } },
              coverage_plan: { type: "string" },
              red_zone_defense: { type: "array", items: { type: "string" } },
              third_down_calls: { type: "array", items: { type: "string" } },
              practice_emphasis: { type: "string" },
              coaching_points: { type: "string" },
            },
          },
          special_teams_plan: {
            type: "object",
            properties: {
              kickoff_focus: { type: "string" },
              punt_strategy: { type: "string" },
              return_emphasis: { type: "string" },
              field_goal_prep: { type: "string" },
            },
          },
          install_priorities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                priority_rank: { type: "integer" },
                concept_name: { type: "string" },
                situation: { type: "string" },
                readiness_status: { type: "string", enum: ["practiced", "new_install", "needs_reps"] },
                confidence_level: { type: "string", enum: ["high", "medium", "low"] },
                why_recommended: { type: "string" },
                assumptions: { type: "string" },
              },
            },
          },
          readiness_warnings: {
            type: "array",
            items: { type: "string" },
          },
          scout_card_recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                opponent_look: { type: "string" },
                our_play_concept: { type: "string" },
                formation: { type: "string" },
                tendency_note: { type: "string" },
                rep_count: { type: "integer" },
              },
            },
          },
          ai_assumptions: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
      model: "claude_sonnet_4_6",
    });

    // Map AI play names back to actual play IDs where possible
    const mappedPlan = mapPlayNamesToIds(llmResponse, allPlays, practicedPlayIds);

    // Create the weekly install plan record
    const newPlan = await base44.entities.WeeklyInstallPlan.create({
      team_id,
      opponent_id: opponent_id || null,
      week_number: week_number || 1,
      side_of_ball,
      ai_generated: true,
      opponent_summary: mappedPlan.opponent_summary,
      team_readiness: mappedPlan.team_readiness,
      offense_plan: side_of_ball !== 'defense' ? mappedPlan.offense_plan : null,
      defense_plan: side_of_ball !== 'offense' ? mappedPlan.defense_plan : null,
      special_teams_plan: mappedPlan.special_teams_plan,
      install_priorities: mappedPlan.install_priorities,
      readiness_warnings: mappedPlan.readiness_warnings,
      scout_card_recommendations: mappedPlan.scout_card_recommendations,
      ai_assumptions: mappedPlan.ai_assumptions,
      status: 'draft',
    });

    return Response.json({ 
      success: true, 
      plan_id: newPlan.id,
      plan: newPlan,
    });

  } catch (error) {
    console.error('Error generating weekly plan:', error);
    return Response.json({ 
      error: error.message,
      details: 'Failed to generate AI weekly plan'
    }, { status: 500 });
  }
});

// Helper functions

function groupByFamily(plays) {
  const families = {};
  plays.forEach(p => {
    const family = p.play_family || 'Unknown';
    if (!families[family]) families[family] = 0;
    families[family]++;
  });
  return families;
}

function groupBySituation(plays) {
  const situations = {};
  plays.forEach(p => {
    const tags = [...(p.down_distance_tags || []), ...(p.field_zone_tags || [])];
    tags.forEach(tag => {
      if (!situations[tag]) situations[tag] = 0;
      situations[tag]++;
    });
  });
  return situations;
}

function groupByFront(plays) {
  const fronts = {};
  plays.forEach(p => {
    const front = p.formation || 'Unknown';
    if (!fronts[front]) fronts[front] = 0;
    fronts[front]++;
  });
  return fronts;
}

function buildAIPrompt({ team, opponent, play_library, side_of_ball, week_number }) {
  return `You are an expert football coach assistant helping a ${team.age_level} coach prepare their weekly game plan.

## TEAM CONTEXT
- Age Level: ${team.age_level}
- Offensive System: ${team.offensive_system}
- Defensive System: ${team.defensive_system}
- Practiced Plays: ${team.practiced_plays_count}
- Unpracticed Plays: ${team.unpracticed_plays_count}
- Total Playbook Size: ${team.total_plays}

## OPPONENT PROFILE
${!opponent_id ? '⚠️ WARNING: No opponent selected. Making assumptions based on typical youth/middle school tendencies.' : ''}
- Base Offense: ${opponent.base_offense}
- Base Defense: ${opponent.base_defense}
- Base Coverage: ${opponent.base_coverage}
- Offensive Tendencies: ${opponent.offensive_tendencies}
- Defensive Tendencies: ${opponent.defensive_tendencies}
- Blitz Tendencies: ${opponent.blitz_tendencies}
- Strengths: ${opponent.strengths}
- Weaknesses: ${opponent.weaknesses}

## PLAY LIBRARY SUMMARY
### Offense
- Total: ${play_library.offense.total} plays (${play_library.offense.practiced} practiced)
- By Family: ${JSON.stringify(play_library.offense.by_family)}
- By Situation: ${JSON.stringify(play_library.offense.by_situation)}

### Defense
- Total: ${play_library.defense.total} plays (${play_library.defense.practiced} practiced)
- By Front: ${JSON.stringify(play_library.defense.by_front)}

### Special Teams
- Total: ${play_library.special_teams.total} plays (${play_library.special_teams.practiced} practiced)

## YOUR TASK
Generate a practical, age-appropriate weekly game plan for Week ${week_number || 1}.

${side_of_ball === 'offense' ? 'Focus on OFFENSE only.' : side_of_ball === 'defense' ? 'Focus on DEFENSE only.' : 'Cover both offense and defense.'}

### IMPORTANT CONSTRAINTS
1. **Age-Appropriate**: Keep concepts simple for ${team.age_level}. Avoid complex formations or assignments.
2. **Readiness-Aware**: Prioritize practiced plays. Only recommend new installs if there are clear gaps.
3. **Opponent-Specific**: Exploit opponent weaknesses. Avoid plays that play into their strengths.
4. **Practical**: This coach needs actionable recommendations, not generic advice.
5. **Tie to Actual Plays**: Reference specific play concepts from the library summary above.

### OUTPUT REQUIREMENTS

For each section, provide:
1. **Specific play concepts** (use names from the library summary)
2. **Why it's recommended** (tie to opponent tendencies or team strengths)
3. **Readiness status** (practiced vs new install)
4. **Confidence level** (high/medium/low based on preparation)
5. **Assumptions** if data is missing

### CRITICAL WARNINGS TO INCLUDE
- Any recommended play that hasn't been practiced
- Gaps in the playbook (e.g., "no red zone answers vs man coverage")
- Too many new concepts for this age level
- Mismatches between opponent tendencies and game plan

Be concise, practical, and football-specific. This coach will use your output to build their actual call sheet and practice plan.`;
}

function mapPlayNamesToIds(aiResponse, allPlays, practicedPlayIds) {
  // Create a map of play names to play objects
  const playMap = new Map();
  allPlays.forEach(p => {
    const key = (p.play_name || p.name || '').toLowerCase();
    if (key) playMap.set(key, p);
  });

  // Helper to find play by name/concept
  const findPlay = (name) => {
    if (!name) return null;
    const key = name.toLowerCase();
    
    // Exact match
    if (playMap.has(key)) return playMap.get(key);
    
    // Partial match
    for (const [mapKey, play] of playMap.entries()) {
      if (mapKey.includes(key) || key.includes(mapKey)) {
        return play;
      }
    }
    
    // Match by concept
    const conceptMatch = allPlays.find(p => 
      (p.concept || '').toLowerCase().includes(key) ||
      (p.play_family || '').toLowerCase().includes(key)
    );
    
    return conceptMatch || null;
  };

  // Map offense plan
  if (aiResponse.offense_plan) {
    aiResponse.offense_plan.core_play_ids = (aiResponse.offense_plan.core_plays || [])
      .map(name => findPlay(name)?.id).filter(Boolean);
    aiResponse.offense_plan.complementary_play_ids = (aiResponse.offense_plan.complementary_plays || [])
      .map(name => findPlay(name)?.id).filter(Boolean);
    aiResponse.offense_plan.opener_play_ids = (aiResponse.offense_plan.openers || [])
      .map(name => findPlay(name)?.id).filter(Boolean);
  }

  // Map defense plan
  if (aiResponse.defense_plan) {
    aiResponse.defense_plan.base_front_play_ids = (aiResponse.defense_plan.base_fronts || [])
      .map(name => findPlay(name)?.id).filter(Boolean);
  }

  // Add readiness metadata to install priorities
  if (aiResponse.install_priorities) {
    aiResponse.install_priorities.forEach(priority => {
      const matchedPlay = findPlay(priority.concept_name);
      if (matchedPlay) {
        priority.play_id = matchedPlay.id;
        priority.readiness_status = practicedPlayIds.has(matchedPlay.id) ? 'practiced' : 'needs_reps';
      } else {
        priority.readiness_status = 'concept_only';
      }
    });
  }

  // Generate readiness warnings
  aiResponse.readiness_warnings = aiResponse.readiness_warnings || [];
  
  const unpracticedRecommendations = (aiResponse.install_priorities || []).filter(
    p => p.readiness_status === 'needs_reps'
  );
  
  if (unpracticedRecommendations.length > 0) {
    aiResponse.readiness_warnings.push(
      `${unpracticedRecommendations.length} recommended concept${unpracticedRecommendations.length > 1 ? 's' : ''} ${unpracticedRecommendations.length === 1 ? 'has' : 'have'} not been practiced this week`
    );
  }

  return aiResponse;
}