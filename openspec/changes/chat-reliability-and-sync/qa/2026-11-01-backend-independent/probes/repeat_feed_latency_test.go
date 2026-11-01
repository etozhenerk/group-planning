package postgres

import (
 "context"
 "fmt"
 "slices"
 "testing"
 "time"
 "github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestIndependentRepeatFeedSQLLatencyIntegration(t *testing.T){
 db:=integrationDB(t)
 for _,count:=range []int{1000,10000,100000}{t.Run(fmt.Sprint(count),func(t *testing.T){
  id:=fmt.Sprintf("independent-page-%x",randBytes(12));store:=db.Meetings();t.Cleanup(func(){if err:=store.Update(context.Background(),func(w meetings.Writer)error{return w.DeleteMeeting(id)});err!=nil{t.Error(err)}})
  requireChatSQL(t,store.Update(t.Context(),func(w meetings.Writer)error{return w.SaveMeeting(meetings.Meeting{ID:id})}))
  for first:=1;first<=count;first+=1000{last:=min(first+999,count);requireChatSQL(t,store.Update(t.Context(),func(w meetings.Writer)error{_,err:=w.(*transaction).exec(`INSERT INTO feed_entries(id,meeting_id,sequence,actor_id,client_request_id,document) SELECT $1||'-'||n,$1,n,'actor',n::text,jsonb_build_object('ID',$1||'-'||n,'MeetingID',$1,'Sequence',n,'ActorID','actor','ClientRequestID',n::text,'Kind','message','Payload',jsonb_build_object('text','synthetic bounded fixture')) FROM generate_series($2::int,$3::int)n`,id,first,last);return err}))}
  _,err:=db.pool.Exec(t.Context(),"ANALYZE feed_entries");requireChatSQL(t,err)
  zero,tail,first:=uint64(0),uint64(count),uint64(1)
  for _,limit:=range []int{1,50,100}{for _,kind:=range []string{"initial","after-zero","empty-after-tail","before-first","before-tail","around"}{
   samples:=[]float64{}
   for trial:=0;trial<20;trial++{start:=time.Now();err=store.View(t.Context(),func(r meetings.Reader)error{
    q:=meetings.FeedQuery{Limit:limit};switch kind{case"after-zero":q.After=&zero;case"empty-after-tail":q.After=&tail;case"before-first":q.Before=&first;case"before-tail":q.Before=&tail;case"around":around,err:=r.FeedAround(id,fmt.Sprintf("%s-%d",id,count/2),limit);if err==nil&&(len(around.Entries)>limit||around.LatestSequence!=tail){return fmt.Errorf("around bounds")};return err}
    page,err:=r.FeedWindow(id,q);if err!=nil{return err};if len(page.Entries)>limit||page.LatestSequence!=tail{return fmt.Errorf("page bounds")};for i:=1;i<len(page.Entries);i++{if page.Entries[i-1].Sequence>=page.Entries[i].Sequence{return fmt.Errorf("page order")}};if (kind=="empty-after-tail"||kind=="before-first")&&len(page.Entries)!=0{return fmt.Errorf("empty boundary")};return nil
   });requireChatSQL(t,err);samples=append(samples,float64(time.Since(start).Microseconds())/1000)}
   slices.Sort(samples);p95:=samples[18];t.Logf("history=%d query=%s limit=%d samples=20 p95_ms=%.3f max_ms=%.3f budget_ms=100 includes=transaction+SQL+JSONdecode",count,kind,limit,p95,samples[19]);if p95>100{t.Errorf("page p95 exceeded100ms: %.3f",p95)}
  }}
 })}
}
