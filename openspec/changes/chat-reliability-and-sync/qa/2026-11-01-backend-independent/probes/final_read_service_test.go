package meetings_test

import (
 "encoding/json"
 "strings"
 "testing"
 "time"
 "github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestIndependentFinalMixedUnreadHiddenPoll(t *testing.T){
 f:=readFixture(t);id:=f.created.Details.Meeting.ID
 f.app=meetings.NewService(f.store,func()time.Time{return time.Unix(f.clock.Load(),0)},meetings.WithChatSyncKey([]byte(strings.Repeat("r",32))),meetings.WithChatReadState(true))
 p:=newPoll(t,f,true,true)
 before,err:=f.app.Sync(ctx,guest,id,meetings.SyncQuery{Limit:100});must(t,err)
 pollVote(t,f,owner,p,[]string{p.Options[0].Option.ID},0,35000)
 page,err:=f.app.Sync(ctx,guest,id,meetings.SyncQuery{Limit:100,Cursor:before.ChangeCursor});must(t,err)
 seen:=false
 for _,ch:=range page.Changes {if ch.Projection!=nil&&ch.Projection.DatePoll!=nil {seen=true;v:=ch.Projection.DatePoll;if len(v.MyOptionIDs)!=0||v.Options[0].Votes!=nil||v.Options[0].Voters!=nil{t.Fatal("hidden vote leaked")}}};if !seen{t.Fatal("hidden projection missing")}
 one,err:=f.app.SendMessage(ctx,owner,id,"independent private first",key(35001),key(35001));must(t,err)
 _,err=f.app.SendMessage(ctx,guest,id,"own message",key(35002),key(35002));must(t,err)
 two,err:=f.app.SendMessage(ctx,owner,id,"independent private second",key(35003),key(35003));must(t,err)
 _,err=f.app.SetReaction(ctx,guest,id,one.ID,"👍",true,key(35004));must(t,err)
 f.clock.Store(p.ClosesAt.Unix());must(t,f.app.CloseDatePoll(ctx,p.ID))
 snapshot,err:=f.app.Sync(ctx,guest,id,meetings.SyncQuery{Limit:100});must(t,err)
 if snapshot.ReadState.UnreadCount!=2||snapshot.ReadState.FirstUnread!=one.ID{t.Fatal("mixed unread",snapshot.ReadState)}
 result,err:=f.app.Sync(ctx,guest,id,meetings.SyncQuery{Limit:100,Cursor:page.NextCursor});must(t,err)
 closed:=false;for _,ch:=range result.Changes {if ch.Projection!=nil&&ch.Projection.DatePoll!=nil {closed=true;if ch.Projection.DatePoll.Options[0].Votes==nil{t.Fatal("closed result missing")}}};if !closed{t.Fatal("closed oldcard missing")}
 first,err:=f.app.MarkRead(ctx,guest,id,one.Sequence);must(t,err);if first.UnreadCount!=1||first.FirstUnread!=two.ID{t.Fatal(first)}
 last,err:=f.app.MarkRead(ctx,guest,id,two.Sequence);must(t,err);if last.UnreadCount!=0||last.FirstUnread!=""{t.Fatal(last)}
 _,changes,hints:=chatState(t,f);data,err:=json.Marshal([]any{changes,hints});must(t,err)
 for _,secret:=range []string{"independent private","own message",owner.Name,f.created.InvitationToken}{if strings.Contains(string(data),secret){t.Fatal("journal contains private data")}}
 t.Log("mixed backend: hidden vote absent from guest projection; close updated existing card and released result; two foreign messages only unread2→1→0 despite own/system/poll/reaction; journal+hints contain no text/name/invitation token")
}

func TestIndependentFinal10kActivationCommitRace(t *testing.T){
 for trial:=0;trial<2;trial++{
  f:=setup(t);id:=f.created.Details.Meeting.ID;respond(t,f,meetings.Going,0,2)
  must(t,f.store.Update(ctx,func(w meetings.Writer)error{for i:=0;i<10000;i++{if _,err:=w.AppendEntry(meetings.FeedEntry{ID:key(40000+i),MeetingID:id,ActorID:owner.ID,Kind:"message",Payload:[]byte(`{"text":"old"}`)});err!=nil{return err}};return nil}))
  app:=meetings.NewService(f.store,func()time.Time{return time.Unix(f.clock.Load(),0)},meetings.WithChatSyncKey([]byte(strings.Repeat("x",32))),meetings.WithChatReadState(true))
  start:=make(chan struct{});done:=make(chan error,1);go func(){<-start;done<-app.InitializeChatReadState(ctx)}();close(start)
  entry,err:=f.app.SendMessage(ctx,owner,id,"concurrent new",key(50001),key(50001));must(t,err);must(t,<-done)
  snap,err:=app.Sync(ctx,guest,id,meetings.SyncQuery{Limit:50});must(t,err)
  wanted:=uint64(0);if snap.ReadState.Baseline<entry.Sequence{wanted=1};if snap.ReadState.ReadThrough!=0||snap.ReadState.UnreadCount!=wanted{t.Fatal("lost new or read baseline",snap.ReadState)}
  counts,err:=app.QueryReadReceipts(ctx,owner,id,[]string{entry.ID});must(t,err);if counts.Receipts[0].ReaderCount!=0{t.Fatal("invented receipt")}
  t.Logf("10k activation race trial%d tail=%d baseline=%d actual=0 unread=%d expected=%d receipt0",trial,snap.LatestSequence,snap.ReadState.Baseline,snap.ReadState.UnreadCount,wanted)
 }
}
