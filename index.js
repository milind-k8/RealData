import express from "express";
import { YouTube } from "youtube-sr";
import { YoutubeTranscript } from "youtube-transcript";
import dotenv from "dotenv";
import { YoutubeCommentDownloader, SORT_BY_POPULAR } from "youtube-comment-downloader";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

/* ------------------------------------------------------------------ */
/* 🔹 Helper: Fetch comments concurrently with timeout                */
/* ------------------------------------------------------------------ */
async function getComments(videoId, limit = 30, timeoutMs = 8000) {
  const downloader = new YoutubeCommentDownloader();

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Comment fetch timeout")), timeoutMs)
  );

  try {
    const task = (async () => {
      const iterator = await downloader.getComments(videoId, SORT_BY_POPULAR);
      const comments = [];

      for await (const comment of iterator) {
        if (comment.text.length > 15) {
          comments.push(comment.text);
        }
        if (comments.length >= limit) break;
      }

      console.log(`💬 ${comments.length} comments for ${videoId}`);
      return comments;
    })();

    return await Promise.race([task, timeout]);
  } catch (err) {
    console.warn(`⚠️ Failed to get comments for ${videoId}: ${err.message}`);
    return [];
  }
}


/* ------------------------------------------------------------------ */
/* 🔹 Helper: Run tasks in limited concurrency                        */
/* ------------------------------------------------------------------ */
async function runInBatches(items, batchSize, fn) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

/* ------------------------------------------------------------------ */
/* 🔹 Main Endpoint: /search                                          */
/* ------------------------------------------------------------------ */
app.get("/search", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: "Missing ?q= parameter" });

    // Parse and validate parameters
    const suggestionCount = Math.min(Math.max(parseInt(req.query.suggestionCount) || 4, 0), 10);
    const videoCount = Math.min(Math.max(parseInt(req.query.videoCount) || 15, 1), 50);

    // Input validation and sanitization
    const sanitizedQuery = query.trim().slice(0, 100); // Limit query length
    if (sanitizedQuery.length < 2) {
      return res.status(400).json({ error: "Query must be at least 2 characters long" });
    }

    console.log(`🔍 Searching for: ${sanitizedQuery} (suggestions: ${suggestionCount}, videos: ${videoCount})`);

    // Get suggestions with error handling
    let suggestions = [];
    try {
      suggestions = await YouTube.getSuggestions(sanitizedQuery);
    } catch (err) {
      console.warn(`⚠️ Failed to get suggestions: ${err.message}`);
      // Continue with just the original query if suggestions fail
    }

    const terms = [sanitizedQuery, ...suggestions.slice(0, suggestionCount)];

    // Search with individual error handling for each term
    const searchResults = await Promise.allSettled(
      terms.map(async (term) => {
        try {
          return await YouTube.search(term, { limit: 3, type: "video" });
        } catch (err) {
          console.warn(`⚠️ Search failed for term "${term}": ${err.message}`);
          return []; // Return empty array for failed searches
        }
      })
    );

    // Process search results with error handling
    const merged = searchResults
      .filter(result => result.status === "fulfilled")
      .map(result => result.value)
      .flat()
      .filter(video => video && video.id); // Filter out null/undefined videos

    if (merged.length === 0) {
      return res.json({
        query: sanitizedQuery,
        suggestionCount,
        videoCount,
        totalVideos: 0,
        videos: [],
        message: "No videos found for the given query"
      });
    }

    const uniqueVideos = Array.from(
      new Map(merged.map((v) => [v.id, v])).values()
    )
      .filter((v) => v && v.views && v.id) // Additional safety checks
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, videoCount);

    console.log(`⚡ Processing ${uniqueVideos.length} videos...`);

    // Run in batches with enhanced error handling
    const results = await runInBatches(uniqueVideos, 5, async (v) => {
      try {
        const [comments] = await Promise.allSettled([
          getComments(v.id, 15)
        ]);

        return {
          id: v.id,
          title: v.title || "Unknown Title",
          url: v.url || `https://youtube.com/watch?v=${v.id}`,
          views: v.views || 0,
          uploadedAt: v.uploadedAt || null,
          comments: comments.status === "fulfilled" ? comments.value : [],
        };
      } catch (err) {
        console.warn(`⚠️ Failed to process video ${v.id}: ${err.message}`);
        return null; // Return null for failed processing
      }
    });

    // Filter out null results and only return fulfilled results
    const enriched = results
      .filter((r) => r && r.status === "fulfilled" && r.value)
      .map((r) => r.value);

    res.json({
      query: sanitizedQuery,
      videos: enriched,
    });
  } catch (err) {
    console.error("❌ Unexpected error in /search:", err);
    res.status(500).json({ 
      error: "Internal server error occurred while processing your request",
      message: process.env.NODE_ENV === 'development' ? err.message : "Please try again later"
    });
  }
});

/* ------------------------------------------------------------------ */
/* 🔹 Server Startup with Error Handling                              */
/* ------------------------------------------------------------------ */
const server = app.listen(PORT, () => {
  console.log(`✅ Fast YouTube API running at http://localhost:${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please try a different port.`);
    process.exit(1);
  } else {
    console.error(`❌ Server startup error:`, err);
    process.exit(1);
  }
});

/* ------------------------------------------------------------------ */
/* 🔹 Graceful Shutdown Handling                                      */
/* ------------------------------------------------------------------ */
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  server.close((err) => {
    if (err) {
      console.error('❌ Error during server shutdown:', err);
      process.exit(1);
    }
    
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle different termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});
