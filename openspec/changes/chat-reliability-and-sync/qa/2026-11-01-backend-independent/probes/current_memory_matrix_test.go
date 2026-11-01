package memory

import (
 "fmt"
 "testing"
 "github.com/etozhenerk/group-planning/backend/internal/meetings"
)

func TestIndependentCurrentMemoryHistoryMatrix(t *testing.T) {
 for _,count:=range []int{1000,10000,100000} {t.Run(fmt.Sprint(count),func(t *testing.T) {
  s:=New()
  if err:=s.Update(t.Context(),func(w meetings.Writer)error {
   if err:=w.SaveMeeting(meetings.Meeting{ID:"own"});err!=nil{return err}
   for n:=1;n<=count;n++ {if _,err:=w.AppendEntry(meetings.FeedEntry{ID:fmt.Sprint(n),MeetingID:"own",Kind:"message",Payload:[]byte(`{"text":"synthetic"}`)});err!=nil{return err}}
   return nil
  });err!=nil{t.Fatal(err)}
  for _,limit:=range []int{1,50,100} {for _,kind:=range []string{"initial","after-zero","empty-after-tail","before-first","before-tail","around"} {t.Run(fmt.Sprintf("%s/%d",kind,limit),func(t *testing.T) {
   if err:=s.View(t.Context(),func(r meetings.Reader)error {
    zero,tail,first:=uint64(0),uint64(count),uint64(1)
    if kind=="around" {
     a,err:=r.FeedAround("own",fmt.Sprint(count/2),limit);if err!=nil{return err}
     if len(a.Entries)!=limit||a.LatestSequence!=tail||!a.HasOlder||!a.HasNewer {t.Fatal("around bounds",len(a.Entries),a.LatestSequence,a.HasOlder,a.HasNewer)}
     found:=false
     for i,e:=range a.Entries {found=found||e.ID==fmt.Sprint(count/2);if i>0&&e.Sequence!=a.Entries[i-1].Sequence+1{t.Fatal("around hole/order")};e.Payload[0]='!'}
     if !found{t.Fatal("around omitted anchor")};return nil
    }
    q:=meetings.FeedQuery{Limit:limit};expectedFirst:=uint64(count-limit+1);expectedLen:=limit;more:=true
    switch kind {case "after-zero":q.After=&zero;expectedFirst=1;case "empty-after-tail":q.After=&tail;expectedLen=0;more=false;case "before-first":q.Before=&first;expectedLen=0;more=false;case "before-tail":q.Before=&tail;expectedFirst--}
    p,err:=r.FeedWindow("own",q);if err!=nil{return err}
    if len(p.Entries)!=expectedLen||p.LatestSequence!=tail||p.HasMore!=more{t.Fatal("bounds",len(p.Entries),p.LatestSequence,p.HasMore)}
    for i,e:=range p.Entries {if e.Sequence!=expectedFirst+uint64(i){t.Fatal("wrong page sequence",e.Sequence,expectedFirst+uint64(i))};e.Payload[0]='!'}
    e,err:=r.FeedEntry("own","1");if err!=nil{return err};if string(e.Payload)!=`{"text":"synthetic"}`{t.Fatal("page alias changed store")};return nil
   });err!=nil{t.Fatal(err)}
  })}}
 })}
}
