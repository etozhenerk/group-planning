CREATE TABLE meeting_read_markers (
    meeting_id text NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    user_id text NOT NULL CHECK (user_id<>''),
    unread_baseline_sequence numeric(20,0) NOT NULL CHECK (unread_baseline_sequence>=0 AND unread_baseline_sequence<=18446744073709551615),
    read_through_sequence numeric(20,0) NOT NULL DEFAULT 0 CHECK (read_through_sequence>=0 AND read_through_sequence<=18446744073709551615),
    updated_at timestamptz NOT NULL,
    PRIMARY KEY(meeting_id,user_id)
);
CREATE INDEX meeting_read_markers_position ON meeting_read_markers(meeting_id,read_through_sequence,user_id);
CREATE INDEX meeting_read_markers_user ON meeting_read_markers(user_id,meeting_id);
CREATE INDEX feed_unread_messages ON feed_entries(meeting_id,sequence) INCLUDE (id,actor_id) WHERE document->>'Kind'='message';
-- Baselines are inserted under the regular meeting write lock on first feature
-- activation, not at schema deployment while the feature remains disabled.
