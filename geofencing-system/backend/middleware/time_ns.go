package middleware

import (
	"encoding/json"
	"net/http"
	"time"
	"fmt"
)

// ResponseWrapper is used to add the time_ns field to all API responses
type ResponseWrapper struct {
	Data    interface{} `json:"data,omitempty"`
	TimeNs  string      `json:"time_ns"`
}

// TimeMeasurementMiddleware measures the execution time of each request in nanoseconds
func TimeMeasurementMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Create a custom response writer to capture the original response
		rw := &responseWriter{ResponseWriter: w, body: []byte{}}

		next.ServeHTTP(rw, r)

		duration := time.Since(start).Nanoseconds()

		// We need to wrap the original response and add time_ns
		var originalData interface{}
		if len(rw.body) > 0 {
			_ = json.Unmarshal(rw.body, &originalData)
		}

		finalResponse := make(map[string]interface{})
		finalResponse["time_ns"] = fmt.Sprintf("%d", duration)
		
		// If there was data, merge it into the final response
		if originalData != nil {
			if dataMap, ok := originalData.(map[string]interface{}); ok {
				for k, v := range dataMap {
					finalResponse[k] = v
				}
			} else {
				finalResponse["data"] = originalData
			}
		}

		// Set header and write the final response
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(finalResponse)
	})
}

type responseWriter struct {
	http.ResponseWriter
	body []byte
}

func (rw *responseWriter) Write(b []byte) (int, error) {
	rw.body = append(rw.body, b...)
	return len(b), nil
}
