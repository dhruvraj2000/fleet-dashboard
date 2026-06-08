package models

import "time"

// Geofence represents a virtual boundary
type Geofence struct {
	ID          string      `json:"id"`
	Name        string      `json:"name"`
	Description string      `json:"description,omitempty"`
	Coordinates [][]float64 `json:"coordinates"` // Array of [lat, lng]
	WKT         string      `json:"wkt,omitempty"` // Well-Known Text representation for PostGIS
	Category    string      `json:"category"`
	Status      string      `json:"status,omitempty"`
	CreatedAt   time.Time   `json:"created_at,omitempty"`
}

// Vehicle represents a registered vehicle
type Vehicle struct {
	ID            string    `json:"id"`
	VehicleNumber string    `json:"vehicle_number"`
	DriverName    string    `json:"driver_name"`
	VehicleType   string    `json:"vehicle_type"`
	Phone         string    `json:"phone"`
	Status        string    `json:"status,omitempty"`
	CreatedAt     time.Time `json:"created_at,omitempty"`
}

// VehicleLocation represents a coordinate update
type VehicleLocation struct {
	VehicleID string    `json:"vehicle_id"`
	Latitude  float64   `json:"latitude"`
	Longitude float64   `json:"longitude"`
	Timestamp time.Time `json:"timestamp"`
}

// GeofenceStatus represents the result of a point-in-polygon check
type GeofenceStatus struct {
	GeofenceID   string `json:"geofence_id"`
	GeofenceName string `json:"geofence_name"`
	Status       string `json:"status"` // inside / outside
}

// AlertConfig represents a rule for geofence notifications
type AlertConfig struct {
	AlertID    string `json:"alert_id"`
	GeofenceID string `json:"geofence_id"`
	VehicleID  string `json:"vehicle_id,omitempty"`
	EventType  string `json:"event_type"` // entry, exit, both
	Status     string `json:"status"`
	CreatedAt  time.Time `json:"created_at,omitempty"`
}

// Violation represents a historical entry/exit event
type Violation struct {
	ID           string    `json:"id"`
	VehicleID    string    `json:"vehicle_id"`
	VehicleNumber string   `json:"vehicle_number"`
	GeofenceID   string    `json:"geofence_id"`
	GeofenceName string    `json:"geofence_name"`
	EventType    string    `json:"event_type"` // entry / exit
	Latitude     float64   `json:"latitude"`
	Longitude     float64   `json:"longitude"`
	Timestamp    time.Time `json:"timestamp"`
}

