# RealData - YouTube Scraper API

Scrape authentic data from all platforms. A robust YouTube data scraper API that fetches video information, comments, and metadata with comprehensive error handling.

## Features

- 🔍 **Smart Search**: Uses YouTube suggestions to expand search terms
- 💬 **Comment Extraction**: Fetches top comments from videos
- 🛡️ **Error Handling**: Comprehensive error handling for API failures
- ⚡ **Concurrent Processing**: Batch processing for optimal performance
- 🎛️ **Configurable Parameters**: Control suggestion count and video count
- 🚀 **Graceful Shutdown**: Proper server lifecycle management

## API Endpoints

### GET /search

Search for YouTube videos with optional parameters.

**Parameters:**
- `q` (required): Search query
- `suggestionCount` (optional, default: 4, range: 0-10): Number of YouTube suggestions to use
- `videoCount` (optional, default: 15, range: 1-50): Maximum number of videos to return

**Example:**
```bash
GET /search?q=javascript tutorial&suggestionCount=6&videoCount=20
```

**Response:**
```json
{
  "query": "javascript tutorial",
  "videos": [
    {
      "id": "video_id",
      "title": "Video Title",
      "url": "https://youtube.com/watch?v=video_id",
      "views": 1000000,
      "uploadedAt": "2023-01-01",
      "comments": ["Comment 1", "Comment 2"]
    }
  ]
}
```

## Installation

### Option 1: Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set environment variables (optional):
   ```bash
   PORT=3000
   NODE_ENV=production
   ```
4. Start the server:
   ```bash
   npm start
   ```

### Option 2: Docker Deployment

#### Using Docker Compose (Recommended)

1. Clone the repository
2. Deploy with Docker Compose:
   ```bash
   docker-compose up -d
   ```

#### Using Docker directly

1. Build the Docker image:
   ```bash
   docker build -t youtube-scraper .
   ```
2. Run the container:
   ```bash
   docker run -d -p 3000:3000 --name youtube-scraper-api youtube-scraper
   ```

#### Docker Environment Variables

You can customize the deployment with environment variables:

```bash
# Using docker run
docker run -d -p 3000:3000 -e NODE_ENV=production -e PORT=3000 youtube-scraper

# Using docker-compose
# Edit docker-compose.yml environment section
```

## Dependencies

- `express`: Web framework
- `youtube-sr`: YouTube search functionality
- `youtube-transcript`: Transcript extraction
- `youtube-comment-downloader`: Comment fetching
- `dotenv`: Environment variable management

## Docker Features

The Docker setup includes:
- **Multi-stage build** for optimized image size
- **Security**: Non-root user execution
- **Health checks** for container monitoring
- **Resource limits** to prevent resource exhaustion
- **Logging configuration** with rotation
- **Auto-restart** on failure

## Error Handling

The API includes comprehensive error handling:
- API failure resilience
- Input validation and sanitization
- Graceful degradation when services are unavailable
- Proper HTTP status codes and error messages
- Server startup and shutdown handling

## Production Deployment

For production deployment:

1. **Using Docker Compose** (Recommended):
   ```bash
   git clone https://github.com/milind-k8/RealData.git
   cd RealData
   docker-compose up -d
   ```

2. **Using Docker Swarm**:
   ```bash
   docker stack deploy -c docker-compose.yml youtube-scraper
   ```

3. **Using Kubernetes**: Convert docker-compose.yml to Kubernetes manifests

## License

MIT
