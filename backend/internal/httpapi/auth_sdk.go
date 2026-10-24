package httpapi

import "net/http"

type sdkExchangeRequest struct {
	AttemptID   string `json:"attempt_id"`
	AppVerifier string `json:"app_verifier"`
	OAuthToken  string `json:"oauth_token"`
}

func (h authHandlers) exchangeSDK(w http.ResponseWriter, r *http.Request) {
	if !requireMethod(w, r, http.MethodPost) {
		return
	}

	if h.service == nil {
		writeError(w, 503, "auth_unavailable", nil)
		return
	}

	var input sdkExchangeRequest
	if !decodeJSON(w, r, &input) {
		return
	}

	result, err := h.service.ExchangeSDK(r.Context(), input.AttemptID, input.AppVerifier, input.OAuthToken)
	if err != nil {
		writeAuthError(w, err)
		return
	}

	writeJSON(w, 200, exchangeResponse{result.Secret, result.ExpiresAt, authContextResponse{result.Context.Kind, result.Context.Token}})
}
