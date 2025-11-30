# Performance Analysis and Optimization Plan

## Issue Summary

The production VM (ghost-staging) is experiencing performance issues likely caused by serving large video files directly from the Ghost container.

## Current Setup

**VM Specifications:**
- Machine Type: `e2-medium`
- vCPUs: 2
- RAM: 4GB
- Status: Running

**Services Running:**
- Ghost CMS (Docker container)
- Caddy reverse proxy (Docker container)
- MongoDB (external - Atlas)

## Performance Bottlenecks Identified

### 1. **CRITICAL: Massive Video Files (150MB each)**

**Problem:**
- `sigmablox_social.mp4`: **150MB**
- `sigmablox_social_web.mp4`: **150MB**
- Both videos are served directly from Ghost on EVERY homepage visit
- Video autoplays, forcing immediate 150MB download

**Impact:**
- Saturates network bandwidth
- Maxes out disk I/O
- Strains Ghost container serving static assets
- Poor user experience (slow page loads)

### 2. Missing WebM Version

**Problem:**
- Code references `sigmablox_social_web.webm` but file doesn't exist
- Falls back to large MP4 files
- WebM is typically 30-50% smaller than MP4

### 3. Missing Mobile-Optimized Version

**Problem:**
- Code mentions `sigmablox_social_mobile.mp4` but file doesn't exist
- Mobile users download full 150MB desktop version
- Wastes bandwidth on cellular connections

### 4. No CDN for Static Assets

**Problem:**
- All static assets (videos, images, CSS, JS) served from VM
- No caching layer
- No geographic distribution

## Recommended Solutions (Prioritized)

### Solution 1: Compress Videos (IMMEDIATE - Biggest Impact)

**Action:** Re-encode videos at appropriate quality/bitrate

**Target Sizes:**
- Desktop MP4: ~10-15MB (90% reduction)
- Desktop WebM: ~7-10MB
- Mobile MP4: ~3-5MB

**Commands to compress:**
```bash
cd ghost-cloudrun/ghost-data/themes/ease/assets/videos/

# Desktop MP4 (1080p, optimized bitrate)
ffmpeg -i sigmablox_social.mp4 \
  -c:v libx264 \
  -preset slow \
  -crf 28 \
  -vf "scale=1920:1080" \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  sigmablox_social_web.mp4

# Desktop WebM (1080p, VP9 codec)
ffmpeg -i sigmablox_social.mp4 \
  -c:v libvpx-vp9 \
  -b:v 2M \
  -vf "scale=1920:1080" \
  -c:a libopus -b:a 96k \
  sigmablox_social_web.webm

# Mobile MP4 (720p, lower bitrate)
ffmpeg -i sigmablox_social.mp4 \
  -c:v libx264 \
  -preset slow \
  -crf 30 \
  -vf "scale=1280:720" \
  -c:a aac -b:a 96k \
  -movflags +faststart \
  sigmablox_social_mobile.mp4
```

**Expected Results:**
- 90% reduction in bandwidth
- Faster page loads
- Reduced VM load
- Better mobile experience

**Deployment:**
```bash
# After compressing videos
git add ghost-cloudrun/ghost-data/themes/ease/assets/videos/
git commit -m "perf: compress hero video files from 150MB to ~10MB"
git push origin main
```

### Solution 2: Use Cloud CDN (MEDIUM - Infrastructure)

**Action:** Serve static assets through Google Cloud CDN

**Benefits:**
- Offload video serving from VM
- Geographic distribution
- Edge caching
- Automatic compression (gzip/brotli)

**Implementation:**
```bash
# Enable Cloud CDN on the load balancer
gcloud compute backend-services update ghost-backend \
  --enable-cdn \
  --cache-mode=CACHE_ALL_STATIC

# Configure cache headers in Caddy
# Add to Caddyfile:
header /assets/* {
  Cache-Control "public, max-age=31536000, immutable"
}
header /content/themes/* {
  Cache-Control "public, max-age=31536000, immutable"
}
```

**Cost:** Minimal (GCP CDN pricing is very competitive)

### Solution 3: Lazy Load Video (IMMEDIATE - Easy Win)

**Action:** Update video loading strategy

**Current:** Video autoplays immediately
**Better:** Load video only when user scrolls near it

The code already has lazy loading, but we can improve it:

