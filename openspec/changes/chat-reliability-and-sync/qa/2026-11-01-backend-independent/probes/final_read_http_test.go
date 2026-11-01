package httpapi

import (
 "fmt"
 "net/url"
 "strings"
 "testing"
 "time"
 "github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestIndependentFinalHTTP150UUIDAndScope(t *testing.T) {
 h:=newMeetingHTTPTest(t,meetings.WithChatSyncKey([]byte(strings.Repeat("z",32))),meetings.WithChatReadState(true))
 ac,bc,xc:=h.client(true),h.client(true),h.client(true)
 a:=h.login(ac,"owner",map[string]string{"kind":"home"}); b:=h.login(bc,"guest",map[string]string{"kind":"home"}); x:=h.login(xc,"other",map[string]string{"kind":"home"})
 raw,_:=h.request(ac,"POST","/api/v1/meetings",map[string]string{"title":"Independent final","starts_on":time.Unix(h.clock.Load(),0).Add(24*time.Hour).Format(time.DateOnly),"timezone":"UTC"},headersFor(h,a,testKey("31000")),201)
 cr:=decodeMeetingTest[createdMeetingResponse](t,raw); id:=cr.Meeting.ID; base:="/api/v1/meetings/"+id
 u,_:=url.Parse(cr.InvitationURL)
 h.request(bc,"PUT","/api/v1/invitations/"+strings.TrimPrefix(u.Path,"/i/")+"/rsvp",map[string]string{"answer":"going","expected_revision":"0"},headersFor(h,b,testKey("31001")),200)
 var target meetings.FeedEntry
 if err:=h.store.Update(t.Context(),func(w meetings.Writer)error{
  for i:=0;i<150;i++ { e,err:=w.AppendEntry(meetings.FeedEntry{ID:fmt.Sprintf("abcdefab-abcd-4abc-8abc-%012d",i),MeetingID:id,ActorID:a.User.ID,Kind:"message",Payload:[]byte(`{"text":"synthetic independent"}`)});if err!=nil{return err}; if e.Sequence==150 {target=e;break} }
  return nil
 });err!=nil {t.Fatal(err)}
 if target.Sequence!=150 {t.Fatal("fixture missing150")}
 raw,_=h.request(ac,"GET",base+"/messages/"+target.ID+"/readers",nil,nil,200)
 if decodeMeetingTest[messageReadersResponse](t,raw).ReaderCount!="0"{t.Fatal("baseline manufactured receipt")}
 var previous readStateResponse
 for i,s:=range []string{"150","140","150"} {
  raw,_=h.request(bc,"PUT",base+"/read-marker",map[string]string{"read_through_sequence":s},headersFor(h,b,""),200)
  r:=decodeMeetingTest[readStateResponse](t,raw);if r.ReadThrough!="150"||r.UnreadCount!="0"{t.Fatal(r)};if i>0&&r!=previous{t.Fatal("noop effects",r,previous)};previous=r
 }
 raw,_=h.request(bc,"GET",base+"/sync",nil,nil,200);snap:=decodeMeetingTest[chatSnapshotResponse](t,raw)
 h.request(bc,"PUT",base+"/read-marker",map[string]string{"read_through_sequence":"140"},headersFor(h,b,""),200)
 raw,_=h.request(bc,"GET",base+"/sync?cursor="+url.QueryEscape(snap.ChangeCursor),nil,nil,200)
 changes:=decodeMeetingTest[chatChangesResponse](t,raw);if len(changes.Changes)!=0{t.Fatal("read-sync-read loop")}
 raw,_=h.request(bc,"GET","/api/v1/meetings",nil,nil,200);list:=decodeMeetingTest[meetingsPageResponse](t,raw);if *list.Meetings[0].UnreadCount!="0"{t.Fatal("list stale")}
 raw,_=h.request(ac,"POST",base+"/read-receipts/query",map[string]any{"entry_ids":[]string{strings.ToUpper(target.ID)}},headersFor(h,a,""),200)
 r:=decodeMeetingTest[readReceiptsResponse](t,raw);if len(r.Receipts)!=1||r.Receipts[0].EntryID!=target.ID||r.Receipts[0].ReaderCount!="1"{t.Fatal(r)}
 h.request(ac,"POST",base+"/read-receipts/query",map[string]any{"entry_ids":[]string{target.ID,strings.ToUpper(target.ID)}},headersFor(h,a,""),422)
 h.request(bc,"GET",base+"/messages/"+target.ID+"/readers",nil,nil,403)
 h.request(xc,"GET",base+"/messages/"+target.ID+"/readers?cursor=forged",nil,nil,403)
 h.request(xc,"POST",base+"/read-receipts/query",map[string]any{"entry_ids":[]string{target.ID}},headersFor(h,x,""),403)
 h.request(bc,"PUT",base+"/read-marker",map[string]string{"read_through_sequence":"151"},headersFor(h,b,""),422)
 t.Log("HTTPS actions: PUT150→140→150 retained150; same projection_version; follow-up sync empty; list unread0; uppercase UUID canonical count1; mixed-case duplicate422; nonauthor/outsider403; beyondtail422; empty readers before actual marker")
}

