package repository

import (
	"database/sql"
	"fmt"
	"log"

	"geofencing-backend/internal/models"
	_ "github.com/lib/pq"
)

type PostgresRepo struct {
	db *sql.DB
}

func NewPostgresRepo(connStr string) (*PostgresRepo, error) {
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	// Initialize PostGIS and Tables
	if err := initializeDB(db); err != nil {
		return nil, err
	}

	return &PostgresRepo{db: db}, nil
}

func initializeDB(db *sql.DB) error {
	queries := []string{
		`CREATE EXTENSION IF NOT EXISTS postgis;`,
		`CREATE TABLE IF NOT EXISTS vehicles (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			vehicle_number TEXT NOT NULL UNIQUE,
			driver_name TEXT,
			vehicle_type TEXT,
			phone TEXT,
			status TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS geofences (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name TEXT NOT NULL,
			description TEXT,
			category TEXT,
			geom GEOMETRY(Polygon, 4326),
			status TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS vehicle_locations (
			id BIGSERIAL PRIMARY KEY,
			vehicle_id UUID REFERENCES vehicles(id),
			geom GEOMETRY(Point, 4326),
			timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS violations (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			vehicle_id UUID REFERENCES vehicles(id),
			geofence_id UUID REFERENCES geofences(id),
			event_type TEXT,
			geom GEOMETRY(Point, 4326),
			timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE INDEX IF NOT EXISTS idx_geofences_geom ON geofences USING GIST(geom);`,
		`CREATE INDEX IF NOT EXISTS idx_locations_geom ON vehicle_locations USING GIST(geom);`,
	}

	for _, q := range queries {
		if _, err := db.Exec(q); err != nil {
			return fmt.Errorf("error executing query %s: %v", q, err)
		}
	}
	log.Println("Database schema initialized with PostGIS.")
	return nil
}

func (r *PostgresRepo) CreateVehicle(v *models.Vehicle) error {
	query := `INSERT INTO vehicles (vehicle_number, driver_name, vehicle_type, phone, status) 
              VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at`
	return r.db.QueryRow(query, v.VehicleNumber, v.DriverName, v.VehicleType, v.Phone, v.Status).Scan(&v.ID, &v.CreatedAt)
}

