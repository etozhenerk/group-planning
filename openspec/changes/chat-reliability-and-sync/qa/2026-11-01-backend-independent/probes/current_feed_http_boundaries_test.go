package httpapi

import (
 "strings"
 "testing"
 "time"
)

func TestIndependentCurrentFeedHTTPInvalidAndScope(t *testing.T) {
 h:=newMeetingHTTPTest(t);ac,xc:=h.client(true),h.client(true)
 a:=h.login(ac,"owner",map[string]string{"kind":"home"});h.login(xc,"other",map[string]string{"kind":"home"})
 raw,_:=h.request(ac,"POST","/api/v1/meetings",map[string]string{"title":"Synthetic current bounds","starts_on":time.Unix(h.clock.Load(),0).Add(24*time.Hour).Format(time.DateOnly),"timezone":"UTC"},headersFor(h,a,testKey("41000")),201)
 m:=decodeMeetingTest[createdMeetingResponse](t,raw);base:="/api/v1/meetings/"+m.Meeting.ID+"/feed"
 for _,q:=range []string{"limit=0","limit=101","after_sequence=18446744073709551616","after_sequence=-1","after_sequence=1&before_sequence=2","around_entry_id=abcdefab-abcd-4abc-8abc-000000041001&after_sequence=0"} {h.request(ac,"GET",base+"?"+q,nil,nil,400)}
 h.request(ac,"GET",base+"?around_entry_id=abcdefab-abcd-4abc-8abc-000000041001",nil,nil,404)
 for _,q:=range []string{"limit=1","after_sequence=0","around_entry_id=abcdefab-abcd-4abc-8abc-000000041001"} {
  raw,_=h.request(xc,"GET",base+"?"+q,nil,nil,403)
  for _,private:=range []string{"Synthetic current bounds","entries","latest_sequence"} {if strings.Contains(string(raw),private){t.Fatal("foreign feed disclosed projection")}}
 }
 t.Log("actual HTTPS: limit0/101, overflow, negative and incompatible cursors400; missing own around404; outsider initial/after/around403 before data lookup")
}
