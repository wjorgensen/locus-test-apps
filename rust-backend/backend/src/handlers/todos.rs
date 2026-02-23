use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;

use crate::{
    db, error::AppError, error::Result, models::{CreateTodo, Todo, UpdateTodo}, AppState
};

const CACHE_KEY: &str = "todos:list";
const CACHE_TTL: u64 = 60; // 60 seconds

pub async fn list_todos(State(state): State<AppState>) -> Result<Json<Vec<Todo>>> {
    // Try to get from cache
    if let Ok(Some(cached)) = state.cache.get(CACHE_KEY).await {
        if let Ok(todos) = serde_json::from_str::<Vec<Todo>>(&cached) {
            tracing::debug!("Returning cached todos list");
            return Ok(Json(todos));
        }
    }

    // Cache miss or parse error, fetch from database
    let todos = db::get_all_todos(&state.db).await?;

    // Store in cache
    if let Ok(json) = serde_json::to_string(&todos) {
        let _ = state.cache.set(CACHE_KEY, &json, CACHE_TTL).await;
        tracing::debug!("Cached todos list for {} seconds", CACHE_TTL);
    }

    Ok(Json(todos))
}

pub async fn get_todo(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Todo>> {
    let todo = db::get_todo_by_id(&state.db, id).await?;
    Ok(Json(todo))
}

pub async fn create_todo(
    State(state): State<AppState>,
    Json(data): Json<CreateTodo>,
) -> Result<(StatusCode, Json<Todo>)> {
    // Validate input
    data.validate()
        .map_err(|e| AppError::BadRequest(e))?;

    let todo = db::create_todo(&state.db, data).await?;

    // Invalidate cache
    let _ = state.cache.delete(CACHE_KEY).await;

    Ok((StatusCode::CREATED, Json(todo)))
}

pub async fn update_todo(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(data): Json<UpdateTodo>,
) -> Result<Json<Todo>> {
    // Validate input
    data.validate()
        .map_err(|e| AppError::BadRequest(e))?;

    let todo = db::update_todo(&state.db, id, data).await?;

    // Invalidate cache
    let _ = state.cache.delete(CACHE_KEY).await;

    Ok(Json(todo))
}

pub async fn delete_todo(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode> {
    db::delete_todo(&state.db, id).await?;

    // Invalidate cache
    let _ = state.cache.delete(CACHE_KEY).await;

    Ok(StatusCode::NO_CONTENT)
}
