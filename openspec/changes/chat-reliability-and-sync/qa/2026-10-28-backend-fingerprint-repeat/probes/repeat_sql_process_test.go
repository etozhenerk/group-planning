package realtime

import (
 "context"
 "bytes"
 "crypto/sha256"
 "encoding/base64"
 "encoding/json"
 "errors"
 "fmt"
 "io"
 "log/slog"
 "net/http"
 "net/http/httptest"
 "os"
 "os/exec"
 "strings"
 "testing"
 "time"

 "github.com/etozhenerk/group-planning/backend/internal/accounts"
 "github.com/etozhenerk/group-planning/backend/internal/httpapi"
 "github.com/etozhenerk/group-planning/backend/internal/identity"
 "github.com/etozhenerk/group-planning/backend/internal/meetings"
 "github.com/etozhenerk/group-planning/backend/internal/storage/postgres"
 "github.com/jackc/pgx/v5/pgxpool"
)

func repeatSQL(t *testing.T)*postgres.Database{
 t.Helper();dsn:=os.Getenv("SOMEWHERE_TEST_DATABASE_URL");if dsn==""{t.Skip("isolated cloud integration database required")}
 config,err:=pgxpool.ParseConfig(dsn);if err!=nil||config.ConnConfig.Database!="somewhere_integration"{t.Fatal("refusing non-integration database")}
 db,err:=postgres.Open(t.Context(),dsn);if err!=nil{t.Fatal(err)};t.Cleanup(db.Close);if err=db.Migrate(t.Context());err!=nil{t.Fatal(err)};if err=db.Check(t.Context());err!=nil{t.Fatal(err)};return db
}
type repeatPublisher func(context.Context,meetings.ChatHint)error
func(p repeatPublisher)PublishChat(ctx context.Context,h meetings.ChatHint)error{return p(ctx,h)}
func repeatChild(t *testing.T,phase,id,cursor string,exit int)string{
 t.Helper();binary,err:=os.Executable();if err!=nil{t.Fatal(err)};cmd:=exec.CommandContext(t.Context(),binary,"-test.run=^TestIndependentRepeatSQLChild$","-test.v","-test.timeout=30s")
 cmd.Env=append(os.Environ(),"SOMEWHERE_QA_PROCESS_PHASE="+phase,"SOMEWHERE_QA_MEETING_ID="+id,"SOMEWHERE_QA_CURSOR="+cursor)
 out,err:=cmd.CombinedOutput();code:=0;if err!=nil{var ee *exec.ExitError;if errors.As(err,&ee){code=ee.ExitCode()}else{t.Fatal(err)}}
 if code!=exit{t.Fatalf("child %s exit%d want%d: %s",phase,code,exit,out)}
 // Child output contains event/entry IDs and assertion results only, never DSN or body/token.
 t.Logf("child phase=%s exit=%d output=%s",phase,code,strings.TrimSpace(string(out)));return string(out)
}
func TestIndependentRepeatSQLChild(t *testing.T){
 phase:=os.Getenv("SOMEWHERE_QA_PROCESS_PHASE");if phase==""{t.Skip("only invoked as subprocess")};db:=repeatSQL(t);id:=os.Getenv("SOMEWHERE_QA_MEETING_ID");if _,err:=meetings.ParseUUID(id);err!=nil{t.Fatal("invalid own fixture ID")}
 now:=time.Now();if phase=="recover"{now=now.Add(40*time.Second)}
 app:=meetings.NewService(db.Meetings(),func()time.Time{return now},meetings.WithChatSyncKey([]byte(strings.Repeat("q",32))),meetings.WithChatReadState(true))
 switch phase{
 case "commit-crash":
  entry,err:=app.SendMessage(t.Context(),meetings.Actor{ID:repeatOwner,Name:"Synthetic owner"},id,repeatSecretText,repeatKey(9001),repeatKey(9001));if err!=nil{t.Fatal(err)};fmt.Printf("COMMITTED id=%s sequence=%d pid=%d\n",entry.ID,entry.Sequence,os.Getpid());os.Exit(73)
 case "publish-crash":
  _,err:=app.DispatchChat(t.Context(),repeatPublisher(func(_ context.Context,h meetings.ChatHint)error{fmt.Printf("PUBLISHED event=%s target=%s pid=%d\n",h.ID,h.Target,os.Getpid());os.Exit(74);return nil}));if err!=nil{t.Fatal(err)};t.Fatal("no pending hint to crash after publish")
 case "recover":
  count:=0;stats,err:=app.DispatchChat(t.Context(),repeatPublisher(func(_ context.Context,h meetings.ChatHint)error{count++;fmt.Printf("RECOVERED event=%s target=%s pid=%d\n",h.ID,h.Target,os.Getpid());return nil}));if err!=nil{t.Fatal(err)};if count<1||stats.Acknowledged<1{t.Fatal("periodic drain lost durable hint")};fmt.Printf("DRAIN acknowledged=%d deleted=%d pid=%d\n",stats.Acknowledged,stats.Deleted,os.Getpid())
 case "api-restart":
  auth,err:=identity.New(identity.Config{PublicOrigin:"https://somewhere.test",SessionTTL:time.Hour},db.Identity(),unusedProvider{},time.Now,func(context.Context,string)(bool,error){return false,nil});if err!=nil{t.Fatal(err)}
  s:=httptest.NewServer(httpapi.NewWithRealtime(app,auth,nil,slog.New(slog.NewTextHandler(io.Discard,nil)),nil));defer s.Close()
  token:=base64.RawURLEncoding.EncodeToString([]byte(strings.Repeat("2",32)));r,_:=http.NewRequest("GET",s.URL+"/api/v1/meetings/"+id+"/sync?cursor="+os.Getenv("SOMEWHERE_QA_CURSOR"),nil);r.Header.Set("Authorization","Bearer "+token);response,err:=http.DefaultClient.Do(r);if err!=nil{t.Fatal(err)};defer response.Body.Close();body,_:=io.ReadAll(response.Body);var page repeatSyncPage;if json.Unmarshal(body,&page)!=nil||response.StatusCode!=200||len(page.Changes)!=1{t.Fatal("restarted API lost committed delta",response.StatusCode,len(page.Changes))};fmt.Printf("API_RESTART status=200 changes=1 pid=%d\n",os.Getpid())
 case "terminal-restart":
  auth,err:=identity.New(identity.Config{PublicOrigin:"https://somewhere.test",SessionTTL:time.Hour},db.Identity(),unusedProvider{},time.Now,func(context.Context,string)(bool,error){return false,nil});if err!=nil{t.Fatal(err)};adapter,err:=New(app,auth);if err!=nil{t.Fatal(err)};defer adapter.Close(context.Background())
  s:=httptest.NewServer(httpapi.NewWithRealtime(app,auth,nil,slog.New(slog.NewTextHandler(io.Discard,nil)),adapter.ServeAuthenticatedHTTP));defer s.Close();token:=base64.RawURLEncoding.EncodeToString([]byte(strings.Repeat("3",32)))
  socket:=openSocket(t,s.URL,"Authorization: Bearer "+token+"\r\n");defer socket.Close();socket.command(t,`{"id":1,"connect":{}}`);socket.expect(t,`"personal:`+repeatObserver+`"`)
  stats,err:=app.DispatchChat(t.Context(),adapter);if err!=nil{t.Fatal(err)};hint:=socket.expect(t,`"access_revoked":true`);if strings.Contains(hint,repeatSecretText)||strings.Contains(hint,token)||!strings.Contains(hint,id){t.Fatal("terminal hint wrong/private")};if stats.Acknowledged<1{t.Fatal("terminal not acknowledged")};fmt.Printf("TERMINAL_RESTART delivered=true acknowledged=%d pid=%d\n",stats.Acknowledged,os.Getpid())
 default:t.Fatal("unknown process phase")
 }
}