```javascript
// In index.hbs, update video tag:
<video
    preload="none"  // Don't preload anything
    loading="lazy"  // Browser-native lazy loading
    ...
```

**Expected Results:**
- Only loads video for users who actually see it
- Saves bandwidth for users who bounce quickly
- Reduces initial page load time

### Solution 4: Use Cloud Storage for Videos (LONG-TERM)

**Action:** Move videos to Google Cloud Storage bucket

**Benefits:**
- Dedicated storage service (optimized for large files)
- Can enable CDN easily
- Independent from Ghost container
- Cheaper storage costs

**Implementation:**
```bash
# Create bucket
gsutil mb gs://sigmablox-assets/

# Upload videos
gsutil cp -r ghost-cloudrun/ghost-data/themes/ease/assets/videos/* \
  gs://sigmablox-assets/videos/

# Make public
gsutil iam ch allUsers:objectViewer gs://sigmablox-assets

# Update theme to use GCS URLs
# In index.hbs:
<source src="https://storage.googleapis.com/sigmablox-assets/videos/sigmablox_social_web.webm" type="video/webm">
```

### Solution 5: Upgrade VM (IF NEEDED - Last Resort)

**Current:** e2-medium (2 vCPU, 4GB RAM)
**Upgrade to:** e2-standard-2 (2 vCPU, 8GB RAM)

**Cost Impact:** ~$24/month → ~$49/month

**When to consider:**
- After implementing video compression
- If Ghost still struggles with traffic
- If memory becomes the bottleneck

## Recommended Implementation Order

### Phase 1: Immediate Wins (Today)
1. ✅ **Compress videos** (150MB → 10MB) - 90% improvement
2. ✅ **Update video preload to "none"** - Better lazy loading
3. ✅ **Deploy compressed videos** - Quick deployment

**Effort:** 1-2 hours
**Impact:** 90% reduction in bandwidth, significant VM load reduction

### Phase 2: Infrastructure Improvements (This Week)
4. ⚠️  **Enable Cloud CDN** - Offload static asset serving
5. ⚠️  **Configure cache headers** - Improve browser caching

**Effort:** 2-3 hours
**Impact:** Further reduce VM load, improve global performance

### Phase 3: Long-term Optimization (If Needed)
6. ⚠️  **Migrate to Cloud Storage** - Move all large assets
7. ⚠️  **Consider VM upgrade** - Only if still needed

**Effort:** 4-6 hours
**Impact:** Best performance and scalability

## Monitoring After Changes

After implementing fixes, monitor:

```bash
# Check VM resource usage
gcloud compute ssh ghost-staging --zone=us-central1-a --command="
  echo '=== CPU Usage ==='
  top -bn1 | head -15
  echo ''
  echo '=== Memory Usage ==='
  free -h
  echo ''
  echo '=== Network Traffic ==='
  ifconfig | grep 'RX packets\\|TX packets'
"

# Check Ghost logs
gcloud compute ssh ghost-staging --zone=us-central1-a \
  --command="sudo docker logs ghost-staging --tail 100"

# Check response times
curl -w "\nTime: %{time_total}s\n" -o /dev/null -s https://www.sigmablox.com/
```

## Expected Results

After Phase 1 (video compression):
- ✅ 90% reduction in homepage bandwidth
- ✅ 3-5x faster page load times
- ✅ Significantly reduced VM CPU/network load
- ✅ Better mobile experience

After Phase 2 (CDN):
- ✅ 50-80% reduction in VM network traffic
- ✅ Faster global access
- ✅ Better handling of traffic spikes

## Next Steps

1. **Compress videos** using ffmpeg commands above
2. **Test locally** to ensure quality is acceptable
3. **Deploy** compressed videos to production
4. **Monitor** performance improvements
5. **Implement CDN** if additional optimization needed

## Questions to Answer

1. **What's the video content?**
   - If it's a promo/marketing video, 10-15MB is plenty
   - If it's detailed technical content, may need higher quality

2. **How many homepage visitors per day?**
   - Helps calculate bandwidth savings
   - Determines if CDN is worth it

3. **What's acceptable quality?**
   - CRF 28 is good quality for web
   - Can go to CRF 23 if higher quality needed (larger file)

4. **Are there other large assets being served?**
   - Check for other images/videos that could be optimized
   - Look for unused assets that can be removed
