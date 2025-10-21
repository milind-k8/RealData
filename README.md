# YouTube Scraper API

A robust YouTube data scraper API that fetches video information, comments, and metadata with comprehensive error handling.

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

## Dependencies

- `express`: Web framework
- `youtube-sr`: YouTube search functionality
- `youtube-transcript`: Transcript extraction
- `youtube-comment-downloader`: Comment fetching
- `dotenv`: Environment variable management

## Error Handling

The API includes comprehensive error handling:
- API failure resilience
- Input validation and sanitization
- Graceful degradation when services are unavailable
- Proper HTTP status codes and error messages
- Server startup and shutdown handling

## License

MIT
