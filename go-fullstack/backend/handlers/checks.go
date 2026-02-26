package handlers

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/locus/go-fullstack-backend/cache"
	"github.com/locus/go-fullstack-backend/database"
)

// DbCheck handles GET /api/db-check
func DbCheck(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), defaultTimeout)
	defer cancel()

	start := time.Now()

	var currentDB, currentUser, version string
	err := database.DB.QueryRow(ctx, `SELECT current_database(), current_user, version()`).
		Scan(&currentDB, &currentUser, &version)

	latency := time.Since(start).Milliseconds()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"connected": false,
			"error":     err.Error(),
		})
		return
	}

	// Truncate version string to "PostgreSQL X.Y"
	parts := strings.SplitN(version, " ", 3)
	shortVersion := version
	if len(parts) >= 2 {
		shortVersion = fmt.Sprintf("%s %s", parts[0], parts[1])
	}

	c.JSON(http.StatusOK, gin.H{
		"connected": true,
		"latency":   latency,
		"database":  currentDB,
		"user":      currentUser,
		"version":   shortVersion,
	})
}

// RedisCheck handles GET /api/redis-check
func RedisCheck(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), defaultTimeout)
	defer cancel()

	start := time.Now()
	pong, err := cache.Client.Ping(ctx).Result()
	latency := time.Since(start).Milliseconds()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"connected": false,
			"error":     err.Error(),
		})
		return
	}

	// Test SET/GET
	cache.Client.Set(ctx, "health-check", "ok", 0)
	val, _ := cache.Client.Get(ctx, "health-check").Result()

	c.JSON(http.StatusOK, gin.H{
		"connected":   true,
		"ping":        pong,
		"latency":     latency,
		"setGetWorks": val == "ok",
	})
}
