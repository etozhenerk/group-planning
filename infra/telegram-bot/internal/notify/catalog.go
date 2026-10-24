// Package notify validates monitoring events and coordinates technical notifications.
package notify

import (
	"embed"
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"strings"
)

//go:embed rules.json
var catalogFiles embed.FS

// Config contains deployment identifiers, never the Telegram token.
type Config struct {
	FolderID    string            `json:"folder_id"`
	InstanceID  string            `json:"instance_id"`
	Environment string            `json:"environment"`
	ChatID      string            `json:"chat_id"`
	SecretID    string            `json:"secret_id"`
	Dashboards  map[string]string `json:"dashboards"`
}

// Rule defines a trusted metric query and its operational meaning.
type Rule struct {
	ID            string  `json:"id"`
	Title         string  `json:"title"`
	Unit          string  `json:"unit"`
	Query         string  `json:"query"`
	Warning       float64 `json:"warning"`
	Alarm         float64 `json:"alarm"`
	Comparison    string  `json:"comparison"`
	WindowMinutes int     `json:"window_minutes"`
	Dashboard     string  `json:"dashboard"`
	Action        string  `json:"action"`
}

// Event is the documented Monium function-channel payload.
type Event struct {
	AlertID  string            `json:"alertId"`
	Status   string            `json:"alertStatus"`
	FolderID string            `json:"folderId"`
	Labels   map[string]string `json:"labels"`
}

// Alert contains only trusted fields suitable for an operator notification.
type Alert struct {
	Rule         Rule
	Status       string
	InstanceID   string
	Environment  string
	DashboardURL string
}

// Catalog resolves only deployment-specific allowlisted alert identifiers.
type Catalog struct {
	config Config
	rules  map[string]Rule
}

// NewCatalog validates deployment identifiers and binds embedded queries.
func NewCatalog(config Config) (*Catalog, error) {
	id := regexp.MustCompile(`^[a-z0-9]{1,50}$`)
	if !id.MatchString(config.FolderID) || !id.MatchString(config.InstanceID) || !id.MatchString(config.SecretID) || config.Environment != "production" || !regexp.MustCompile(`^-?[1-9][0-9]{0,19}$`).MatchString(config.ChatID) {
		return nil, errors.New("invalid notification configuration")
	}

	data, err := catalogFiles.ReadFile("rules.json")
	if err != nil {
		return nil, errors.New("rule catalog unavailable")
	}

	var rules []Rule
	if err = json.Unmarshal(data, &rules); err != nil {
		return nil, errors.New("invalid rule catalog")
	}

	catalog := &Catalog{config: config, rules: make(map[string]Rule)}
	for _, rule := range rules {
		if !id.MatchString(config.Dashboards[rule.Dashboard]) {
			return nil, errors.New("missing dashboard identifier")
		}

		rule.ID = "folder__" + config.FolderID + "_" + rule.ID
		rule.Query = strings.NewReplacer("__INSTANCE_ID__", config.InstanceID).Replace(rule.Query)
		catalog.rules[rule.ID] = rule
	}

	return catalog, nil
}

// Resolve rejects untrusted identities; arbitrary annotations and names are ignored.
func (c *Catalog) Resolve(event Event) (Alert, error) {
	rule, ok := c.rules[event.AlertID]
	if !ok || (event.FolderID != "" && event.FolderID != c.config.FolderID) {
		return Alert{}, errors.New("event not allowed")
	}

	for label, want := range map[string]string{"host": c.config.InstanceID, "environment": c.config.Environment} {
		if got, exists := event.Labels[label]; exists && got != want {
			return Alert{}, errors.New("event resource not allowed")
		}
	}

	status := strings.ToUpper(strings.ReplaceAll(strings.TrimSpace(event.Status), " ", "_"))
	switch status {
	case "ALARM", "WARNING", "OK", "NO_DATA", "NODATA", "ERROR":
	default:
		return Alert{}, errors.New("event status not allowed")
	}

	if status == "NODATA" {
		status = "NO_DATA"
	}

	return Alert{
		Rule: rule, Status: status, InstanceID: c.config.InstanceID, Environment: c.config.Environment,
		DashboardURL: fmt.Sprintf("https://monium.yandex.cloud/projects/folder__%s/dashboards/%s", c.config.FolderID, c.config.Dashboards[rule.Dashboard]),
	}, nil
}