func (r *PostgresRepo) GetVehicles() ([]*models.Vehicle, error) {
	rows, err := r.db.Query(`SELECT id, vehicle_number, driver_name, vehicle_type, phone, status, created_at FROM vehicles`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var vehicles []*models.Vehicle
	for rows.Next() {
		v := &models.Vehicle{}
		if err := rows.Scan(&v.ID, &v.VehicleNumber, &v.DriverName, &v.VehicleType, &v.Phone, &v.Status, &v.CreatedAt); err != nil {
			return nil, err
		}
		vehicles = append(vehicles, v)
	}
	return vehicles, nil
}

func (r *PostgresRepo) CreateGeofence(g *models.Geofence) error {
	// Coordinates are expected as [][]float64: [[lat, lng], [lat, lng]...]
	// Convert to WKT: POLYGON((lng lat, lng lat, ...))
	wkt := "POLYGON(("
	for i, coord := range g.Coordinates {
		wkt += fmt.Sprintf("%f %f", coord[1], coord[0]) // PostGIS uses Longitude Latitude
		if i < len(g.Coordinates)-1 {
			wkt += ","
		}
	}
	// Close the polygon by adding the first point again
	wkt += fmt.Sprintf(",%f %f", g.Coordinates[0][1], g.Coordinates[0][0])
	wkt += "))"
	g.WKT = wkt

	query := `INSERT INTO geofences (name, description, category, geom, status) 
              VALUES ($1, $2, $3, ST_GeomFromText($4, 4326), $5) RETURNING id, created_at`
	return r.db.QueryRow(query, g.Name, g.Description, g.Category, wkt, g.Status).Scan(&g.ID, &g.CreatedAt)
}

func (r *PostgresRepo) GetGeofences(category string) ([]*models.Geofence, error) {
	var query string
	var args []interface{}

	if category != "" {
		query = `SELECT id, name, description, category, ST_AsText(geom), status, created_at FROM geofences WHERE category = $1`
		args = append(args, category)
	} else {
		query = `SELECT id, name, description, category, ST_AsText(geom), status, created_at FROM geofences`
	}

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var geofences []*models.Geofence
	for rows.Next() {
		g := &models.Geofence{}
		var wkt string
		if err := rows.Scan(&g.ID, &g.Name, &g.Description, &g.Category, &wkt, &g.Status, &g.CreatedAt); err != nil {
			return nil, err
		}
		g.WKT = wkt
		geofences = append(geofences, g)
	}
	return geofences, nil
}

func (r *PostgresRepo) GetVehicleByID(id string) (*models.Vehicle, error) {
	v := &models.Vehicle{}
	query := `SELECT id, vehicle_number, driver_name, vehicle_type, phone, status, created_at FROM vehicles WHERE id = $1`
	err := r.db.QueryRow(query, id).Scan(&v.ID, &v.VehicleNumber, &v.DriverName, &v.VehicleType, &v.Phone, &v.Status, &v.CreatedAt)
	if err != nil {
		return nil, err
	}
	return v, nil
}

func (r *PostgresRepo) GetGeofenceByID(id string) (*models.Geofence, error) {
	g := &models.Geofence{}
	var wkt string
	query := `SELECT id, name, description, category, ST_AsText(geom), status, created_at FROM geofences WHERE id = $1`
	err := r.db.QueryRow(query, id).Scan(&g.ID, &g.Name, &g.Description, &g.Category, &wkt, &g.Status, &g.CreatedAt)
	if err != nil {
		return nil, err
	}
	g.WKT = wkt
	return g, nil
}

func (r *PostgresRepo) UpdateLocation(loc *models.VehicleLocation) error {
	query := `INSERT INTO vehicle_locations (vehicle_id, geom, timestamp) 
              VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4)`
	_, err := r.db.Exec(query, loc.VehicleID, loc.Longitude, loc.Latitude, loc.Timestamp)
	return err
}

func (r *PostgresRepo) GetLastLocation(vehicleID string) (*models.VehicleLocation, error) {
	var loc models.VehicleLocation
	query := `SELECT ST_X(geom), ST_Y(geom), timestamp FROM vehicle_locations 
              WHERE vehicle_id = $1 ORDER BY timestamp DESC LIMIT 1`
	err := r.db.QueryRow(query, vehicleID).Scan(&loc.Longitude, &loc.Latitude, &loc.Timestamp)
	if err != nil {
		return nil, err
	}
	loc.VehicleID = vehicleID
	return &loc, nil
}

func (r *PostgresRepo) CheckGeofenceStatus(vehicleID string, lat, lng float64) ([]*models.GeofenceStatus, error) {
	query := `SELECT g.id, g.name, ST_Contains(g.geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)) 
              FROM geofences g`
	rows, err := r.db.Query(query, lng, lat)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var statuses []*models.GeofenceStatus
	for rows.Next() {
		var id, name string
		var isInside bool
		if err := rows.Scan(&id, &name, &isInside); err != nil {
			return nil, err
		}
		status := "outside"
		if isInside {
			status = "inside"
		}
		statuses = append(statuses, &models.GeofenceStatus{
			GeofenceID: id,
			GeofenceName: name,
			Status: status,
		})
	}
	return statuses, nil
}

func (r *PostgresRepo) RecordViolation(v *models.Violation) error {
	query := `INSERT INTO violations (vehicle_id, geofence_id, event_type, geom, timestamp) 
              VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6)`
	_, err := r.db.Exec(query, v.VehicleID, v.GeofenceID, v.EventType, v.Longitude, v.Latitude, v.Timestamp)
	return err
}

func (r *PostgresRepo) GetViolations() ([]*models.Violation, error) {
	rows, err := r.db.Query(`SELECT id, vehicle_id, geofence_id, event_type, ST_X(geom), ST_Y(geom), timestamp FROM violations ORDER BY timestamp DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var violations []*models.Violation
	for rows.Next() {
		v := &models.Violation{}
		if err := rows.Scan(&v.ID, &v.VehicleID, &v.GeofenceID, &v.EventType, &v.Longitude, &v.Latitude, &v.Timestamp); err != nil {
			return nil, err
		}
		violations = append(violations, v)
	}
	return violations, nil
}