func TestIndependentFinalHTTPFixedThroughAndIdempotentACK(t *testing.T){
 h:=newMeetingHTTPTest(t,meetings.WithChatSyncKey([]byte(strings.Repeat("z",32))))
 c:=h.client(true);a:=h.login(c,"owner",map[string]string{"kind":"home"})
 raw,_:=h.request(c,"POST","/api/v1/meetings",map[string]string{"title":"Independent barrier","starts_on":time.Unix(h.clock.Load(),0).Add(24*time.Hour).Format(time.DateOnly),"timezone":"UTC"},headersFor(h,a,testKey("32000")),201)
 cr:=decodeMeetingTest[createdMeetingResponse](t,raw);id:=cr.Meeting.ID;base:="/api/v1/meetings/"+id
 raw,_=h.request(c,"GET",base+"/sync",nil,nil,200);initial:=decodeMeetingTest[chatSnapshotResponse](t,raw)
 actor:=meetings.Actor{ID:a.User.ID,Name:"Independent"}
 for i:=0;i<105;i++{k:=testKey(fmt.Sprint(32100+i));if _,err:=h.app.SendMessage(t.Context(),actor,id,"barrier fixture",k,k);err!=nil{t.Fatal(err)}}
 raw,_=h.request(c,"GET",base+"/sync?limit=100&cursor="+url.QueryEscape(initial.ChangeCursor),nil,nil,200);first:=decodeMeetingTest[chatChangesResponse](t,raw)
 if len(first.Changes)!=100||!first.HasMore{t.Fatal("first page")}
 k:=testKey("32900");raw,_=h.request(c,"POST",base+"/messages",map[string]string{"text":"post barrier","client_request_id":k},headersFor(h,a,k),201);sent:=decodeMeetingTest[feedEntryResponse](t,raw)
 raw,_=h.request(c,"GET",base+"/sync?limit=100&cursor="+url.QueryEscape(first.NextCursor),nil,nil,200);last:=decodeMeetingTest[chatChangesResponse](t,raw)
 if last.HasMore||len(last.Changes)!=5||last.ThroughCursor!=first.ThroughCursor{t.Fatal("moving barrier")}
 raw,_=h.request(c,"GET",base+"/sync?limit=100&cursor="+url.QueryEscape(first.NextCursor),nil,nil,200);retry:=decodeMeetingTest[chatChangesResponse](t,raw)
 if retry.NextCursor!=last.NextCursor||len(retry.Changes)!=5{t.Fatal("lost apply retry")}
 raw,_=h.request(c,"GET",base+"/sync?cursor="+url.QueryEscape(last.NextCursor),nil,nil,200);next:=decodeMeetingTest[chatChangesResponse](t,raw)
 if len(next.Changes)!=1||next.Changes[0].EntryID==nil||*next.Changes[0].EntryID!=sent.ID{t.Fatal("post-barrier missing",string(raw))}
 // HTTP client deliberately discards the first ACK; expire receipt, keep auth alive by logging in afresh.
 h.clock.Add(int64(31*24*time.Hour/time.Second));a=h.login(c,"owner",map[string]string{"kind":"home"})
 raw,_=h.request(c,"POST",base+"/messages",map[string]string{"text":"post barrier","client_request_id":k},headersFor(h,a,k),201);again:=decodeMeetingTest[feedEntryResponse](t,raw)
 if again.ID!=sent.ID||again.Sequence!=sent.Sequence{t.Fatal("duplicate after receipt expiry")}
 h.request(c,"POST",base+"/messages",map[string]string{"text":"conflict","client_request_id":k},headersFor(h,a,k),409)
 t.Log("HTTPS actions:105 changes→pages100/5; T+1 excluded until next cycle; discarded page replay identical cursor; expired receipt31d repeated HTTP ID/sequence unchanged; changed body409")
}
