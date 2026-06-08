package service

import (
	"errors"
	"geofencing-backend/internal/models"
	"geofencing-backend/internal/repository"
)

type GeofencingService struct {
	repo repository.Repository
}

func NewGeofencingService(repo repository.Repository) *GeofencingService {
	return &GeofencingService{repo: repo}
}

// CheckIfPointInPolygon implements the Ray-Casting algorithm for point-in-polygon test
func (s *GeofencingService) CheckIfPointInPolygon(point []float64, polygon [][]float64) bool {
	if len(polygon) < 4 {
		return false
	}
	
	inside := false
	x, y := point[0], point[1]
	
	for i, j := 0, len(polygon)-1; i < len(polygon); j, i = i, i+1 {
		xi, yi := polygon[i][0], polygon[i][1]
		xj, yj := polygon[j][0], polygon[j][1]
		
		intersect := ((yi > y) != (yj > y)) && 
			(x < (xj-xi)*(y-yi)/(yj-yi)+xi)
		if intersect {
			inside = !inside
		}
	}
	return inside
}

// ProcessLocationUpdate handles the core business logic for a location update
func (s *GeofencingService) ProcessLocationUpdate(loc models.VehicleLocation) ([]models.GeofenceStatus, []models.Violation, error) {
	// 1. Get previous location to detect entry/exit
	prevLoc, _ := s.repo.GetLastLocation(loc.VehicleID)
	
	// 2. Update current location
	if err := s.repo.UpdateLocation(loc); err != nil {
		return nil, nil, err
	}

	// 3. Perform a single PostGIS query to find all geofences the vehicle is currently inside
	currentStatuses, err := s.repo.CheckGeofenceStatus(loc.VehicleID, loc.Latitude, loc.Longitude)
	if err != nil {
		return nil, nil, err
	}

	// Map for quick lookup of current "Inside" set
	currentInsideSet := make(map[string]bool)
	for _, status := range currentStatuses {
		if status.Status == "inside" {
			currentInsideSet[status.GeofenceID] = true
		}
	}

	// 4. Get previous "Inside" set using the previous location
	var prevInsideSet = make(map[string]bool)
	if !prevLoc.Timestamp.IsZero() {
		prevStatuses, _ := s.repo.CheckGeofenceStatus(loc.VehicleID, prevLoc.Latitude, prevLoc.Longitude)
		for _, status := range prevStatuses {
			if status.Status == "inside" {
				prevInsideSet[status.GeofenceID] = true
			}
		}
	}

	var violations []models.Violation

	// 5. Detect Transitions (Symmetric Difference of Sets)
	// Entry: In Current, Not In Previous
	for id, isInside := range currentInsideSet {
		if isInside && !prevInsideSet[id] {
			g, _ := s.repo.GetGeofenceByID(id)
			viol := models.Violation{
				VehicleID:    loc.VehicleID,
				GeofenceID:   id,
				GeofenceName: g.Name,
				EventType:    "entry",
				Latitude:     loc.Latitude,
				Longitude:    loc.Longitude,
				Timestamp:    loc.Timestamp,
			}
			s.repo.CreateViolation(viol)
			violations = append(violations, viol)
		}
	}

	// Exit: In Previous, Not In Current
	for id := range prevInsideSet {
		if !currentInsideSet[id] {
			g, _ := s.repo.GetGeofenceByID(id)
			viol := models.Violation{
				VehicleID:    loc.VehicleID,
				GeofenceID:   id,
				GeofenceName: g.Name,
				EventType:    "exit",
				Latitude:     loc.Latitude,
				Longitude:    loc.Longitude,
				Timestamp:    loc.Timestamp,
			}
			s.repo.CreateViolation(viol)
			violations = append(violations, viol)
		}
	}

	return currentStatuses, violations, nil
}


func (s *GeofencingService) CreateGeofence(g models.Geofence) (models.Geofence, error) {
	// Validation
	if len(g.Coordinates) < 4 {
		return models.Geofence{}, errors.New("geofence must have at least 4 coordinates")
	}
	
	first := g.Coordinates[0]
	last := g.Coordinates[len(g.Coordinates)-1]
	if first[0] != last[0] || first[1] != last[1] {
		return models.Geofence{}, errors.New("geofence polygon must be closed (first and last points identical)")
	}

	return s.repo.CreateGeofence(g)
}
