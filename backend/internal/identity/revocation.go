package identity

import "sync"

// revocations is shared by transaction-scoped Service copies. Notifications are
// emitted only by the owner of the outer commit, never by CompleteDeletion.
type revocations struct {
	mu        sync.Mutex
	next      uint64
	listeners map[uint64]func(string, string)
}

// OnRevocation observes committed session/account removal. Empty session means all
// user connections; callbacks receive only opaque references, never session secrets.
func (s *Service) OnRevocation(fn func(sessionID, userID string)) func() {
	h := s.revocations
	h.mu.Lock()
	h.next++
	id := h.next
	h.listeners[id] = fn
	h.mu.Unlock()

	return func() { h.mu.Lock(); delete(h.listeners, id); h.mu.Unlock() }
}

// AccountDeleted closes authentication consumers after coordinated account commit.
func (s *Service) AccountDeleted(userID string) { s.notifyRevocation("", userID) }

func (s *Service) notifyRevocation(sessionID, userID string) {
	h := s.revocations
	h.mu.Lock()
	callbacks := make([]func(string, string), 0, len(h.listeners))
	for _, fn := range h.listeners {
		callbacks = append(callbacks, fn)
	}

	h.mu.Unlock()
	for _, fn := range callbacks {
		fn(sessionID, userID)
	}
}