func TestIndependentRepeatSQLProcessRestartDeletionAndEpoch(t *testing.T){
 db:=repeatSQL(t);f:=repeatFixtureWithStores(t,db.Meetings(),db.Identity(),time.Hour)
 // Isolate this message from initial setup notifications without touching another run's data.
 if err:=f.store.Update(t.Context(),func(w meetings.Writer)error{for{hints,err:=w.PendingChatHints(time.Now(),100);if err!=nil{return err};ids:=[]string{};for _,h:=range hints{if h.MeetingID==f.id{ids=append(ids,h.ID)}};if len(ids)==0{return nil};if err=w.DeleteChatHints(ids);err!=nil{return err}}});err!=nil{t.Fatal(err)}
 initial,err:=f.app.Sync(t.Context(),meetings.Actor{ID:repeatGuest,Name:"Synthetic guest"},f.id,meetings.SyncQuery{Limit:100});if err!=nil{t.Fatal(err)}
 repeatChild(t,"commit-crash",f.id,"",73)
 repeatChild(t,"api-restart",f.id,initial.ChangeCursor,0)
 published:=repeatChild(t,"publish-crash",f.id,"",74)
 recovered:=repeatChild(t,"recover",f.id,"",0)
 event:="";for _,line:=range strings.Split(published,"\n"){if strings.HasPrefix(line,"PUBLISHED event="){event=strings.Fields(strings.TrimPrefix(line,"PUBLISHED event="))[0]}}
 if event==""||!strings.Contains(recovered,"RECOVERED event="+event){t.Fatal("crash-after-publish did not replay same event")}
 // The dispatcher was never notified; the new process's explicit periodic drain recovered all pending work.
 var entry meetings.FeedEntry;err=f.store.View(t.Context(),func(r meetings.Reader)error{var err error;entry,err=r.MessageByRequest(f.id,repeatOwner,repeatKey(9001));if err!=nil{return err};stream,err:=r.ChatStream(f.id);if err!=nil{return err};changes,err:=r.ChatChanges(f.id,initial.ProjectionVersion,stream.LatestSequence,100);if err==nil&&len(changes.Changes)!=1{return errors.New("commit journal not atomic")};return err});if err!=nil{t.Fatal(err)}
 // A separate transaction failure must leave neither record nor journal/outbox side effects.
 rollback:=errors.New("synthetic abort");abortID:=repeatKey(9002);err=f.store.Update(t.Context(),func(w meetings.Writer)error{if _,err:=w.AppendEntry(meetings.FeedEntry{ID:abortID,MeetingID:f.id,ActorID:repeatOwner,Kind:"message",Payload:[]byte(`{"text":"rollback"}`)});err!=nil{return err};if _,err:=w.AppendChatChanges(f.id,"ignored",[]meetings.ChatChange{{MeetingID:f.id,Kind:"history_invalidated",CreatedAt:time.Now()}});err!=nil{return err};if err:=w.EnqueueChatHint(meetings.ChatHint{ID:abortID,Target:"meeting",TargetID:f.id,MeetingID:f.id,Epoch:"qa-rollback",SchemaVersion:1,CreatedAt:time.Now(),AvailableAt:time.Now()});err!=nil{return err};return rollback});if !errors.Is(err,rollback){t.Fatal(err)}
 if err=f.store.View(t.Context(),func(r meetings.Reader)error{_,err:=r.FeedEntry(f.id,abortID);if !errors.Is(err,meetings.ErrNotFound){return errors.New("rollback entry survived")};hints,err:=r.PendingChatHints(time.Now().Add(time.Minute),100);for _,h:=range hints{if h.ID==abortID{return errors.New("rollback outbox survived")}};return err});err!=nil{t.Fatal(err)}
 repeatSQLRollbackEpoch(t,f)
 // Seed actual reader marker and an undelivered addressable notification before account deletion.
 if _,err=f.app.MarkRead(t.Context(),meetings.Actor{ID:repeatOwner,Name:"Synthetic owner"},f.id,entry.Sequence);err!=nil{t.Fatal(err)}
 ownerSocket:=f.socket(t,repeatOwner);guestSocket:=f.socket(t,repeatGuest)
 observer:=openSocket(t,f.server.URL,"Authorization: Bearer "+f.tokens[repeatObserver]+"\r\n");observer.command(t,`{"id":1,"connect":{}}`);observer.expect(t,`"personal:`+repeatObserver+`"`)
 before,err:=f.app.Sync(t.Context(),meetings.Actor{ID:repeatGuest,Name:"Synthetic guest"},f.id,meetings.SyncQuery{Limit:100});if err!=nil{t.Fatal(err)}
 deletion:=accounts.New(func(ctx context.Context,fn func(accounts.Identity,accounts.Meetings)error)error{return db.Identity().AccountUpdate(ctx,db.Meetings(),func(a identity.Store,m meetings.Store)error{return fn(f.auth.WithStore(a),meetings.NewService(m,time.Now))})},f.auth.AccountDeleted)
 endpoint:=httptest.NewServer(httpapi.NewWithRealtime(f.app,f.auth,nil,slog.New(slog.NewTextHandler(io.Discard,nil)),f.adapter.ServeAuthenticatedHTTP,deletion));defer endpoint.Close()
 remove:=func(user string){req,_:=http.NewRequest("DELETE",endpoint.URL+"/api/v1/me",nil);req.Header.Set("Authorization","Bearer "+f.tokens[user]);sum:=sha256ForRepeat(user);req.Header.Set("X-Deletion-Token",sum);resp,err:=http.DefaultClient.Do(req);if err!=nil{t.Fatal(err)};resp.Body.Close();if resp.StatusCode!=204{t.Fatal("delete account",resp.StatusCode)}}
 remove(repeatOwner);ownerSocket.expect(t,"3503")
 replay,err:=f.app.Sync(t.Context(),meetings.Actor{ID:repeatGuest,Name:"Synthetic guest"},f.id,meetings.SyncQuery{Limit:100,Cursor:before.ChangeCursor});if err!=nil{t.Fatal(err)};invalidated:=false;for _,ch:=range replay.Changes{invalidated=invalidated||ch.Kind=="history_invalidated";if ch.Projection!=nil&&ch.Projection.Entry!=nil&&ch.Projection.Entry.ActorID==repeatOwner&&ch.Projection.Entry.ActorName!=meetings.RemovedAccountName{t.Fatal("old author profile survived")}};if !invalidated{t.Fatal("history invalidation missing")}
 if err=f.store.View(t.Context(),func(r meetings.Reader)error{if _,err:=r.ChatReadMarker(f.id,repeatOwner);!errors.Is(err,meetings.ErrNotFound){return errors.New("deleted marker survived")};hints,err:=r.PendingChatHints(time.Now().Add(time.Minute),100);for _,h:=range hints{if h.Target=="user"&&h.TargetID==repeatOwner{return errors.New("deleted recipient survived")}};return err});err!=nil{t.Fatal(err)}
 remove(repeatGuest);guestSocket.expect(t,"3503")
 if err=f.store.View(t.Context(),func(r meetings.Reader)error{if _,err:=r.ChatStream(f.id);!errors.Is(err,meetings.ErrNotFound){return errors.New("deleted stream survived")};if _,err:=r.FeedEntry(f.id,entry.ID);!errors.Is(err,meetings.ErrNotFound){return errors.New("deleted history survived")};return nil});err!=nil{t.Fatal(err)}
 // Simulate API/broker stop; the next executable process reconnects the surviving observer and drains durable terminal outbox.
 observer.Close();if err=f.adapter.Close(t.Context());err!=nil{t.Fatal(err)};f.server.Close();repeatChild(t,"terminal-restart",f.id,"",0)
 t.Log("distinct process PIDs: committed crash73 before publish; API restart HTTP200 delta1; publish crash74 before ACK; periodic no-NOTIFY drain replayed same event; SQL rollback atomic; account DELETE with activeWS revoked sockets/cleared marker+recipient; deletedmeeting removedhistory/stream, newprocess delivered durable terminal hint")
}
func sha256ForRepeat(user string)string{sum:=sha256.Sum256([]byte("delete-"+user));return base64.RawURLEncoding.EncodeToString(sum[:])}

