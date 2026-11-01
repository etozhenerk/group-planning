package server

import (
 "bufio"
 "context"
 "errors"
 "fmt"
 "io"
 "log/slog"
 "net"
 "net/http"
 "net/http/httptest"
 "strings"
 "testing"
 "time"

 "github.com/etozhenerk/group-planning/backend/internal/storage/memory"
)

type independentPlainWriter struct { h http.Header; code int }
func (w *independentPlainWriter) Header() http.Header { return w.h }
func (w *independentPlainWriter) WriteHeader(code int) { if w.code==0 {w.code=code} }
func (w *independentPlainWriter) Write(p []byte)(int,error) { return len(p),nil }
type independentFailFlushWriter struct { independentPlainWriter; calls int }
func (w *independentFailFlushWriter) FlushError() error { w.calls++; return io.ErrClosedPipe }

// Compare the documented ResponseController contract on exactly the same base writer.
func TestIndependentMetricsPreservesUnsupportedFlushError(t *testing.T) {
 base:=&independentPlainWriter{h:make(http.Header)}
 originalErr:=http.NewResponseController(base).Flush()
 wrappedErr:=http.NewResponseController(&metricWriter{ResponseWriter:base}).Flush()
 t.Logf("base=%v wrapped=%v committed_status=%d",originalErr,wrappedErr,base.code)
 if !errors.Is(originalErr,http.ErrNotSupported) || !errors.Is(wrappedErr,http.ErrNotSupported) { t.Fatalf("Flush error compatibility changed: base=%v wrapped=%v",originalErr,wrappedErr) }
}
func TestIndependentMetricsPreservesRealFlushFailure(t *testing.T) {
 base:=&independentFailFlushWriter{independentPlainWriter:independentPlainWriter{h:make(http.Header)}}
 originalErr:=http.NewResponseController(base).Flush()
 wrappedErr:=http.NewResponseController(&metricWriter{ResponseWriter:base}).Flush()
 t.Logf("base=%v wrapped=%v flush_calls=%d",originalErr,wrappedErr,base.calls)
 if !errors.Is(originalErr,io.ErrClosedPipe) || !errors.Is(wrappedErr,io.ErrClosedPipe) { t.Fatalf("underlying FlushError lost: base=%v wrapped=%v",originalErr,wrappedErr) }
}
func TestIndependentMetricsDeadlineForwarding(t *testing.T) {
 base:=&independentPlainWriter{h:make(http.Header)}
 c:=http.NewResponseController(&metricWriter{ResponseWriter:base})
 for name,err:=range map[string]error{"read_deadline":c.SetReadDeadline(time.Now()),"write_deadline":c.SetWriteDeadline(time.Now()),"full_duplex":c.EnableFullDuplex()} {
  if !errors.Is(err,http.ErrNotSupported) {t.Errorf("%s changed unsupported result: %v",name,err)}
 }
}
func TestIndependentMetricsRealClientCancel(t *testing.T) {
 m:=&httpMetrics{}
 entered,finished:=make(chan struct{}),make(chan struct{})
 s:=httptest.NewServer(m.wrap(http.HandlerFunc(func(w http.ResponseWriter,r *http.Request){close(entered);<-r.Context().Done();close(finished)})))
 defer s.Close()
 ctx,cancel:=context.WithCancel(t.Context())
 req,_:=http.NewRequestWithContext(ctx,"GET",s.URL+"/api/v1/meetings/private-secret/feed?token=secret",nil)
 clientDone:=make(chan error,1)
 go func(){res,err:=s.Client().Do(req); if res!=nil {res.Body.Close()};clientDone<-err}()
 <-entered
 cancel()
 <-finished
 if err:=<-clientDone;err==nil{t.Fatal("actual client cancellation did not abort request")}
 deadline:=time.Now().Add(time.Second)
 for {text:=metricsText(t,m);if strings.Contains(text,`operation="feed",outcome="cancelled"} 1`) {if strings.Contains(text,"secret"){t.Fatal("secret leaked")};break};if time.Now().After(deadline){t.Fatal("cancel did not settle",text)}}
}
func TestIndependentMetricsHTTP1UpgradeSettlesBeforeSocketClose(t *testing.T) {
 m:=&httpMetrics{}
 socketClosed:=make(chan struct{})
 s:=httptest.NewServer(m.wrap(http.HandlerFunc(func(w http.ResponseWriter,r *http.Request){
  c,b,e:=http.NewResponseController(w).Hijack();if e!=nil{t.Error(e);return}
  _,_=b.WriteString("HTTP/1.1 101 Switching Protocols\r\nConnection: Upgrade\r\nUpgrade: websocket\r\n\r\n");_ = b.Flush()
  go func(){defer close(socketClosed);defer c.Close();_,_=io.Copy(io.Discard,c)}()
 })))
 defer s.Close()
 conn,err:=net.DialTimeout("tcp",strings.TrimPrefix(s.URL,"http://"),time.Second);if err!=nil{t.Fatal(err)}
 defer conn.Close();_ = conn.SetDeadline(time.Now().Add(3*time.Second))
 _,_=fmt.Fprint(conn,"GET /api/v1/realtime HTTP/1.1\r\nHost: localhost\r\nConnection: Upgrade\r\nUpgrade: websocket\r\n\r\n")
 res,err:=http.ReadResponse(bufio.NewReader(conn),nil);if err!=nil||res.StatusCode!=101{t.Fatal(res,err)}
 deadline:=time.Now().Add(time.Second)
 for {text:=metricsText(t,m);if strings.Contains(text,`operation="other",outcome="informational"} 1`){if !strings.Contains(text,`somewhere_http_inflight{group="read"} 0`){t.Fatal("hijacked connection stayed inflight",text)};break};if time.Now().After(deadline){t.Fatal("upgrade not completed while socket alive",text)}}
 select{case <-socketClosed:t.Fatal("socket closed before assertion");default:}
 _=conn.Close();<-socketClosed
}
func TestIndependentMetricsFailedBindClosesApplicationListener(t *testing.T) {
 busy,err:=net.Listen("tcp","127.0.0.1:0");if err!=nil{t.Fatal(err)};defer busy.Close()
 app,err:=net.Listen("tcp","127.0.0.1:0");if err!=nil{t.Fatal(err)}
 err=Serve(t.Context(),app,memory.New(),Config{ShutdownTimeout:time.Second,MetricsAddress:busy.Addr().String()},slog.New(slog.NewTextHandler(io.Discard,nil)))
 if err==nil||!strings.Contains(err.Error(),"listen metrics"){t.Fatal("failed private bind did not fail runtime",err)}
 _,acceptErr:=app.Accept();if !errors.Is(acceptErr,net.ErrClosed){t.Fatal("application listener leaked on metrics bind failure",acceptErr)}
}

