package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"geofencing-backend/internal/handlers"
	"geofencing-backend/internal/repository"
	"geofencing-backend/internal/service"
	"geofencing-backend/internal/ws"
	"geofencing-backend/middleware"

	"github.com/gorilla/mux"
)

func main() {
	// 1. Initialize Database Connection
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbUser := os.Getenv("DB_USER")
	dbPass := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")

	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		dbHost, dbPort, dbUser, dbPass, dbName)

	repo, err := repository.NewPostgresRepo(connStr)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// 2. Initialize Service
	geoService := service.NewGeofencingService(repo)

	// 3. Initialize WebSocket Hub
	hub := ws.NewHub()
	go hub.Run()

	// 4. Initialize Handlers
	h := handlers.NewHandler(repo, geoService, hub)

	// 5. Setup Router
	r := mux.NewRouter()

	// Apply time_ns middleware to all requests
	r.Use(middleware.TimeMeasurementMiddleware)

	// Geofence Endpoints
	r.HandleFunc("/geofences", h.CreateGeofence).Methods("POST")
	r.HandleFunc("/geofences", h.GetGeofences).Methods("GET")

	// Vehicle Endpoints
	r.HandleFunc("/vehicles", h.CreateVehicle).Methods("POST")
	r.HandleFunc("/vehicles", h.GetVehicles).Methods("GET")
	r.HandleFunc("/vehicles/location", h.UpdateLocation).Methods("POST")
	r.HandleFunc("/vehicles/location/{vehicle_id}", h.GetVehicleLocation).Methods("GET")

	// Alert Endpoints
	r.HandleFunc("/alerts/configure", h.ConfigureAlert).Methods("POST")
	r.HandleFunc("/alerts", h.GetAlerts).Methods("GET")

	// Violation Endpoints
	r.HandleFunc("/violations/history", h.GetViolations).Methods("GET")

	// WebSocket Endpoint
	r.HandleFunc("/ws/alerts", func(w http.ResponseWriter, r *http.Request) {
		ws.ServeWs(hub, w, r)
	})

	port := ":8080"
	fmt.Printf("Server starting on port %s...
", port)
	log.Fatal(http.ListenAndServe(port, r))
}
