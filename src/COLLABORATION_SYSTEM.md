# Multi-Coach Collaboration & Approval System

## Overview

A comprehensive collaboration system for football coaching staffs, enabling role-based permissions, comments, approvals, change history, and shared planning workflows across all app modules.

## New Entities

### 1. Staff
**Purpose**: Manage coaching staff with roles and granular permissions

**Key Fields**:
- `role`: head_coach, offensive_coordinator, defensive_coordinator, special_teams_coordinator, position_coach, analyst, graduate_assistant
- `permissions`: Granular control over create/edit/approve/delete for plays, scripts, game plans
- `side_of_ball`: offense, defense, special_teams, all
- `position_group`: Specific position group (e.g., QBs, WRs, LBs)

**Default Permissions by Role**:
- **Head Coach**: Full admin rights, can approve all items, invite staff
- **Coordinators**: Can approve plays/scripts in their side of ball
- **Position Coaches**: Can create/edit but not approve
- **Analysts**: Can view and comment, limited editing
- **Graduate Assistants**: Basic create/edit rights

### 2. CollaborationComment
**Purpose**: Threaded comments on any entity (plays, scripts, game plans, scout cards, weekly plans)

**Key Fields**:
- `parent_type` / `parent_id`: Polymorphic reference to commented item
- `comment_type`: general, suggestion, question, approval, revision_request
- `parent_comment_id`: For threaded replies
- `is_resolved`: Track resolved discussions
- `mentioned_user_ids`: Notify specific staff members
- `attachments`: File attachments (diagrams, videos, etc.)

**Features**:
- Type-specific badges and icons
- Threading/replies
- Edit/delete capabilities
- Resolution tracking
- @mentions (future enhancement)

### 3. ApprovalWorkflow
**Purpose**: Track approval status and version history for all entities

**Key Fields**:
- `status`: draft, pending_review, approved, revision_requested, rejected
- `version_number`: Auto-incrementing version tracking
- `previous_version_id`: Link to previous version
- `approval_history`: Complete audit trail of actions
- `change_summary`: What changed in this version

**Workflow States**:
1. **Draft**: Initial creation, editable by author
2. **Pending Review**: Submitted for approval, locked for editing
3. **Approved**: Ready for use in game plans/practice
4. **Revision Requested**: Sent back with notes
5. **Rejected**: Not approved, requires major changes

### 4. ChangeLog
**Purpose**: Complete audit trail of all changes across the system

**Key Fields**:
- `entity_type` / `entity_id`: What changed
- `changed_fields`: Array of field-level changes with old/new values
- `change_type`: create, update, delete, status_change, approval_change
- `previous_version_snapshot` / `new_version_snapshot`: Full state snapshots
- `is_major_change`: Flag for significant changes
- `related_comment_id` / `related_approval_id`: Link to collaboration context

**Features**:
- Field-level change tracking
- Before/after snapshots
- Human-readable summaries
- Filterable by user, entity type, date range

## Backend Functions

### generatePlayRecommendations
**Purpose**: AI-powered play recommendations based on opponent analysis and team readiness

**Inputs**:
- `team_id`: Team context
- `opponent_id`: Opponent to analyze
- `week_number`: Current week
- `side_of_ball`: offense/defense/special_teams

**Analysis Performed**:
1. **Practice History**: Identifies plays practiced in last 14 days
2. **Situation Coverage**: Checks for gaps in critical situations (openers, red zone, 3rd down, etc.)
3. **Opponent Tendencies**: Recommends counters to opponent's defensive/offensive schemes
4. **Readiness Scoring**: Rates plays as:
   - `practiced_recently`: High confidence
   - `installed_but_stale`: Needs review
   - `new_this_week`: Fresh install

**Output**:
- Prioritized play recommendations (8-12 plays)
- Identified playbook gaps
- Game plan summary with readiness metrics

## UI Components

### 1. PlayRecommendationsPanel
**Location**: `components/game-planning/PlayRecommendationsPanel.jsx`

**Features**:
- AI-generated play recommendations with confidence levels
- Readiness status indicators (practiced/stale/new)
- Coaching points for each recommendation
- Playbook gap warnings
- Bulk selection and "Add to Game Plan" functionality
- Visual hierarchy with color-coded badges

**Integration**: Use in GamePlanning page for AI-assisted game planning

### 2. StaffManagementPanel
**Location**: `components/collaboration/StaffManagementPanel.jsx`

**Features**:
- Staff directory with role badges
- Search functionality
- Add staff member dialog with role/permission configuration
- Permission visualization
- Deactivation capability

**Integration**: Use in Settings or dedicated Staff page

### 3. CommentThread
**Location**: `components/collaboration/CommentThread.jsx`

**Features**:
- Threaded comments with type selection
- Visual type indicators (suggestion, question, approval, revision)
- Edit/delete capabilities
- Reply functionality
- Resolution tracking
- Avatar display

**Integration**: Add to PlayDesigner, PracticeScripts, GamePlanning pages

### 4. Collaboration Hub (Page)
**Location**: `pages/Collaboration.jsx`