func repeatSQLRollbackEpoch(t *testing.T,f *repeatFixture){
 t.Helper();actor:=meetings.Actor{ID:repeatGuest,Name:"Synthetic guest"};before,err:=f.app.Sync(t.Context(),actor,f.id,meetings.SyncQuery{Limit:100});if err!=nil{t.Fatal(err)}
 legacyID:=repeatKey(9050)
 // Explicit test-only legacy writer: append a record without journal; never run this on production.
 if err=f.store.Update(t.Context(),func(w meetings.Writer)error{_,err:=w.AppendEntry(meetings.FeedEntry{ID:legacyID,MeetingID:f.id,ActorID:repeatOwner,ActorName:"Synthetic owner",Kind:"message",Payload:[]byte(`{"text":"legacy rollback interval"}`)});return err});err!=nil{t.Fatal(err)}
 pool,err:=pgxpool.New(t.Context(),os.Getenv("SOMEWHERE_TEST_DATABASE_URL"));if err!=nil{t.Fatal(err)};defer pool.Close();if pool.Config().ConnConfig.Database!="somewhere_integration"{t.Fatal("non-test epoch target")}
 if _,err=pool.Exec(t.Context(),"UPDATE meeting_streams SET epoch=$2 WHERE meeting_id=$1",f.id,"qa-new-epoch-"+f.id);err!=nil{t.Fatal(err)}
 if _,err=f.app.Sync(t.Context(),actor,f.id,meetings.SyncQuery{Limit:100,Cursor:before.ChangeCursor});!errors.Is(err,meetings.ErrSyncResetRequired){t.Fatal("epoch rotation accepted stale cursor",err)}
 fresh,err:=f.app.Sync(t.Context(),actor,f.id,meetings.SyncQuery{Limit:100});if err!=nil{t.Fatal(err)};found:=false;for _,e:=range fresh.Entries{found=found||e.ID==legacyID};if !found||fresh.StreamEpoch==before.StreamEpoch{t.Fatal("reset lost rollback interval")}
 f.req(t,repeatGuest,"GET","/api/v1/meetings/"+f.id+"/sync?cursor="+before.ChangeCursor,nil,410)
 // Same-schema fallback: disabled capabilities retain old HTTP feed and idempotent send; no old-binary/schema compatibility assumed.
 disabled:=meetings.NewService(f.store,time.Now);server:=httptest.NewServer(httpapi.NewWithRealtime(disabled,f.auth,nil,slog.New(slog.NewTextHandler(io.Discard,nil)),nil));defer server.Close()
 for _,path:=range []string{"/api/v1/chat-capabilities","/api/v1/meetings/"+f.id+"/feed"}{req,_:=http.NewRequest("GET",server.URL+path,nil);req.Header.Set("Authorization","Bearer "+f.tokens[repeatGuest]);resp,err:=http.DefaultClient.Do(req);if err!=nil{t.Fatal(err)};body,_:=io.ReadAll(resp.Body);resp.Body.Close();if resp.StatusCode!=200{t.Fatal("legacy HTTP disabled capability",resp.StatusCode)};if strings.Contains(path,"capabilities")&&(!strings.Contains(string(body),`"sync":false`)||!strings.Contains(string(body),`"read_state":false`)){t.Fatal("disabled capability wrong")}}

 legacyRequest:=func()[]byte{body,_:=json.Marshal(map[string]string{"text":"legacy DTO message","client_request_id":repeatKey(9051)});req,_:=http.NewRequest("POST",server.URL+"/api/v1/meetings/"+f.id+"/messages",bytes.NewReader(body));req.Header.Set("Authorization","Bearer "+f.tokens[repeatGuest]);req.Header.Set("Content-Type","application/json");req.Header.Set("Idempotency-Key",repeatKey(9051));resp,err:=http.DefaultClient.Do(req);if err!=nil{t.Fatal(err)};defer resp.Body.Close();data,_:=io.ReadAll(resp.Body);if resp.StatusCode!=201{t.Fatal("legacy send/retry",resp.StatusCode)};return data}
 var sent,again struct{ID string `json:"id"`;Sequence string `json:"sequence"`};json.Unmarshal(legacyRequest(),&sent);json.Unmarshal(legacyRequest(),&again);if sent.ID==""||sent!=again{t.Fatal("legacy retry identity changed")}
 resumed,err:=f.app.Sync(t.Context(),actor,f.id,meetings.SyncQuery{Limit:100,Cursor:fresh.ChangeCursor});if err!=nil||len(resumed.Changes)!=1{t.Fatal("disabled capability writes lost journal",err)}
 t.Log("simulated no-journal writer + explicit epoch replacement: oldHTTP cursor410; fresh snapshot preserves interval message and preceding history; schema-compatible disabled capability still serves legacy feed. Production oldbinary rollback was not attempted")
}
