use axum::{extract::State, Json};
use serde::Serialize;

use crate::{db, error::Result, AppState};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StatsResponse {
    pub page_views: i64,
    pub total_todos: i64,
}

pub async fn get_stats(State(state): State<AppState>) -> Result<Json<StatsResponse>> {
    // Increment page view counter in Redis
    let _ = state.cache.incr("stats:page-views").await;
    let page_views = state
        .cache
        .get("stats:page-views")
        .await
        .ok()
        .flatten()
        .and_then(|v| v.parse::<i64>().ok())
        .unwrap_or(0);

    let total_todos = db::get_total_todo_count(&state.db).await?;

    Ok(Json(StatsResponse {
        page_views,
        total_todos,
    }))
}
