use axum::{extract::State, http::StatusCode, Json};
use serde::Serialize;

use crate::{db, error::Result, AppState};

#[derive(Serialize)]
pub struct HealthResponse {
    pub status: String,
    pub database: String,
    pub redis: String,
}

pub async fn health_check(State(state): State<AppState>) -> Result<Json<HealthResponse>> {
    let db_status = match db::check_connection(&state.db).await {
        Ok(_) => "healthy".to_string(),
        Err(e) => format!("unhealthy: {}", e),
    };

    let redis_status = match state.cache.check_connection().await {
        Ok(_) => "healthy".to_string(),
        Err(e) => format!("unhealthy: {}", e),
    };

    let overall_status = if db_status == "healthy" && redis_status == "healthy" {
        "healthy"
    } else {
        "unhealthy"
    };

    Ok(Json(HealthResponse {
        status: overall_status.to_string(),
        database: db_status,
        redis: redis_status,
    }))
}

pub async fn ready_check(State(state): State<AppState>) -> Result<StatusCode> {
    db::check_connection(&state.db).await?;
    state.cache.check_connection().await?;
    Ok(StatusCode::OK)
}