func TestIndependentMetricsFlushFailureAccountingAfterFix(t *testing.T) {
 m:=&httpMetrics{}
 base:=&independentFailFlushWriter{independentPlainWriter:independentPlainWriter{h:make(http.Header)}}
 m.wrap(http.HandlerFunc(func(w http.ResponseWriter,r *http.Request){
  if err:=http.NewResponseController(w).Flush(); !errors.Is(err,io.ErrClosedPipe){t.Errorf("lost flush failure: %v",err)}
  w.(http.Flusher).Flush()
 })).ServeHTTP(base,httptest.NewRequest("GET","/api/v1/meetings/private/feed",nil))
 if base.code!=200||base.calls!=2{t.Errorf("implicit status/delegation: status=%d calls=%d",base.code,base.calls)}
 text:=metricsText(t,m)
 t.Log(text)
 if !strings.Contains(text,`somewhere_api_requests_total{operation="feed",outcome="server_error"} 1`){t.Fatal("flush failure not a server error",text)}
 if strings.Contains(text,`outcome="ok"`)||strings.Contains(text,`outcome="timeout"`){t.Fatal("completion incorrectly duplicated",text)}
 if !strings.Contains(text,`somewhere_http_inflight{group="read"} 0`){t.Fatal("inflight leaked",text)}
 if !strings.Contains(text,`somewhere_http_duration_seconds_count{group="read",result="error"} 1`){t.Fatal("error histogram count mismatch",text)}
}
