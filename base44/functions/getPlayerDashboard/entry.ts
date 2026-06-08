import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { team_id, position } = await req.json();

    if (!team_id) {
      return Response.json({ error: 'team_id is required' }, { status: 400 });
    }

    // Get player roster record
    const players = await base44.entities.Player.filter({
      team_id,
      active: true
    });

    const player = players.find(p => {
      // Match by user email if available, or by position filter
      return position ? p.position === position : true;
    });

    // Get published player content for this team/position
    const allContent = await base44.entities.PlayerContent.filter({
      team_id,
      publish_status: 'published',
      active: true
    });

    // Filter by position groups or all-team content
    const visibleContent = allContent.filter(content => {
      if (!content.position_groups || content.position_groups.length === 0) {
        return true; // Available to all
      }
      if (!position) {
        return false;
      }
      return content.position_groups.includes(position) || 
             content.position_groups.includes('all');
    });

    // Get player's progress
    const progressRecords = await base44.entities.PlayerProgress.filter({
      team_id,
      player_email: user.email,
      active: true
    });

    const progressMap = {};
    progressRecords.forEach(p => {
      progressMap[p.player_content_id] = p;
    });

    // Get weekly packages
    const packages = await base44.entities.WeeklyInstallPackage.filter({
      team_id,
      publish_status: 'published',
      active: true
    });

    // Sort by publish date (newest first)
    visibleContent.sort((a, b) => {
      return new Date(b.published_date) - new Date(a.published_date);
    });

    // Calculate completion stats
    const total = visibleContent.length;
    const completed = visibleContent.filter(c => {
      const progress = progressMap[c.id];
      return progress && (progress.passed_quiz || progress.confidence_rating >= 4);
    }).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return Response.json({
      player: player || null,
      content: visibleContent.map(c => ({
        ...c,
        progress: progressMap[c.id] || null
      })),
      weekly_packages: packages,
      stats: {
        total,
        completed,
        completion_rate: completionRate,
        pending: total - completed
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});