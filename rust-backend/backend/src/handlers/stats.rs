use axum::{extract::State, Json};

use crate::{db::TodoStats, db, error::Result, AppState};

pub async fn get_stats(State(state): State<AppState>) -> Result<Json<TodoStats>> {
    let stats = db::get_todo_stats(&state.db).await?;
    Ok(Json(stats))
}
