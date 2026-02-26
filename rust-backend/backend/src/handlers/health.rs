use axum::{extract::State, http::StatusCode, Json};
use serde::Serialize;
use std::time::Instant;

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

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DbCheckResponse {
    pub connected: bool,
    pub latency: u64,
    pub database: String,
    pub user: String,
    pub version: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DbCheckError {
    pub connected: bool,
    pub error: String,
}

pub async fn db_check(
    State(state): State<AppState>,
) -> std::result::Result<Json<DbCheckResponse>, (StatusCode, Json<DbCheckError>)> {
    let start = Instant::now();

    let result = sqlx::query_as::<_, (String, String, String)>(
        "SELECT current_database()::text, current_user::text, version()::text",
    )
    .fetch_one(&state.db)
    .await;

    let latency = start.elapsed().as_millis() as u64;

    match result {
        Ok((database, user, version)) => {
            let short_version = version
                .splitn(3, ' ')
                .take(2)
                .collect::<Vec<&str>>()
                .join(" ");

            Ok(Json(DbCheckResponse {
                connected: true,
                latency,
                database,
                user,
                version: short_version,
            }))
        }
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(DbCheckError {
                connected: false,
                error: e.to_string(),
            }),
        )),
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RedisCheckResponse {
    pub connected: bool,
    pub ping: String,
    pub latency: u64,
    pub set_get_works: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RedisCheckError {
    pub connected: bool,
    pub error: String,
}

pub async fn redis_check(
    State(state): State<AppState>,
) -> std::result::Result<Json<RedisCheckResponse>, (StatusCode, Json<RedisCheckError>)> {
    let start = Instant::now();

    match state.cache.check_connection().await {
        Ok(()) => {
            let latency = start.elapsed().as_millis() as u64;

            // Test SET/GET
            let _ = state.cache.set("health-check", "ok", 60).await;
            let value = state.cache.get("health-check").await.unwrap_or(None);
            let set_get_works = value.as_deref() == Some("ok");

            Ok(Json(RedisCheckResponse {
                connected: true,
                ping: "PONG".to_string(),
                latency,
                set_get_works,
            }))
        }
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(RedisCheckError {
                connected: false,
                error: e.to_string(),
            }),
        )),
    }
}
