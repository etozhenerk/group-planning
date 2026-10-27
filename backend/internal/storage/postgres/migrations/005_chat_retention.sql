ALTER TABLE realtime_outbox ADD COLUMN invalidation boolean NOT NULL DEFAULT false;
CREATE INDEX meeting_changes_retention ON meeting_changes(meeting_id,created_at,change_sequence);
CREATE INDEX realtime_outbox_age ON realtime_outbox(created_at,id);
CREATE INDEX message_reactions_window ON message_reactions(meeting_id,entry_id);
