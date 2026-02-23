package cache

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

var Client *redis.Client

// InitRedis initializes the Redis client
func InitRedis(redisURL string) error {
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return fmt.Errorf("unable to parse Redis URL: %w", err)
	}

	// Configure client
	opts.PoolSize = 10
	opts.MinIdleConns = 5
	opts.MaxRetries = 3
	opts.DialTimeout = 5 * time.Second
	opts.ReadTimeout = 3 * time.Second
	opts.WriteTimeout = 3 * time.Second

	Client = redis.NewClient(opts)

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := Client.Ping(ctx).Err(); err != nil {
		return fmt.Errorf("unable to ping Redis: %w", err)
	}

	log.Println("Redis connection established")
	return nil
}

// Close closes the Redis client
func Close() error {
	if Client != nil {
		if err := Client.Close(); err != nil {
			return fmt.Errorf("error closing Redis client: %w", err)
		}
		log.Println("Redis connection closed")
	}
	return nil
}

// Ping checks if Redis is accessible
func Ping(ctx context.Context) error {
	return Client.Ping(ctx).Err()
}
