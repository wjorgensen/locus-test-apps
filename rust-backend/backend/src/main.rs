mod cache;
mod db;
mod error;
mod handlers;
mod models;

use std::net::SocketAddr;

use axum::{
    routing::{delete, get, post, put},
    Router,
};
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use cache::CacheClient;
use db::DbPool;

#[derive(Clone)]
pub struct AppState {
    db: DbPool,
    cache: CacheClient,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Load environment variables from .env file if present
    dotenv::dotenv().ok();

    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
                "rust_backend=debug,tower_http=debug,axum::rejection=trace".into()
            }),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Read configuration from environment
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");
    let redis_url = std::env::var("REDIS_URL")
        .unwrap_or_else(|_| "redis://127.0.0.1:6379".to_string());
    let port: u16 = std::env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse()
        .expect("PORT must be a valid number");

    tracing::info!("Starting Rust backend server");
    tracing::info!("Database URL: {}", mask_url(&database_url));
    tracing::info!("Redis URL: {}", mask_url(&redis_url));

    // Initialize database
    let db_pool = db::create_pool(&database_url).await?;
    db::initialize_schema(&db_pool).await?;

    // Initialize cache
    let cache_client = CacheClient::new(&redis_url).await?;

    // Create application state
    let state = AppState {
        db: db_pool,
        cache: cache_client,
    };

    // Configure CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Build application router
    let app = Router::new()
        // Health checks
        .route("/health", get(handlers::health_check))
        .route("/ready", get(handlers::ready_check))
        // API routes
        .route("/api/todos", get(handlers::list_todos))
        .route("/api/todos", post(handlers::create_todo))
        .route("/api/todos/:id", get(handlers::get_todo))
        .route("/api/todos/:id", put(handlers::update_todo))
        .route("/api/todos/:id", delete(handlers::delete_todo))
        .route("/api/stats", get(handlers::get_stats))
        // Add state, CORS, and tracing
        .with_state(state)
        .layer(cors)
        .layer(TraceLayer::new_for_http());

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("Server listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

fn mask_url(url: &str) -> String {
    if let Some(at_pos) = url.find('@') {
        if let Some(protocol_end) = url.find("://") {
            let protocol = &url[..protocol_end + 3];
            let host = &url[at_pos + 1..];
            return format!("{}***@{}", protocol, host);
        }
    }
    url.to_string()
}
