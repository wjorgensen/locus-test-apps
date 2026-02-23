package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/locus/go-fullstack-backend/cache"
	"github.com/locus/go-fullstack-backend/database"
)

// HealthResponse represents the health check response
type HealthResponse struct {
	Status    string           `json:"status"`
	Timestamp string           `json:"timestamp"`
	Database  ServiceHealth    `json:"database"`
	Redis     ServiceHealth    `json:"redis"`
}

type ServiceHealth struct {
	Connected bool `json:"connected"`
}

// HealthCheck handles GET /health
func HealthCheck(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	response := HealthResponse{
		Status:    "ok",
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Database:  ServiceHealth{Connected: false},
		Redis:     ServiceHealth{Connected: false},
	}

	// Check database
	if err := database.Ping(ctx); err != nil {
		c.JSON(http.StatusServiceUnavailable, response)
		return
	}
	response.Database.Connected = true

	// Check Redis
	if err := cache.Ping(ctx); err != nil {
		c.JSON(http.StatusServiceUnavailable, response)
		return
	}
	response.Redis.Connected = true

	c.JSON(http.StatusOK, response)
}
