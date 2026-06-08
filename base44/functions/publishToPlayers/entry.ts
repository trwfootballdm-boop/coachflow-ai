import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only coaches with appropriate roles can publish
    const staff = await base44.entities.Staff.filter({
      user_email: user.email,
      active: true
    });

    if (!staff || staff.length === 0) {
      return Response.json({ 
        error: 'Only coaching staff can publish content to players' 
      }, { status: 403 });
    }

    const staffMember = staff[0];
    const { content_type, content_ids, target_groups, publish_date } = await req.json();

    if (!content_type || !content_ids || !target_groups) {
      return Response.json({ 
        error: 'Missing required fields: content_type, content_ids, target_groups' 
      }, { status: 400 });
    }

    const playerContents = [];
    const now = new Date().toISOString();

    // Create player content records for each selected item
    for (const contentId of content_ids) {
      let sourceData;
      
      // Fetch source data based on content type
      if (content_type === 'play') {
        sourceData = await base44.entities.Play.get(contentId);
      } else if (content_type === 'practice_script') {
        sourceData = await base44.entities.PracticeScript.get(contentId);
      } else if (content_type === 'game_plan') {
        sourceData = await base44.entities.GamePlan.get(contentId);
      } else if (content_type === 'scout_card') {
        sourceData = await base44.entities.ScoutCardSet.get(contentId);
      } else {
        return Response.json({ 
          error: `Unsupported content type: ${content_type}` 
        }, { status: 400 });
      }

      if (!sourceData) {
        continue;
      }

      // Create player content record
      const playerContent = await base44.entities.PlayerContent.create({
        team_id: sourceData.team_id,
        content_type,
        source_id: contentId,
        title: sourceData.name || sourceData.title,
        description: sourceData.coaching_points || sourceData.notes || '',
        side_of_ball: sourceData.side || sourceData.side_of_ball || 'offense',
        position_groups: target_groups,
        publish_status: 'published',
        published_date: publish_date || now,
        published_by_email: user.email,
        diagram_data: sourceData.diagram_data,
        assignments: sourceData.assignments,
        version: sourceData.version || 1
      });

      playerContents.push(playerContent);

      // Create assignments for each position group
      for (const positionGroup of target_groups) {
        await base44.entities.PlayerAssignment.create({
          team_id: sourceData.team_id,
          player_content_id: playerContent.id,
          position_group: positionGroup,
          assignment_type: 'learn',
          assignment_description: `Learn and understand ${sourceData.name || sourceData.title}`,
          due_date: publish_date,
          status: 'pending'
        });
      }
    }

    return Response.json({ 
      success: true,
      published_count: playerContents.length,
      content_ids: playerContents.map(c => c.id)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});