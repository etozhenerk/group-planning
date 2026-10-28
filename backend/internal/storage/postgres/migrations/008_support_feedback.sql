-- Feedback and delivery progress share one transaction, independent of meetings.
CREATE TABLE support_feedback (
    request_key text PRIMARY KEY CHECK (request_key<>''),
    id text NOT NULL UNIQUE CHECK (id<>''),
    created_at timestamptz NOT NULL,
    document jsonb NOT NULL
);
CREATE INDEX support_feedback_retention ON support_feedback(created_at);

CREATE TABLE support_rate_windows (
    source_key text PRIMARY KEY CHECK (source_key<>''),
    expires_at timestamptz NOT NULL,
    document jsonb NOT NULL
);
CREATE INDEX support_rate_windows_expiry ON support_rate_windows(expires_at);
