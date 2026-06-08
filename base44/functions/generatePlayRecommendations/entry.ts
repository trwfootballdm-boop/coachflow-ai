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

    // Fetch opponent data
    let opponent = null;
    if (opponent_id) {
      const opponents = await base44.entities.Opponent.filter({ id: opponent_id });
      opponent = opponents[0];
    }

    // Fetch team's existing plays
    const allPlays = await base44.entities.Play.filter({ 
      team_id, 
      side: side_of_ball,
      is_active: true
    });

    // Fetch practice history (last 14 days)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const recentScripts = await base44.entities.PracticeScript.filter({
      team_id,
      script_date: { $gte: twoWeeksAgo.toISOString().split('T')[0] }
    });

    // Build practiced plays map
    const practicedPlayIds = new Set();
    const playPracticeCount = {};
    
    for (const script of recentScripts) {
      const scriptItems = await base44.entities.PracticeScriptItem.filter({
        script_id: script.id
      });
      
      for (const item of scriptItems) {
        if (item.play_id) {
          practicedPlayIds.add(item.play_id);
          playPracticeCount[item.play_id] = (playPracticeCount[item.play_id] || 0) + 1;
        }
      }
    }

    // Analyze playbook gaps and generate recommendations
    const recommendations = [];
    const gaps = [];

    // Priority situations to check
    const prioritySituations = [
      { situation: 'openers', field_zone: 'any', down_distance: ['1st-10'] },
      { situation: 'red_zone', field_zone: 'red_zone', down_distance: ['2nd-short', '3rd-short'] },
      { situation: 'third_down', field_zone: 'any', down_distance: ['3rd-short', '3rd-medium', '3rd-long'] },
      { situation: 'goal_line', field_zone: 'goal_line', down_distance: ['1st-goal', '2nd-goal'] },
      { situation: 'two_minute', field_zone: 'any', down_distance: ['2pt', '4th-short'] }
    ];

    for (const prio of prioritySituations) {
      // Find plays that match this situation
      const matchingPlays = allPlays.filter(play => {
        const fieldMatch = !prio.field_zone || prio.field_zone === 'any' || 
                          (play.field_zone_tags || []).includes(prio.field_zone);
        const downMatch = !prio.down_distance || 
                         (play.down_distance_tags || []).some(d => prio.down_distance.includes(d));
        return fieldMatch && downMatch;
      });

      // Check if we have practiced plays for this situation
      const practicedMatching = matchingPlays.filter(p => practicedPlayIds.has(p.id));

      if (practicedMatching.length === 0 && matchingPlays.length > 0) {
        // Gap: have plays but haven't practiced
        const bestPlay = matchingPlays[0];
        recommendations.push({
          priority_rank: recommendations.length + 1,
          play_id: bestPlay.id,
          play_name: bestPlay.name,
          situation: prio.situation,
          readiness_status: 'installed_but_stale',
          confidence_level: 'high',
          why_recommended: `Critical ${prio.situation.replace('_', ' ')} play needs review before game day`,
          coaching_point: 'Reps needed to build muscle memory',
          assumption: 'This play was installed but not recently practiced'
        });
      } else if (practicedMatching.length === 0 && matchingPlays.length === 0) {
        // Gap: no plays in playbook for this situation
        gaps.push({
          concept_missing: prio.situation.replace('_', ' '),
          recommendation: `Add ${prio.situation.replace('_', ' ')} plays to playbook`,
          priority: 'high'
        });
      } else {
        // Good: have practiced plays
        const topPracticed = practicedMatching
          .sort((a, b) => (playPracticeCount[b.id] || 0) - (playPracticeCount[a.id] || 0))
          .slice(0, 2);

        for (const play of topPracticed) {
          recommendations.push({
            priority_rank: recommendations.length + 1,
            play_id: play.id,
            play_name: play.name,
            situation: prio.situation,
            readiness_status: 'practiced_recently',
            confidence_level: 'high',
            why_recommended: `Solid ${prio.situation.replace('_', ' ')} option with recent reps`,
            coaching_point: `Practiced ${playPracticeCount[play.id]} times in last 2 weeks`,
            assumption: 'Recent practice indicates readiness'
          });
        }
      }
    }

    // Add opponent-specific recommendations if opponent data available
    if (opponent) {
      // Check opponent tendencies and recommend counters
      if (opponent.defensive_tendencies) {
        const defensiveNotes = opponent.defensive_tendencies.toLowerCase();
        
        if (defensiveNotes.includes('blitz')) {
          const blitzBeaters = allPlays.filter(p => 
            p.play_type === 'screen' || p.play_type === 'play_action'
          ).filter(p => practicedPlayIds.has(p.id));

          if (blitzBeaters.length > 0) {
            recommendations.push({
              priority_rank: recommendations.length + 1,
              play_id: blitzBeaters[0].id,
              play_name: blitzBeaters[0].name,
              situation: 'blitz_response',
              readiness_status: 'practiced_recently',
              confidence_level: 'medium',
              why_recommended: 'Opponent shows frequent blitzes - need quick-game answers',
              coaching_point: 'Emphasize hot reads and protection adjustments',
              assumption: 'Opponent blitz tendency creates opportunity'
            });
          }
        }

        if (defensiveNotes.includes('cover 2') || defensiveNotes.includes('two-high')) {
          const deepShots = allPlays.filter(p => 
            p.concept && (p.concept.toLowerCase().includes('post') || p.concept.toLowerCase().includes('deep'))
          );

          if (deepShots.length > 0) {
            const play = deepShots[0];
            recommendations.push({
              priority_rank: recommendations.length + 1,
              play_id: play.id,
              play_name: play.name,
              situation: 'explosive_play',
              readiness_status: practicedPlayIds.has(play.id) ? 'practiced_recently' : 'new_this_week',
              confidence_level: 'medium',
              why_recommended: 'Two-high safeties create one-on-one outside matchups',
              coaching_point: 'Attack boundaries with play action',
              assumption: 'Opponent coverage scheme vulnerable to deep shots'
            });
          }
        }
      }
    }

    // Sort by priority and limit
    recommendations.sort((a, b) => a.priority_rank - b.priority_rank);
    const topRecommendations = recommendations.slice(0, 12);

    // Build game plan summary
    const practicedCount = allPlays.filter(p => practicedPlayIds.has(p.id)).length;
    const totalPlays = allPlays.length;
    const readinessPercentage = Math.round((practicedCount / totalPlays) * 100) || 0;

    const gamePlanSummary = `
Based on your ${side_of_ball} playbook (${totalPlays} plays) and practice history:
• ${practicedCount} plays (${readinessPercentage}%) practiced in last 2 weeks
• ${gaps.length} situational gaps identified
• ${topRecommendations.length} priority recommendations for this week

Focus areas: ${gaps.map(g => g.concept_missing).join(', ') || 'All situations covered'}
    `.trim();

    return Response.json({
      recommendations: topRecommendations,
      gaps,
      game_plan_summary: gamePlanSummary,
      metadata: {
        total_plays_analyzed: totalPlays,
        practiced_plays: practicedCount,
        scripts_reviewed: recentScripts.length,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});