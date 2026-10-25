CREATE TABLE observability.login_daily (
    day date PRIMARY KEY,
    successful_logins bigint NOT NULL CHECK (successful_logins >= 0)
);

CREATE FUNCTION observability.count_login() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
BEGIN
    INSERT INTO observability.login_daily(day, successful_logins)
    VALUES ((CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date, 1)
    ON CONFLICT (day) DO UPDATE
    SET successful_logins = observability.login_daily.successful_logins + 1;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION observability.count_login() FROM PUBLIC;
CREATE TRIGGER somewhere_count_login AFTER INSERT ON public.identity_sessions
FOR EACH ROW EXECUTE FUNCTION observability.count_login();

CREATE VIEW observability.business_metrics WITH (security_barrier = true) AS
WITH messages AS (
    SELECT meeting_id FROM public.feed_entries WHERE document->>'Kind' = 'message'
), counts AS (
    SELECT (SELECT count(*) FROM public.identity_users) AS users,
           (SELECT count(*) FROM public.meetings) AS meetings,
           (SELECT count(*) FROM messages) AS messages,
           (SELECT count(DISTINCT meeting_id) FROM messages) AS chats_with_messages,
           (SELECT coalesce(sum(successful_logins), 0) FROM observability.login_daily) AS logins,
           (SELECT coalesce(sum(successful_logins), 0) FROM observability.login_daily
            WHERE day = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date) AS logins_today,
           (SELECT extract(epoch FROM installed_at) FROM observability.installations
            WHERE component = 'business-v1') AS tracking_started
)
SELECT metric, value FROM counts CROSS JOIN LATERAL (VALUES
    ('users', users::double precision),
    ('meetings', meetings::double precision),
    ('chats', meetings::double precision),
    ('chats_with_messages', chats_with_messages::double precision),
    ('messages', messages::double precision),
    ('logins_total', logins::double precision),
    ('logins_today', logins_today::double precision),
    ('tracking_started_timestamp_seconds', tracking_started::double precision)
) AS metrics(metric, value);

REVOKE ALL ON SCHEMA observability FROM PUBLIC, somewhere;
REVOKE ALL ON ALL TABLES IN SCHEMA observability FROM PUBLIC, somewhere, somewhere_metrics;
GRANT USAGE ON SCHEMA observability TO somewhere_metrics;
GRANT SELECT ON observability.business_metrics TO somewhere_metrics;
