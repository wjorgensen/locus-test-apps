use sqlx::{postgres::PgPoolOptions, Pool, Postgres};
use uuid::Uuid;

use crate::{
    error::{AppError, Result},
    models::{CreateTodo, Todo, UpdateTodo},
};

pub type DbPool = Pool<Postgres>;

pub async fn create_pool(database_url: &str) -> Result<DbPool> {
    PgPoolOptions::new()
        .max_connections(5)
        .connect(database_url)
        .await
        .map_err(AppError::Database)
}

pub async fn initialize_schema(pool: &DbPool) -> Result<()> {
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS todos (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            completed BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        "#,
    )
    .execute(pool)
    .await?;

    tracing::info!("Database schema initialized");
    Ok(())
}

pub async fn check_connection(pool: &DbPool) -> Result<()> {
    sqlx::query("SELECT 1")
        .execute(pool)
        .await
        .map(|_| ())
        .map_err(AppError::Database)
}

pub async fn get_all_todos(pool: &DbPool) -> Result<Vec<Todo>> {
    sqlx::query_as::<_, Todo>(
        r#"
        SELECT id, title, completed, created_at
        FROM todos
        ORDER BY created_at DESC
        "#,
    )
    .fetch_all(pool)
    .await
    .map_err(AppError::Database)
}

pub async fn get_todo_by_id(pool: &DbPool, id: Uuid) -> Result<Todo> {
    sqlx::query_as::<_, Todo>(
        r#"
        SELECT id, title, completed, created_at
        FROM todos
        WHERE id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Todo with id {} not found", id)))
}

pub async fn create_todo(pool: &DbPool, data: CreateTodo) -> Result<Todo> {
    sqlx::query_as::<_, Todo>(
        r#"
        INSERT INTO todos (title, completed)
        VALUES ($1, $2)
        RETURNING id, title, completed, created_at
        "#,
    )
    .bind(&data.title)
    .bind(data.completed)
    .fetch_one(pool)
    .await
    .map_err(AppError::Database)
}

pub async fn update_todo(pool: &DbPool, id: Uuid, data: UpdateTodo) -> Result<Todo> {
    // First check if the todo exists
    let mut todo = get_todo_by_id(pool, id).await?;

    // Update fields if provided
    if let Some(title) = data.title {
        todo.title = title;
    }
    if let Some(completed) = data.completed {
        todo.completed = completed;
    }

    // Perform the update
    sqlx::query_as::<_, Todo>(
        r#"
        UPDATE todos
        SET title = $1, completed = $2
        WHERE id = $3
        RETURNING id, title, completed, created_at
        "#,
    )
    .bind(&todo.title)
    .bind(todo.completed)
    .bind(id)
    .fetch_one(pool)
    .await
    .map_err(AppError::Database)
}

pub async fn delete_todo(pool: &DbPool, id: Uuid) -> Result<()> {
    let result = sqlx::query("DELETE FROM todos WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!(
            "Todo with id {} not found",
            id
        )));
    }

    Ok(())
}

pub async fn get_todo_stats(pool: &DbPool) -> Result<TodoStats> {
    let stats = sqlx::query_as::<_, TodoStats>(
        r#"
        SELECT
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE completed = true) as completed,
            COUNT(*) FILTER (WHERE completed = false) as pending
        FROM todos
        "#,
    )
    .fetch_one(pool)
    .await?;

    Ok(stats)
}

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
pub struct TodoStats {
    pub total: i64,
    pub completed: i64,
    pub pending: i64,
}
