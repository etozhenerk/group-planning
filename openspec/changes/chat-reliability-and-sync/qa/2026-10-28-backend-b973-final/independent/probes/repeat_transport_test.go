package realtime

import (
 "bytes"
 "context"
 "crypto/sha256"
 "encoding/base64"
 "encoding/hex"
 "encoding/json"
 "errors"
 "fmt"
 "io"
 "log/slog"
 "net/http"
 "net/http/httptest"
 "strings"
 "sync"
 "sync/atomic"
 "testing"
 "time"

 "github.com/etozhenerk/group-planning/backend/internal/httpapi"
 "github.com/etozhenerk/group-planning/backend/internal/identity"
 "github.com/etozhenerk/group-planning/backend/internal/meetings"
 "github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

const repeatOwner="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
const repeatGuest="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
const repeatObserver="cccccccc-cccc-4ccc-8ccc-cccccccccccc"
const repeatSecretText="QA-PRIVATE-BODY-DO-NOT-LOG-3891"
const repeatSecretError="QA-PRIVATE-STORAGE-ERROR-DO-NOT-LOG-4721"

type repeatSafeLog struct { mu sync.Mutex; data bytes.Buffer }
func(l *repeatSafeLog)Write(p []byte)(int,error){l.mu.Lock();defer l.mu.Unlock();return l.data.Write(p)}
func(l *repeatSafeLog)String()string{l.mu.Lock();defer l.mu.Unlock();return l.data.String()}

type repeatGate struct{meetings.Store; arm atomic.Bool; mode atomic.Int32; entered,release chan struct{}}
func(s *repeatGate)View(ctx context.Context,fn func(meetings.Reader)error)error{
 if s.arm.CompareAndSwap(true,false){close(s.entered);select{case<-s.release:case<-ctx.Done():return ctx.Err()}}
 switch s.mode.Load(){case 1:return errors.New(repeatSecretError);case 2:panic(repeatSecretError)}
 return s.Store.View(ctx,fn)
}
func(s *repeatGate)Update(ctx context.Context,fn func(meetings.Writer)error)error{if s.mode.Load()==3{return errors.New(repeatSecretError)};return s.Store.Update(ctx,fn)}
func(s *repeatGate)prepareGate(){s.entered=make(chan struct{});s.release=make(chan struct{});s.arm.Store(true)}

type repeatFixture struct{store meetings.Store; identities identity.Store; gate *repeatGate; app *meetings.Service; auth *identity.Service; adapter *Adapter; server *httptest.Server; logs *repeatSafeLog; clock atomic.Int64; tokens map[string]string; id,invite string}
func repeatKey(n int)string{return fmt.Sprintf("deadbeef-abcd-4abc-8abc-%012d",n)}
func newRepeatFixture(t *testing.T,lifetime time.Duration)*repeatFixture{return repeatFixtureWithStores(t,memory.New(),memory.NewIdentity(),lifetime)}
func repeatFixtureWithStores(t *testing.T,store meetings.Store,identities identity.Store,lifetime time.Duration)*repeatFixture{
 t.Helper();f:=&repeatFixture{store:store,identities:identities,logs:&repeatSafeLog{},tokens:map[string]string{}};f.clock.Store(time.Now().Unix())
 f.gate=&repeatGate{Store:store};f.app=meetings.NewService(f.gate,func()time.Time{return time.Unix(f.clock.Load(),0)},meetings.WithChatSyncKey([]byte(strings.Repeat("q",32))),meetings.WithChatReadState(true))
 var err error;f.auth,err=identity.New(identity.Config{PublicOrigin:"https://somewhere.test",SessionTTL:time.Hour},identities,unusedProvider{},time.Now,func(context.Context,string)(bool,error){return false,nil});if err!=nil{t.Fatal(err)}
 err=identities.Update(t.Context(),func(r identity.Records)error{
  for i,user:=range []string{repeatOwner,repeatGuest,repeatObserver}{token:=base64.RawURLEncoding.EncodeToString([]byte(strings.Repeat(fmt.Sprint(i+1),32)));f.tokens[user]=token;sum:=sha256.Sum256([]byte(token));if err:=r.PutUser("repeat-"+user,identity.User{ID:user,DisplayName:"Synthetic "+fmt.Sprint(i),CreatedAt:time.Now()});err!=nil{return err};r.PutSession(identity.Session{ID:"repeat-session-"+user,UserID:user,SecretHash:hex.EncodeToString(sum[:]),ClientKind:"ios",ExpiresAt:time.Now().Add(lifetime)})};return nil});if err!=nil{t.Fatal(err)}
 f.adapter,err=New(f.app,f.auth);if err!=nil{t.Fatal(err)}
 f.server=httptest.NewServer(httpapi.NewWithRealtime(f.app,f.auth,nil,slog.New(slog.NewJSONHandler(f.logs,nil)),f.adapter.ServeAuthenticatedHTTP))
 t.Cleanup(func(){ctx,cancel:=context.WithTimeout(context.Background(),3*time.Second);defer cancel();f.adapter.Close(ctx);f.server.Close()})
 c,err:=f.app.Create(t.Context(),meetings.Actor{ID:repeatOwner,Name:"Synthetic owner"},meetings.CreateInput{Title:"Independent repeat",StartsOn:time.Now().Add(24*time.Hour).Format(time.DateOnly),Timezone:"UTC"},repeatKey(1));if err!=nil{t.Fatal(err)};f.id=c.Details.Meeting.ID;f.invite=c.InvitationToken
 if _,err=f.app.Respond(t.Context(),meetings.Actor{ID:repeatGuest,Name:"Synthetic guest"},"",f.invite,meetings.Going,0,repeatKey(2));err!=nil{t.Fatal(err)}
 if _,err=f.app.Respond(t.Context(),meetings.Actor{ID:repeatObserver,Name:"Synthetic observer"},"",f.invite,meetings.NotGoing,0,repeatKey(3));err!=nil{t.Fatal(err)}
 if err=f.app.InitializeChatReadState(t.Context());err!=nil{t.Fatal(err)}
 return f
}
func(f *repeatFixture)req(t *testing.T,user,method,path string,body any,want int)[]byte{
 t.Helper();var data []byte;if body!=nil{data,_=json.Marshal(body)};r,err:=http.NewRequest(method,f.server.URL+path,bytes.NewReader(data));if err!=nil{t.Fatal(err)};r.Header.Set("Authorization","Bearer "+f.tokens[user]);if body!=nil{r.Header.Set("Content-Type","application/json")};if method=="POST"{r.Header.Set("Idempotency-Key",repeatKey(799))};resp,err:=http.DefaultClient.Do(r);if err!=nil{t.Fatal(err)};defer resp.Body.Close();out,_:=io.ReadAll(resp.Body);if resp.StatusCode!=want{t.Fatalf("%s %s got%d want%d (body omitted)",method,path,resp.StatusCode,want)};return out
}
func(f *repeatFixture)send(t *testing.T,n int)meetings.FeedEntry{t.Helper();e,err:=f.app.SendMessage(t.Context(),meetings.Actor{ID:repeatOwner,Name:"Synthetic owner"},f.id,repeatSecretText,repeatKey(n),repeatKey(n));if err!=nil{t.Fatal(err)};return e}
func(f *repeatFixture)socket(t *testing.T,user string)*testSocket{t.Helper();s:=openSocket(t,f.server.URL,"Authorization: Bearer "+f.tokens[user]+"\r\n");s.command(t,`{"id":1,"connect":{}}`);s.expect(t,`"personal:`+user+`"`);s.command(t,fmt.Sprintf(`{"id":2,"subscribe":{"channel":"meeting:%s"}}`,f.id));s.expect(t,`"id":2`);return s}
func(f *repeatFixture)assertPrivate(t *testing.T,blobs ...string){t.Helper();for _,blob:=range blobs{for _,secret:=range []string{repeatSecretText,repeatSecretError,f.tokens[repeatOwner],f.tokens[repeatGuest],f.tokens[repeatObserver]}{if strings.Contains(blob,secret){t.Fatal("private marker leaked; contents omitted")}}}}

func TestIndependentRepeatSessionExpiryRevokeAndLateRequests(t *testing.T){
 for _,mode:=range []string{"revoke","expiry"}{t.Run(mode,func(t *testing.T){
  ttl:=time.Hour;if mode=="expiry"{ttl=2*time.Second};f:=newRepeatFixture(t,ttl);s:=f.socket(t,repeatGuest)
  if mode=="revoke"{if err:=f.auth.Logout(t.Context(),f.tokens[repeatGuest]);err!=nil{t.Fatal(err)}}
  started:=time.Now();s.expect(t,"3503");if time.Since(started)>4*time.Second{t.Fatal("session close late")}
  f.send(t,100);if _,err:=f.app.DispatchChat(t.Context(),f.adapter);err!=nil{t.Fatal(err)}
  for _,path:=range []string{"/api/v1/chat-capabilities","/api/v1/meetings/"+f.id+"/sync","/api/v1/realtime"}{body:=f.req(t,repeatGuest,"GET",path,nil,401);f.assertPrivate(t,string(body))}
  f.assertPrivate(t,f.logs.String());t.Logf("%s: activeWS closed3503; committed latehint cannot restore session; post-close HTTP sync/capabilities/reconnect401; logs contain safe request IDs/status only",mode)
 })}
}

func TestIndependentRepeatHintThenDelayedHTTPRevocation(t *testing.T){
 f:=newRepeatFixture(t,time.Hour);s:=f.socket(t,repeatGuest);entry:=f.send(t,201);if _,err:=f.app.DispatchChat(t.Context(),f.adapter);err!=nil{t.Fatal(err)};hint:=s.expect(t,`"latest_change_sequence"`);f.assertPrivate(t,hint)
 f.gate.prepareGate();defer func(){if f.gate.release!=nil{select{case <-f.gate.release:default:close(f.gate.release)}}}();done:=make(chan int,1)
 go func(){req,_:=http.NewRequest("GET",f.server.URL+"/api/v1/meetings/"+f.id+"/sync",nil);req.Header.Set("Authorization","Bearer "+f.tokens[repeatGuest]);r,err:=http.DefaultClient.Do(req);if err!=nil{done<-0;return};io.Copy(io.Discard,r.Body);r.Body.Close();done<-r.StatusCode}()
 <-f.gate.entered
 if _,err:=f.app.Respond(t.Context(),meetings.Actor{ID:repeatGuest,Name:"Synthetic guest"},f.id,"",meetings.NotGoing,1,repeatKey(202));err!=nil{t.Fatal(err)}
 close(f.gate.release);if status:=<-done;status!=403{t.Fatal("delayed sync leaked after revoke",status)}
 if _,err:=f.app.DispatchChat(t.Context(),f.adapter);err!=nil{t.Fatal(err)};s.expect(t,`"code":2003`)
 base:="/api/v1/meetings/"+f.id
 f.req(t,repeatGuest,"GET",base+"/feed",nil,403);f.req(t,repeatGuest,"PUT",base+"/read-marker",map[string]string{"read_through_sequence":fmt.Sprint(entry.Sequence)},403)
 f.req(t,repeatGuest,"POST",base+"/messages",map[string]string{"text":repeatSecretText,"client_request_id":repeatKey(799)},403)
 s.command(t,fmt.Sprintf(`{"id":3,"subscribe":{"channel":"meeting:%s","recover":true,"offset":0,"epoch":"old"}}`,f.id));s.expect(t,`"code":103`)
 f.assertPrivate(t,f.logs.String());t.Log("receivedhint→HTTP blocked before read snapshot→committed RSVP revoke→HTTP403; WSunsubscribe2003; read/feed/send403; late recovery103 without payload")
}

func TestIndependentRepeatFaultDiagnosticsCapture(t *testing.T){
 f:=newRepeatFixture(t,time.Hour);s:=f.socket(t,repeatOwner);e:=f.send(t,301);if _,err:=f.app.DispatchChat(t.Context(),f.adapter);err!=nil{t.Fatal(err)};f.assertPrivate(t,s.expect(t,`"latest_change_sequence"`));s.Close()
 f.socket(t,repeatOwner).Close()
 base:="/api/v1/meetings/"+f.id
 raw:=f.req(t,repeatOwner,"GET",base+"/sync",nil,200);var snapshot struct{Cursor string `json:"change_cursor"`};json.Unmarshal(raw,&snapshot)
 f.clock.Add(int64(8*24*time.Hour/time.Second));f.assertPrivate(t,string(f.req(t,repeatOwner,"GET",base+"/sync?cursor="+snapshot.Cursor,nil,410)))
 for _,mode:=range []int32{1,2}{f.gate.mode.Store(mode);f.assertPrivate(t,string(f.req(t,repeatOwner,"GET",base+"/sync",nil,500)));f.gate.mode.Store(0)}
 f.gate.mode.Store(3);f.assertPrivate(t,string(f.req(t,repeatGuest,"PUT",base+"/read-marker",map[string]string{"read_through_sequence":fmt.Sprint(e.Sequence)},500)));f.gate.mode.Store(0)
 f.gate.prepareGate();ctx,cancel:=context.WithTimeout(t.Context(),30*time.Millisecond);defer cancel();req,_:=http.NewRequestWithContext(ctx,"GET",f.server.URL+base+"/sync",nil);req.Header.Set("Authorization","Bearer "+f.tokens[repeatOwner]);done:=make(chan error,1);go func(){resp,err:=http.DefaultClient.Do(req);if resp!=nil{resp.Body.Close()};done<-err}();<-f.gate.entered;if err:=<-done;err==nil{t.Fatal("timeout not injected")};close(f.gate.release)
 var persisted []byte;err:=f.store.View(t.Context(),func(r meetings.Reader)error{stream,err:=r.ChatStream(f.id);if err!=nil{return err};changes,err:=r.ChatChanges(f.id,0,stream.LatestSequence,100);if err!=nil{return err};hints,err:=r.PendingChatHints(time.Unix(f.clock.Load(),0),100);if err!=nil{return err};persisted,err=json.Marshal([]any{changes,hints});return err});if err!=nil{t.Fatal(err)}
 f.assertPrivate(t,string(persisted),f.logs.String());if !strings.Contains(f.logs.String(),"request_id")||!strings.Contains(f.logs.String(),"duration_ms"){t.Fatal("safe diagnostics missing")};if strings.Contains(f.logs.String(),snapshot.Cursor){t.Fatal("cursor logged")}
 t.Log("captured timeout/reconnect/reset/storage-read500/panic500/storage-write500; body/errors/tokens/cursor absent from HTTP logs and error envelopes; journal/outbox reference-only, request_id+status+duration retained; no credential URL used")
}
