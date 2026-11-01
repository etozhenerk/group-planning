package server

import (
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"net/netip"
	"strconv"
	"time"
)

func validateMetricsAddress(address string) error {
	if address == "" {
		return nil
	}

	host, port, err := net.SplitHostPort(address)
	ip, ipErr := netip.ParseAddr(host)
	number, portErr := strconv.Atoi(port)
	if err != nil || ipErr != nil || !ip.IsLoopback() || ip.Zone() != "" || portErr != nil || number < 1 || number > 65535 {
		return fmt.Errorf("SOMEWHERE_METRICS_ADDR must be a numeric loopback address with port 1..65535")
	}

	return nil
}

func startHTTPMetrics(address string, metrics *httpMetrics, logger *slog.Logger) (func(), error) {
	if err := validateMetricsAddress(address); err != nil {
		return nil, err
	}

	listener, err := net.Listen("tcp", address)
	if err != nil {
		return nil, fmt.Errorf("listen metrics: %w", err)
	}

	return serveHTTPMetrics(listener, metrics, logger), nil
}

func serveHTTPMetrics(listener net.Listener, metrics *httpMetrics, logger *slog.Logger) func() {
	server := &http.Server{
		Handler:           metrics,
		ReadHeaderTimeout: 2 * time.Second,
		ReadTimeout:       5 * time.Second,
		WriteTimeout:      5 * time.Second,
		IdleTimeout:       10 * time.Second,
		MaxHeaderBytes:    4 << 10,
		ErrorLog:          slog.NewLogLogger(slog.NewTextHandler(discardWriter{}, nil), slog.LevelError),
	}
	done := make(chan struct{})
	go func() {
		defer close(done)
		if err := server.Serve(listener); err != nil && err != http.ErrServerClosed {
			logger.Error("metrics listener stopped", "error_code", "metrics_serve_failed")
		}
	}()

	return func() {
		_ = server.Close()
		<-done
	}
}
