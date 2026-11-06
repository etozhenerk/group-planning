package httpapi

import (
    "encoding/json"
    "io"
    "log/slog"
    "net/http"
    "net/http/httptest"
    "os"
    "path/filepath"
    "testing"

    "github.com/etozhenerk/group-planning/backend/internal/meetings"
)

// QA-only overlay: this file is not added to the backend implementation tree.
func TestPublicOrganizerIndependentQA(t *testing.T) {
    h := newMeetingHTTPTest(t)
    created, err := h.app.Create(t.Context(), meetings.Actor{ID:"4de88c12-e0d5-49b9-a448-f7e1b34eaf03", Name:"Never persisted identity"}, meetings.CreateInput{Title:"Missing public identity QA", StartsOn:"2099-10-24", Timezone:"Europe/Moscow"}, "5749f3f0-25fc-4710-b26f-f9f412d93277")
    if err != nil { t.Fatal(err) }
    read := func(t *testing.T, origin string, client *http.Client, output string) {
        t.Helper()
        response, err := client.Get(origin+"/api/v1/invitations/"+created.InvitationToken)
        if err != nil { t.Fatal(err) }
        defer response.Body.Close()
        raw, err := io.ReadAll(response.Body)
        if err != nil { t.Fatal(err) }
        if response.StatusCode != 200 { t.Fatalf("preview status=%d body=%s",response.StatusCode,raw) }
        if err:=os.WriteFile(filepath.Join(os.Getenv("QA_EVIDENCE_DIR"),output),raw,0600);err!=nil {t.Fatal(err)}
        var value map[string]json.RawMessage
        if err := json.Unmarshal(raw,&value);err!=nil {t.Fatal(err)}
        if _, exists := value["organizer"]; exists { t.Errorf("absent real identity should omit optional organizer; actual=%s",value["organizer"]) }
        if string(value["my_rsvp"])!="null" || string(value["my_rsvp_revision"])!=`"0"` { t.Errorf("unexpected RSVP snapshot: %s",raw) }
        for _, key := range []string{"meeting_id","title","starts_at","timezone","place","cover_url","my_rsvp","my_rsvp_revision"} {
            if _, exists:=value[key];!exists { t.Errorf("legacy required field missing: %s",key) }
        }
        t.Logf("HTTP200 public preview recorded in %s", output)
    }
    t.Run("identity_service_present_but_user_missing",func(t *testing.T){read(t,h.server.URL,h.anonymous,"missing-identity-preview.json")})
    t.Run("identity_service_disabled",func(t *testing.T){
        server:=httptest.NewTLSServer(New(h.app,slog.New(slog.NewTextHandler(io.Discard,nil))))
        defer server.Close()
        read(t,server.URL,server.Client(),"no-identity-service-preview.json")
    })
}
