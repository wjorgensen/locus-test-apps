package handlers

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/locus/go-fullstack-backend/database"
)

// StatsResponse represents the statistics response
type StatsResponse struct {
	TotalTodos     int `json:"total_todos"`
	CompletedTodos int `json:"completed_todos"`
	PendingTodos   int `json:"pending_todos"`
}

// GetStats handles GET /api/stats
func GetStats(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), defaultTimeout)
	defer cancel()

	var stats StatsResponse

	// Get total count
	err := database.DB.QueryRow(ctx, `SELECT COUNT(*) FROM todos`).Scan(&stats.TotalTodos)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch statistics"})
		return
	}

	// Get completed count
	err = database.DB.QueryRow(ctx, `SELECT COUNT(*) FROM todos WHERE completed = true`).Scan(&stats.CompletedTodos)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch statistics"})
		return
	}

	// Calculate pending
	stats.PendingTodos = stats.TotalTodos - stats.CompletedTodos

	c.JSON(http.StatusOK, stats)
}