**Features**:
- Dashboard view of all collaboration activity
- Stats overview (staff count, comments, pending approvals, changes)
- Activity log with filtering
- Pending approvals queue
- Recent changes timeline

**Route**: `/collaboration`

## Integration Guide

### Adding Comments to Existing Pages

```jsx
import CommentThread from '@/components/collaboration/CommentThread';

// In your page component
<CommentThread
  parentType="play" // or "practice_script", "game_plan", "scout_card", "weekly_plan"
  parentId={play.id}
  teamId={activeTeamId}
/>
```

### Adding Approval Workflow

```jsx
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// Fetch approval status
const { data: approval } = useQuery({
  queryKey: ['approval', 'play', playId],
  queryFn: async () => {
    const approvals = await base44.entities.ApprovalWorkflow.filter({
      parent_type: 'play',
      parent_id: playId
    });
    return approvals[0];
  }
});

// Submit for approval
const submitMutation = useMutation({
  mutationFn: async () => {
    await base44.entities.ApprovalWorkflow.create({
      team_id: teamId,
      parent_type: 'play',
      parent_id: playId,
      status: 'pending_review',
      submitted_by: user.id,
      submitted_date: new Date().toISOString(),
      version_number: 1
    });
  }
});
```

### Tracking Changes

```jsx
// After updating an entity
await base44.entities.ChangeLog.create({
  team_id: teamId,
  entity_type: 'play',
  entity_id: playId,
  user_id: user.id,
  user_name: user.full_name,
  user_role: staffRole,
  change_type: 'update',
  changed_fields: [
    { field_name: 'name', old_value: oldName, new_value: newName, field_label: 'Play Name' }
  ],
  change_summary: 'Updated play name',
  timestamp: new Date().toISOString()
});
```

## Permission Enforcement

### Backend Function Example

```javascript
// In backend functions, check permissions before allowing actions
const user = await base44.auth.me();
const staff = await base44.entities.Staff.filter({ 
  team_id: teamId, 
  user_id: user.id 
});

if (!staff[0]?.permissions?.can_approve_plays) {
  return Response.json({ error: 'Forbidden' }, { status: 403 });
}
```

### Frontend Permission Guards

```jsx
// Conditionally render UI based on permissions
{staff?.permissions?.can_approve_plays && (
  <Button onClick={submitForApproval}>Submit for Approval</Button>
)}

{staff?.permissions?.can_edit_plays ? (
  <EditablePlayForm />
) : (
  <ReadOnlyPlayView />
)}
```

## Best Practices

### 1. Approval Workflow
- Always create ApprovalWorkflow record when status changes
- Lock entity editing when `status === 'pending_review'`
- Require approval for game plan inclusion
- Track all approval actions in history array

### 2. Change Tracking
- Log changes for all create/update/delete operations
- Include field-level detail in `changed_fields`
- Provide human-readable `change_summary`
- Mark major changes (e.g., diagram changes, play concept changes)

### 3. Comments
- Use appropriate `comment_type` for context
- Resolve comments when addressed
- Link comments to approval workflows when relevant
- Encourage coaches to use @mentions for specific questions

### 4. Version Control
- Increment `version_number` on each approval cycle
- Link `previous_version_id` for traceability
- Preserve old versions for comparison
- Show version history in UI

## Future Enhancements

### Planned Features
1. **Real-time Notifications**: Push notifications for comments, approvals, changes
2. **Email Digests**: Daily/weekly summary of collaboration activity
3. **Version Comparison**: Side-by-side diff viewer for play diagrams
4. **Approval Templates**: Pre-configured approval workflows by entity type
5. **Bulk Approvals**: Approve multiple items at once
6. **Comment Reactions**: Emoji reactions to comments
7. **Assignment Tracking**: Assign action items from comments
8. **Integration Calendar**: Show practice dates, game dates, approval deadlines

### Advanced Analytics
- Staff engagement metrics (comments per coach, approval velocity)
- Playbook readiness scores
- Collaboration quality indicators
- Time-to-approval tracking

## Migration Guide

### Adding to Existing Entities

To add collaboration to an existing entity (e.g., Play, PracticeScript):

1. **Add approval status field** (optional, for quick filtering):
```json
{
  "approval_status": {
    "type": "string",
    "enum": ["draft", "pending_review", "approved", "revision_requested"],
    "default": "draft"
  }
}
```

2. **Create ApprovalWorkflow on entity creation**:
```javascript
// After creating a play
await base44.entities.ApprovalWorkflow.create({
  team_id: teamId,
  parent_type: 'play',
  parent_id: newPlayId,
  status: 'draft',
  version_number: 1
});
```

3. **Add CommentThread component** to entity detail views

4. **Log changes** in update/delete operations

## Security Considerations

1. **Permission Validation**: Always validate permissions in backend functions, not just frontend
2. **Team Isolation**: Ensure all queries include `team_id` filter
3. **Audit Trail**: Log all permission changes and admin actions
4. **Data Retention**: Consider retention policies for old comments and change logs

## Support

For questions or issues with the collaboration system:
- Check entity schemas in `entities/` folder
- Review component documentation in `components/collaboration/`
- See backend function examples in `functions/`
- Test in Collaboration Hub page at `/collaboration