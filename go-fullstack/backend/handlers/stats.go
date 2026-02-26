package handlers

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/locus/go-fullstack-backend/cache"
	"github.com/locus/go-fullstack-backend/database"
)

// StatsResponse represents the statistics response
type StatsResponse struct {
	PageViews  int `json:"pageViews"`
	TotalTodos int `json:"totalTodos"`
}

// GetStats handles GET /api/stats
func GetStats(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), defaultTimeout)
	defer cancel()

	// Increment page view counter in Redis
	cache.Client.Incr(ctx, "stats:page-views")
	pageViews, err := cache.Client.Get(ctx, "stats:page-views").Int()
	if err != nil {
		pageViews = 0
	}

	// Get total count
	var totalTodos int
	err = database.DB.QueryRow(ctx, `SELECT COUNT(*) FROM todos`).Scan(&totalTodos)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch statistics"})
		return
	}

	c.JSON(http.StatusOK, StatsResponse{
		PageViews:  pageViews,
		TotalTodos: totalTodos,
	})
}
