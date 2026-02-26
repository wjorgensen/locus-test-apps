package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/locus/go-fullstack-backend/cache"
	"github.com/locus/go-fullstack-backend/database"
	"github.com/locus/go-fullstack-backend/models"
)

const (
	todoCacheKey    = "todos:list"
	todoCacheTTL    = 60 * time.Second
	defaultTimeout  = 10 * time.Second
)

// ListTodos handles GET /api/todos
func ListTodos(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), defaultTimeout)
	defer cancel()

	// Try to get from cache first
	cached, err := cache.Client.Get(ctx, todoCacheKey).Result()
	if err == nil {
		var todos []models.Todo
		if err := json.Unmarshal([]byte(cached), &todos); err == nil {
			c.JSON(http.StatusOK, gin.H{"data": todos, "cached": true})
			return
		}
	}

	// Cache miss, query database
	query := `SELECT id, title, completed, created_at FROM todos ORDER BY created_at DESC`
	rows, err := database.DB.Query(ctx, query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch todos"})
		return
	}
	defer rows.Close()

	todos := []models.Todo{}
	for rows.Next() {
		var todo models.Todo
		if err := rows.Scan(&todo.ID, &todo.Title, &todo.Completed, &todo.CreatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan todo"})
			return
		}
		todos = append(todos, todo)
	}

	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error iterating todos"})
		return
	}

	// Cache the results
	if data, err := json.Marshal(todos); err == nil {
		cache.Client.Set(ctx, todoCacheKey, data, todoCacheTTL)
	}

	c.JSON(http.StatusOK, gin.H{"data": todos, "cached": false})
}

// GetTodo handles GET /api/todos/:id
func GetTodo(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), defaultTimeout)
	defer cancel()

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid todo ID"})
		return
	}

	var todo models.Todo
	query := `SELECT id, title, completed, created_at FROM todos WHERE id = $1`
	err = database.DB.QueryRow(ctx, query, id).Scan(&todo.ID, &todo.Title, &todo.Completed, &todo.CreatedAt)

	if err == pgx.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Todo not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch todo"})
		return
	}

	c.JSON(http.StatusOK, todo)
}

// CreateTodo handles POST /api/todos
func CreateTodo(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), defaultTimeout)
	defer cancel()

	var input models.CreateTodoInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var todo models.Todo
	query := `INSERT INTO todos (title, completed) VALUES ($1, $2) RETURNING id, title, completed, created_at`
	err := database.DB.QueryRow(ctx, query, input.Title, input.Completed).
		Scan(&todo.ID, &todo.Title, &todo.Completed, &todo.CreatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create todo"})
		return
	}

	// Invalidate cache
	cache.Client.Del(ctx, todoCacheKey)

	c.JSON(http.StatusCreated, todo)
}

// UpdateTodo handles PUT /api/todos/:id
func UpdateTodo(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), defaultTimeout)
	defer cancel()

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid todo ID"})
		return
	}

	var input models.UpdateTodoInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Build dynamic update query
	updates := []string{}
	args := []interface{}{}
	argIndex := 1

	if input.Title != nil {
		updates = append(updates, fmt.Sprintf("title = $%d", argIndex))
		args = append(args, *input.Title)
		argIndex++
	}

	if input.Completed != nil {
		updates = append(updates, fmt.Sprintf("completed = $%d", argIndex))
		args = append(args, *input.Completed)
		argIndex++
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No fields to update"})
		return
	}

	args = append(args, id)
	query := fmt.Sprintf(`
		UPDATE todos SET %s
		WHERE id = $%d
		RETURNING id, title, completed, created_at
	`,
		string(updates[0]),
		argIndex,
	)

	// Build full query with all updates
	if len(updates) > 1 {
		query = fmt.Sprintf(`
			UPDATE todos SET %s
			WHERE id = $%d
			RETURNING id, title, completed, created_at
		`,
			joinUpdates(updates),
			argIndex,
		)
	}

	var todo models.Todo
	err = database.DB.QueryRow(ctx, query, args...).
		Scan(&todo.ID, &todo.Title, &todo.Completed, &todo.CreatedAt)

	if err == pgx.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Todo not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update todo"})
		return
	}

	// Invalidate cache
	cache.Client.Del(ctx, todoCacheKey)

	c.JSON(http.StatusOK, todo)
}

// DeleteTodo handles DELETE /api/todos/:id
func DeleteTodo(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), defaultTimeout)
	defer cancel()

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid todo ID"})
		return
	}

	query := `DELETE FROM todos WHERE id = $1`
	result, err := database.DB.Exec(ctx, query, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete todo"})
		return
	}

	if result.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Todo not found"})
		return
	}

	// Invalidate cache
	cache.Client.Del(ctx, todoCacheKey)

	c.Status(http.StatusNoContent)
}

// Helper function to join update clauses
func joinUpdates(updates []string) string {
	result := ""
	for i, update := range updates {
		if i > 0 {
			result += ", "
		}
		result += update
	}
	return result
}
