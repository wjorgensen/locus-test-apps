use axum::{extract::State, http::StatusCode, Json};
use serde::Serialize;

use crate::{db, error::Result, AppState};

#[derive(Serialize)]
pub struct ServiceHealth {
    pub connected: bool,
}

#[derive(Serialize)]
pub struct HealthResponse {
    pub status: String,
    pub database: ServiceHealth,
    pub redis: ServiceHealth,
    pub timestamp: String,
}

pub async fn health_check(State(state): State<AppState>) -> Result<Json<HealthResponse>> {
    let db_connected = db::check_connection(&state.db).await.is_ok();
    let redis_connected = state.cache.check_connection().await.is_ok();

    let overall_status = if db_connected && redis_connected {
        "ok"
    } else {
        "error"
    };

    Ok(Json(HealthResponse {
        status: overall_status.to_string(),
        database: ServiceHealth {
            connected: db_connected,
        },
        redis: ServiceHealth {
            connected: redis_connected,
        },
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

pub async fn ready_check(State(state): State<AppState>) -> Result<StatusCode> {
    db::check_connection(&state.db).await?;
    state.cache.check_connection().await?;
    Ok(StatusCode::OK)
}
