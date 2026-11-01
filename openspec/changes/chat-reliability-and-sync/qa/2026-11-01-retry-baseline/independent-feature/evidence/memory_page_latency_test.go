package postgres

import (
 "fmt"
 "slices"
 "testing"
 "time"
 "github.com/etozhenerk/group-planning/backend/internal/meetings"
 "github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

func TestIndependentMemoryPageQuantitativeBaseline(t *testing.T) {
 for _,count:=range []int{1000,10000,100000} {t.Run(fmt.Sprint(count),func(t *testing.T) {
  store:=memory.New();requireChatSQL(t,store.Update(t.Context(),func(w meetings.Writer)error {
   if err:=w.SaveMeeting(meetings.Meeting{ID:"own"});err!=nil{return err}
   for n:=1;n<=count;n++ {if _,err:=w.AppendEntry(meetings.FeedEntry{ID:fmt.Sprint(n),MeetingID:"own",Kind:"message",Payload:[]byte(`{"text":"synthetic"}`)});err!=nil{return err}}
   return nil
  }))
  for _,limit:=range []int{1,50,100} {for _,kind:=range []string{"initial","after-zero","empty-after-tail","before-first","before-tail","around"} {
   samples:=make([]float64,0,20);maxRows:=0
   for sample:=0;sample<20;sample++ {
    start:=time.Now();requireChatSQL(t,store.View(t.Context(),func(r meetings.Reader)error {
     zero,tail,first:=uint64(0),uint64(count),uint64(1)
     if kind=="around" {
      page,err:=r.FeedAround("own",fmt.Sprint(count/2),limit);if err!=nil{return err}
      if len(page.Entries)!=limit||page.LatestSequence!=tail||!page.HasOlder||!page.HasNewer {t.Fatal("around bounds")}
      found:=false
      for i,e:=range page.Entries {found=found||e.ID==fmt.Sprint(count/2);if i>0&&e.Sequence!=page.Entries[i-1].Sequence+1{t.Fatal("around order")}}
      if !found {t.Fatal("missing anchor")};maxRows=max(maxRows,len(page.Entries));return nil
     }
     q:=meetings.FeedQuery{Limit:limit};firstWant:=uint64(count-limit+1);sizeWant:=limit;more:=true
     switch kind {case "after-zero":q.After=&zero;firstWant=1;case "empty-after-tail":q.After=&tail;sizeWant=0;more=false;case "before-first":q.Before=&first;sizeWant=0;more=false;case "before-tail":q.Before=&tail;firstWant--}
     page,err:=r.FeedWindow("own",q);if err!=nil{return err};if len(page.Entries)!=sizeWant||page.LatestSequence!=tail||page.HasMore!=more{t.Fatal("window bounds")}
     for i,e:=range page.Entries {if e.Sequence!=firstWant+uint64(i){t.Fatal("sequence")}}
     maxRows=max(maxRows,len(page.Entries));return nil
    }));samples=append(samples,float64(time.Since(start).Microseconds())/1000)
   }
   slices.Sort(samples);t.Logf("MEMORY_PAGE_BASELINE history=%d path=%s limit=%d samples=20 p95_ms=%.3f max_ms=%.3f max_rows_returned=%d includes=transaction+reader+projectiondecode",count,kind,limit,samples[18],samples[19],maxRows)
   if samples[18]>100 {t.Fatalf("memory page p95 %.3f exceeds100ms",samples[18])}
  }}
 })}
}
