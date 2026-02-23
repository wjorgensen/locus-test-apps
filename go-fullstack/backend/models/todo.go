package models

import "time"

// Todo represents a todo item
type Todo struct {
	ID        int       `json:"id" db:"id"`
	Title     string    `json:"title" db:"title" binding:"required"`
	Completed bool      `json:"completed" db:"completed"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// CreateTodoInput represents the input for creating a todo
type CreateTodoInput struct {
	Title     string `json:"title" binding:"required"`
	Completed bool   `json:"completed"`
}

// UpdateTodoInput represents the input for updating a todo
type UpdateTodoInput struct {
	Title     *string `json:"title"`
	Completed *bool   `json:"completed"`
}
