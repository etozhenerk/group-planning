package realtime

import (
 "encoding/json"
 "fmt"
 "io"
 "net/http"
 "net/url"
 "strings"
 "testing"
 "time"
 "github.com/centrifugal/centrifuge"
)

type repeatSyncPage struct{ChangeCursor string `json:"change_cursor"`;NextCursor string `json:"next_cursor"`;Through string `json:"through_cursor"`;HasMore bool `json:"has_more"`;Changes []struct{EntryID string `json:"entry_id"`} `json:"changes"`}
func(f *repeatFixture)syncRTT(t *testing.T,cursor string)repeatSyncPage{
 t.Helper();path:="/api/v1/meetings/"+f.id+"/sync?limit=100";if cursor!=""{path+="&cursor="+url.QueryEscape(cursor)}
 // Explicit deterministic network model:75ms each direction, one HTTP request in flight.
 time.Sleep(75*time.Millisecond);raw:=f.req(t,repeatGuest,"GET",path,nil,200);time.Sleep(75*time.Millisecond)
 var out repeatSyncPage;if err:=json.Unmarshal(raw,&out);err!=nil{t.Fatal(err)};return out
}
func(f *repeatFixture)recoverRTT(t *testing.T,offset uint64,epoch string)(*testSocket,bool,int){
 t.Helper();time.Sleep(75*time.Millisecond);s:=openSocket(t,f.server.URL,"Authorization: Bearer "+f.tokens[repeatGuest]+"\r\n");time.Sleep(75*time.Millisecond)
 time.Sleep(75*time.Millisecond);s.command(t,`{"id":1,"connect":{}}`);time.Sleep(75*time.Millisecond);s.expect(t,`"id":1`)
 time.Sleep(75*time.Millisecond);s.command(t,fmt.Sprintf(`{"id":2,"subscribe":{"channel":"meeting:%s","recover":true,"offset":%d,"epoch":%q}}`,f.id,offset,epoch));time.Sleep(75*time.Millisecond);raw:=s.expect(t,`"id":2`)
 var reply struct{Subscribe struct{Recovered bool `json:"recovered"`;Publications []json.RawMessage `json:"publications"`} `json:"subscribe"`;Error *json.RawMessage `json:"error"`};if err:=json.Unmarshal([]byte(raw),&reply);err!=nil{t.Fatal(err)};if reply.Error!=nil{t.Fatal("subscribe error")};f.assertPrivate(t,raw);return s,reply.Subscribe.Recovered,len(reply.Subscribe.Publications)
}
func TestIndependentRepeatGapOfflineRecoveryRTT150(t *testing.T){
 f:=newRepeatFixture(t,time.Hour);initial:=f.syncRTT(t,"");first:=f.send(t,401)
 s:=f.socket(t,repeatGuest) // No dispatcher publication before subscription: actual snapshot/subscribe gap.
 gap:=f.syncRTT(t,initial.ChangeCursor);if len(gap.Changes)!=1||gap.Changes[0].EntryID!=first.ID{t.Fatal("subscribe gap lost commit")}
 if _,err:=f.app.DispatchChat(t.Context(),f.adapter);err!=nil{t.Fatal(err)}
 history,err:=f.adapter.node.History("meeting:"+f.id,centrifuge.WithLimit(0));if err!=nil{t.Fatal(err)};s.Close()
 // Controlled five-minute application offline interval. Recovery retention is explicitly exhausted
 // with the broker's public RemoveHistory hook; we do not pretend five minutes of wall time passed.
 f.clock.Add(300);want:=map[string]bool{};for i:=0;i<100;i++{e:=f.send(t,410+i);want[e.ID]=true};if _,err=f.app.DispatchChat(t.Context(),f.adapter);err!=nil{t.Fatal(err)}
 if err=f.adapter.node.RemoveHistory("meeting:"+f.id);err!=nil{t.Fatal(err)}
 started:=time.Now();resumed,recovered,_:=f.recoverRTT(t,history.Offset,history.Epoch);if recovered{t.Fatal("expired recovery unexpectedly recovered")};page:=f.syncRTT(t,gap.NextCursor);duration:=time.Since(started)
 if len(page.Changes)!=100||page.HasMore{t.Fatal("missing bounded100",len(page.Changes),page.HasMore)};for _,ch:=range page.Changes{if !want[ch.EntryID]{t.Fatal("duplicate or foreign change")};delete(want,ch.EntryID)};if len(want)!=0||duration>2*time.Second{t.Fatal("recovery budget",duration,len(want))}
 // Separate short gap retains broker history. Even recovered=true must still issue HTTP catch-up.
 f.send(t,601);if _,err=f.app.DispatchChat(t.Context(),f.adapter);err!=nil{t.Fatal(err)};aligned:=f.syncRTT(t,page.NextCursor)
 history,err=f.adapter.node.History("meeting:"+f.id,centrifuge.WithLimit(0));if err!=nil{t.Fatal(err)};resumed.Close();last:=f.send(t,602);if _,err=f.app.DispatchChat(t.Context(),f.adapter);err!=nil{t.Fatal(err)}
 started=time.Now();successful,ok,count:=f.recoverRTT(t,history.Offset,history.Epoch);defer successful.Close();if !ok||count<1{t.Fatal("successful broker recovery not exercised",ok,count)}
 final:=f.syncRTT(t,aligned.NextCursor);if len(final.Changes)!=1||final.Changes[0].EntryID!=last.ID{t.Fatal("successful recovery incorrectly replaced HTTP")};if time.Since(started)>2*time.Second{t.Fatal("recovered path budget")}
 f.assertPrivate(t,f.logs.String());t.Logf("snapshot-subscribe gap recovered one ID; controlled offline300s + broker history expiration;100 IDs exactly once; RTT150ms recovery=%s≤2s; separate recovered=true publications=%d still followed by HTTP catch-up",duration,count)
}

func TestIndependentRepeatRejectedCredentialsNeverInURL(t *testing.T){
 f:=newRepeatFixture(t,time.Hour);request,_:=http.NewRequest("GET",f.server.URL+"/api/v1/realtime?token=synthetic-query-marker",nil);request.Header.Set("Authorization","Bearer "+f.tokens[repeatOwner]);response,err:=http.DefaultClient.Do(request);if err!=nil{t.Fatal(err)};defer response.Body.Close();body,_:=io.ReadAll(response.Body);if response.StatusCode!=400{t.Fatal(response.StatusCode)};f.assertPrivate(t,string(body),f.logs.String());if strings.Contains(f.logs.String(),"synthetic-query-marker"){t.Fatal("rejected URL token logged")};t.Log("credential query rejected400; URL/query not logged")
}
