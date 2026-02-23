use redis::{aio::ConnectionManager, AsyncCommands, Client};

use crate::error::{AppError, Result};

#[derive(Clone)]
pub struct CacheClient {
    manager: ConnectionManager,
}

impl CacheClient {
    pub async fn new(redis_url: &str) -> Result<Self> {
        let client = Client::open(redis_url).map_err(AppError::Redis)?;
        let manager = ConnectionManager::new(client).await.map_err(AppError::Redis)?;

        tracing::info!("Redis connection established");

        Ok(Self { manager })
    }

    pub async fn check_connection(&self) -> Result<()> {
        let mut conn = self.manager.clone();
        redis::cmd("PING")
            .query_async::<_, String>(&mut conn)
            .await
            .map(|_| ())
            .map_err(AppError::Redis)
    }

    pub async fn get(&self, key: &str) -> Result<Option<String>> {
        let mut conn = self.manager.clone();
        conn.get(key).await.map_err(AppError::Redis)
    }

    pub async fn set(&self, key: &str, value: &str, ttl_seconds: u64) -> Result<()> {
        let mut conn = self.manager.clone();
        conn.set_ex(key, value, ttl_seconds)
            .await
            .map_err(AppError::Redis)
    }

    pub async fn delete(&self, key: &str) -> Result<()> {
        let mut conn = self.manager.clone();
        conn.del(key).await.map_err(AppError::Redis)
    }

    pub async fn invalidate_pattern(&self, pattern: &str) -> Result<()> {
        let mut conn = self.manager.clone();

        // Get all keys matching pattern
        let keys: Vec<String> = conn.keys(pattern).await.map_err(AppError::Redis)?;

        if !keys.is_empty() {
            // Delete all matching keys
            conn.del::<_, ()>(keys).await.map_err(AppError::Redis)?;
        }

        Ok(())
    }
}
