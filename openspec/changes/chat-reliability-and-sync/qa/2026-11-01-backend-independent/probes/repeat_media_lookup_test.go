package meetings_test

import (
 "testing"
 "time"
 "github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestIndependentRepeatPhotoFileTextLookupAndLegacyHash(t *testing.T){
 f,content:=mediaFixture(t);id:=f.created.Details.Meeting.ID;respond(t,f,meetings.Going,0,2)
 must(t,f.store.Update(ctx,func(w meetings.Writer)error{for i:=0;i<10000;i++{if _,err:=w.AppendEntry(meetings.FeedEntry{ID:key(60000+i),MeetingID:id,ActorID:owner.ID,Kind:"message",Payload:[]byte(`{"text":"synthetic old"}`)});err!=nil{return err}};return nil}))
 f.app=meetings.NewService(boundedStore{f.store},func()time.Time{return time.Unix(f.clock.Load(),0)},meetings.WithMediaContent(content))
 photo:=reservePhoto(t,f,guest,"message",71000);_,err:=f.app.UploadMedia(ctx,guest,id,photo.ID,"image/png",mediaPhoto(t));must(t,err)
 // A legacy client publishes without caption; a modern empty-caption request must use the same content hash.
 p,err:=f.app.PublishMedia(ctx,guest,id,photo.ID,key(71001));must(t,err)
 doc:=[]byte("Synthetic independent document");file,err:=f.app.PrepareMedia(ctx,guest,id,meetings.MediaInput{ClientRequestID:key(71002),FileName:"independent.txt",ContentType:"text/plain",SizeBytes:len(doc),Purpose:"message"},key(71002));must(t,err)
 _,err=f.app.UploadMedia(ctx,guest,id,file.ID,"text/plain",doc);must(t,err);d,err:=f.app.PublishMediaWithCaption(ctx,guest,id,file.ID,key(71003),"caption");must(t,err)
 message,err:=f.app.SendMessage(ctx,guest,id,"same text",key(71004),key(71004));must(t,err)
 for _,expired:=range []bool{false,true}{if expired{f.clock.Add(int64(31*24*time.Hour/time.Second))}
  again,err:=f.app.PublishMediaWithCaption(ctx,guest,id,photo.ID,key(71001)," ");must(t,err);if again.Entry==nil||p.Entry==nil||again.Entry.ID!=p.Entry.ID||again.Entry.Sequence!=p.Entry.Sequence||len(again.Entry.Attachments)!=1{t.Fatal("photo retry/legacy hash lost identity")}
  document,err:=f.app.PublishMediaWithCaption(ctx,guest,id,file.ID,key(71003),"caption");must(t,err);if document.Entry==nil||d.Entry==nil||document.Entry.ID!=d.Entry.ID||document.Entry.Sequence!=d.Entry.Sequence||len(document.Entry.Attachments)!=1{t.Fatal("file retry lost identity")}
  text,err:=f.app.SendMessage(ctx,guest,id,"same text",key(71004),key(71004));must(t,err);if text.ID!=message.ID||text.Sequence!=message.Sequence{t.Fatal("text retry lost identity")}
  _,err=f.app.SendMessage(ctx,guest,id,"changed",key(71004),key(71004));assertError(t,err,meetings.ErrIdempotencyConflict)
 }
 _,err=f.app.PublishMediaWithCaption(ctx,owner,id,file.ID,key(71003),"caption");assertError(t,err,meetings.ErrForbidden)
 _,err=f.app.PublishMediaWithCaption(ctx,guest,"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",file.ID,key(71003),"caption");if err==nil{t.Fatal("foreign meeting accepted")}
 // Returned media projection mutation must not change the stored attachment.
 original:=d.Entry.Attachments[0].FileName;d.Entry.Attachments[0].FileName="corrupt copy";again,err:=f.app.PublishMediaWithCaption(ctx,guest,id,file.ID,key(71003),"caption");must(t,err);if again.Entry.Attachments[0].FileName!=original{t.Fatal("media hydration alias")}
 respond(t,f,meetings.NotGoing,1,71005);_,err=f.app.PublishMedia(ctx,guest,id,photo.ID,key(71001));assertError(t,err,meetings.ErrForbidden);_,err=f.app.SendMessage(ctx,guest,id,"same text",key(71004),key(71004));assertError(t,err,meetings.ErrForbidden)
 t.Log("10k bounded Store that rejects fullFeed: photo legacy/no-caption↔empty modern hash, file+caption, text direct tuple retries before/after31d preserve ID/sequence+attachment; wrongactor/meeting and revokedaccess denied; changedtext conflict; returned attachment clone independent")
}
