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
	Status   string            `json:"status"`
	Services map[string]string `json:"services"`
	Time     string            `json:"time"`
}

// HealthCheck handles GET /health
func HealthCheck(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	response := HealthResponse{
		Status: "healthy",
		Services: map[string]string{
			"database": "unknown",
			"redis":    "unknown",
		},
		Time: time.Now().UTC().Format(time.RFC3339),
	}

	// Check database
	if err := database.Ping(ctx); err != nil {
		response.Services["database"] = "unhealthy"
		response.Status = "unhealthy"
		c.JSON(http.StatusServiceUnavailable, response)
		return
	}
	response.Services["database"] = "healthy"

	// Check Redis
	if err := cache.Ping(ctx); err != nil {
		response.Services["redis"] = "unhealthy"
		response.Status = "unhealthy"
		c.JSON(http.StatusServiceUnavailable, response)
		return
	}
	response.Services["redis"] = "healthy"

	c.JSON(http.StatusOK, response)
}
