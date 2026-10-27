CREATE TABLE meeting_streams (
    meeting_id text PRIMARY KEY REFERENCES meetings(id) ON DELETE CASCADE,
    epoch text NOT NULL CHECK (epoch <> ''),
    latest_change_sequence numeric(20,0) NOT NULL DEFAULT 0 CHECK (latest_change_sequence >= 0 AND latest_change_sequence <= 18446744073709551615),
    retained_after numeric(20,0) NOT NULL DEFAULT 0 CHECK (retained_after >= 0 AND retained_after <= latest_change_sequence)
);
INSERT INTO meeting_streams(meeting_id,epoch) SELECT id,gen_random_uuid()::text FROM meetings;
CREATE TABLE meeting_changes (
    meeting_id text NOT NULL REFERENCES meeting_streams(meeting_id) ON DELETE CASCADE,
    change_sequence numeric(20,0) NOT NULL CHECK (change_sequence > 0 AND change_sequence <= 18446744073709551615),
    kind text NOT NULL CHECK (kind IN ('entry_upsert','entry_removed','meeting_changed','receipts_changed','history_invalidated')),
    entry_id text NOT NULL,
    resource_kind text NOT NULL,
    resource_id text NOT NULL,
    created_at timestamptz NOT NULL,
    PRIMARY KEY(meeting_id,change_sequence)
);
CREATE INDEX meeting_changes_age ON meeting_changes(created_at);
-- No meeting FK: terminal personal hints must outlive meeting deletion.
CREATE TABLE realtime_outbox (
    id text PRIMARY KEY CHECK (id <> ''),
    target text NOT NULL CHECK (target IN ('meeting','user')),
    target_id text NOT NULL CHECK (target_id <> ''),
    meeting_id text NOT NULL CHECK (meeting_id <> ''),
    epoch text NOT NULL,
    latest_change_sequence numeric(20,0) NOT NULL CHECK (latest_change_sequence >= 0 AND latest_change_sequence <= 18446744073709551615),
    schema_version integer NOT NULL CHECK (schema_version=1),
    terminal boolean NOT NULL,
    created_at timestamptz NOT NULL,
    available_at timestamptz NOT NULL,
    attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    dispatched_at timestamptz,
    CHECK ((target='meeting' AND target_id=meeting_id AND epoch<>'' AND NOT terminal) OR (target='user' AND (terminal OR epoch<>'')))
);
CREATE INDEX realtime_outbox_pending ON realtime_outbox(available_at,created_at,id) WHERE dispatched_at IS NULL;
CREATE INDEX realtime_outbox_recipient ON realtime_outbox(target,target_id);
CREATE INDEX realtime_outbox_meeting ON realtime_outbox(meeting_id) WHERE target='meeting';
