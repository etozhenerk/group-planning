CREATE TABLE meetings (
    id text PRIMARY KEY CHECK (id <> ''),
    organizer_id text NOT NULL,
    status text NOT NULL,
    past_at timestamptz,
    document jsonb NOT NULL CHECK (document->>'ID' = id)
);
CREATE INDEX meetings_organizer ON meetings (organizer_id, id);
CREATE INDEX meetings_overdue ON meetings (status, past_at, id);

CREATE TABLE invitations (
    token text PRIMARY KEY CHECK (token <> ''),
    id text NOT NULL UNIQUE CHECK (id <> ''),
    meeting_id text NOT NULL UNIQUE REFERENCES meetings DEFERRABLE INITIALLY DEFERRED,
    document jsonb NOT NULL CHECK (document->>'Token' = token AND document->>'ID' = id AND document->>'MeetingID' = meeting_id)
);
CREATE TABLE rsvps (
    meeting_id text NOT NULL REFERENCES meetings DEFERRABLE INITIALLY DEFERRED,
    user_id text NOT NULL CHECK (user_id <> ''),
    document jsonb NOT NULL CHECK (document->>'MeetingID' = meeting_id AND document->>'UserID' = user_id),
    PRIMARY KEY (meeting_id, user_id)
);
CREATE INDEX rsvps_user ON rsvps (user_id, meeting_id);
CREATE TABLE feed_entries (
    id text PRIMARY KEY CHECK (id <> ''),
    meeting_id text NOT NULL REFERENCES meetings DEFERRABLE INITIALLY DEFERRED,
    sequence numeric(20,0) NOT NULL CHECK (sequence > 0 AND sequence <= 18446744073709551615),
    actor_id text NOT NULL,
    client_request_id text NOT NULL,
    document jsonb NOT NULL CHECK (document->>'ID' = id AND document->>'MeetingID' = meeting_id AND (document->>'Sequence')::numeric = sequence),
    UNIQUE (meeting_id, sequence)
);
CREATE UNIQUE INDEX feed_request ON feed_entries (meeting_id, actor_id, client_request_id) WHERE client_request_id <> '';
CREATE TABLE request_receipts (
    user_id text NOT NULL CHECK (user_id <> ''),
    operation text NOT NULL CHECK (operation <> ''),
    request_key text NOT NULL CHECK (request_key <> ''),
    expires_at timestamptz NOT NULL,
    document jsonb NOT NULL,
    PRIMARY KEY (user_id, operation, request_key)
);
CREATE INDEX receipt_expiry ON request_receipts (expires_at);
CREATE TABLE transition_jobs (
    meeting_id text NOT NULL REFERENCES meetings DEFERRABLE INITIALLY DEFERRED,
    schedule_version numeric(20,0) NOT NULL CHECK (schedule_version > 0 AND schedule_version <= 18446744073709551615),
    id text NOT NULL UNIQUE CHECK (id <> ''),
    state text NOT NULL,
    due_at timestamptz NOT NULL,
    available_at timestamptz NOT NULL,
    lease_until timestamptz NOT NULL,
    document jsonb NOT NULL CHECK (document->>'ID' = id AND document->>'MeetingID' = meeting_id),
    PRIMARY KEY (meeting_id, schedule_version)
);
CREATE INDEX transition_available ON transition_jobs (state, available_at, due_at);
CREATE INDEX transition_lease ON transition_jobs (state, lease_until, due_at);
CREATE TABLE date_polls (
    id text PRIMARY KEY CHECK (id <> ''),
    meeting_id text NOT NULL REFERENCES meetings DEFERRABLE INITIALLY DEFERRED,
    document jsonb NOT NULL CHECK (document->>'ID' = id AND document->>'MeetingID' = meeting_id)
);
CREATE INDEX date_polls_meeting ON date_polls (meeting_id);
CREATE TABLE place_polls (
    id text PRIMARY KEY CHECK (id <> ''),
    meeting_id text NOT NULL REFERENCES meetings DEFERRABLE INITIALLY DEFERRED,
    document jsonb NOT NULL CHECK (document->>'ID' = id AND document->>'MeetingID' = meeting_id)
);
CREATE INDEX place_polls_meeting ON place_polls (meeting_id);
CREATE TABLE preparation_tasks (
    id text PRIMARY KEY CHECK (id <> ''),
    meeting_id text NOT NULL REFERENCES meetings DEFERRABLE INITIALLY DEFERRED,
    document jsonb NOT NULL CHECK (document->>'ID' = id AND document->>'MeetingID' = meeting_id)
);
CREATE INDEX preparation_tasks_meeting ON preparation_tasks (meeting_id, id);
CREATE TABLE meeting_covers (
    meeting_id text PRIMARY KEY REFERENCES meetings DEFERRABLE INITIALLY DEFERRED,
    document jsonb NOT NULL CHECK (document->>'MeetingID' = meeting_id)
);
CREATE TABLE identity_users (
    id text PRIMARY KEY CHECK (id <> ''),
    provider_subject text NOT NULL UNIQUE CHECK (provider_subject <> ''),
    document jsonb NOT NULL CHECK (document->>'ID' = id)
);
CREATE TABLE identity_attempts (
    id text PRIMARY KEY CHECK (id <> ''),
    expires_at timestamptz NOT NULL,
    handoff_expires_at timestamptz,
    document jsonb NOT NULL CHECK (document->>'ID' = id)
);
CREATE INDEX identity_attempt_expiry ON identity_attempts (expires_at);
CREATE TABLE identity_sessions (
    secret_hash text PRIMARY KEY CHECK (secret_hash <> ''),
    id text NOT NULL UNIQUE CHECK (id <> ''),
    user_id text NOT NULL REFERENCES identity_users DEFERRABLE INITIALLY DEFERRED,
    expires_at timestamptz NOT NULL,
    document jsonb NOT NULL CHECK (document->>'ID' = id AND document->>'UserID' = user_id AND document->>'SecretHash' = secret_hash)
);
CREATE INDEX identity_session_user ON identity_sessions (user_id);
CREATE INDEX identity_session_expiry ON identity_sessions (expires_at);
