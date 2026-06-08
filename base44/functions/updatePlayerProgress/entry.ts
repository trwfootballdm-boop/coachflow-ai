import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      team_id, 
      player_content_id, 
      progress_data 
    } = await req.json();

    if (!team_id || !player_content_id) {
      return Response.json({ 
        error: 'team_id and player_content_id are required' 
      }, { status: 400 });
    }

    // Find existing progress record
    const existing = await base44.entities.PlayerProgress.filter({
      team_id,
      player_content_id,
      player_email: user.email,
      active: true
    });

    const now = new Date().toISOString();
    const progressUpdate = {
      team_id,
      player_content_id,
      player_email: user.email,
      last_activity_date: now,
      ...progress_data
    };

    let result;
    if (existing && existing.length > 0) {
      // Update existing
      result = await base44.entities.PlayerProgress.update(
        existing[0].id,
        progressUpdate
      );
    } else {
      // Create new
      result = await base44.entities.PlayerProgress.create(progressUpdate);
    }

    // Update assignment status if applicable
    const assignments = await base44.entities.PlayerAssignment.filter({
      team_id,
      player_content_id,
      active: true
    });

    for (const assignment of assignments) {
      if (progress_data.confidence_rating || progress_data.passed_quiz) {
        await base44.entities.PlayerAssignment.update(assignment.id, {
          status: 'completed',
          completed_date: now
        });
      }
    }

    return Response.json({
      success: true,
      progress: result
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});