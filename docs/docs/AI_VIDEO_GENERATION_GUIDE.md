# AI Video Generation Guide for Merge Combinator

## Overview

This guide provides detailed instructions for creating world-class AI-generated background videos for the Merge Combinator website. The videos should capture the Indo-Pacific warfighter mission with cinematic quality while maintaining a professional, defense-tech aesthetic.

---

## Video Specifications

### Technical Requirements

| Property | Value | Rationale |
|----------|-------|-----------|
| Resolution | 1920x1080 or 1280x720 | Will be blurred/overlaid, 720p sufficient |
| Duration | 8-12 seconds | Seamless loop length |
| Frame Rate | 24fps | Cinematic feel |
| Format | MP4 (H.264) | Universal browser support |
| File Size | 2-4MB per video | Fast loading |
| Aspect Ratio | 16:9 | Full-width sections |

### Visual Style Guidelines

- **Color Palette**: Desaturated, dark, moody
- **Motion**: Slow motion (0.5x-0.75x speed)
- **Lighting**: Golden hour, dawn/dusk, dramatic shadows
- **Grain**: Light film grain adds authenticity
- **Focus**: Slightly soft/atmospheric rather than razor sharp

---

## Best-of-Breed AI Video Tools

### Tier 1: Highest Quality

#### 1. Runway Gen-3 Alpha
**Best for**: Photorealistic military/defense footage
**Website**: https://runway.ml
**Pricing**: $15/month (Standard), $35/month (Pro)

**Strengths**:
- Best photorealism in the market
- Excellent motion coherence
- Good with vehicles, aircraft, naval vessels
- 10-second generations

**Limitations**:
- Can struggle with specific military equipment details
- Queue times during peak hours

**How to Use**:
1. Go to runway.ml → Create Account → Gen-3 Alpha
2. Select "Text to Video"
3. Use detailed prompts (see prompts below)
4. Set duration to 10 seconds
5. Generate 3-4 variations, pick best
6. Download in highest quality
7. Use Runway's "Extend" feature to create seamless loop

---

#### 2. Pika Labs 1.5
**Best for**: Stylized cinematic footage
**Website**: https://pika.art
**Pricing**: $8/month (Basic), $28/month (Standard)

**Strengths**:
- Excellent cinematic motion
- Good camera movement control
- Strong with atmospheric shots
- Fast generation times

**Limitations**:
- Less photorealistic than Runway
- 4-second base generations (must extend)

**How to Use**:
1. Go to pika.art → Sign up
2. Select aspect ratio 16:9
3. Enable "Cinematic" style modifier
4. Use camera motion keywords: "slow zoom", "drone shot", "tracking shot"
5. Generate, then use "Extend" to reach 8-12 seconds

---

#### 3. Kling AI 1.5
**Best for**: Complex motion and action sequences
**Website**: https://klingai.com
**Pricing**: Free tier available, Pro $10/month

**Strengths**:
- Excellent motion physics
- Good with vehicles in motion
- Long 10-second generations
- Consistent quality

**Limitations**:
- Interface in Chinese (use browser translate)
- Occasional queue delays

**How to Use**:
1. Access via klingai.com
2. Select "Text to Video"
3. Choose "Professional" mode for higher quality
4. Set to 10 seconds, 1080p
5. Enable "High Quality" option

---

#### 4. Luma Dream Machine
**Best for**: Atmospheric and environmental shots
**Website**: https://lumalabs.ai/dream-machine
**Pricing**: Free tier, $24/month (Standard)

**Strengths**:
- Beautiful lighting and atmosphere
- Good with landscapes and environments
- Smooth camera movements
- Fast generation

**Limitations**:
- Can be soft/dreamy (may need sharpening)
- 5-second base generations

---

### Tier 2: Specialized Tools

#### 5. Stable Video Diffusion (via ComfyUI)
**Best for**: Maximum control and customization
**Setup**: Local installation required
**Cost**: Free (requires GPU)

For advanced users who want frame-by-frame control. Requires technical setup but offers unlimited generations and fine-tuned control.

#### 6. Minimax (Hailuo AI)
**Best for**: Budget-friendly high quality
**Website**: https://hailuoai.video
**Pricing**: Free tier generous

Excellent free option with surprisingly good quality. Good fallback for bulk generation.

---

## Video Prompts by Section

### Hero Section: Carrier Flight Operations

**Primary Prompt (Runway Gen-3):**
```
Cinematic aerial shot of US Navy aircraft carrier in Pacific Ocean at golden hour, F/A-18 fighter jets launching from flight deck, deck crew in colorful jerseys directing operations, steam rising from catapult, calm dark blue waters stretching to horizon, dramatic clouds, slow motion, film grain, desaturated colors, professional military documentary style, 4K quality
```

**Alternative Prompt (Pika):**
```
Epic drone shot circling aircraft carrier at dawn, fighter jet launching from deck with afterburner glow, Pacific Ocean background, cinematic slow motion, dark moody atmosphere, Hollywood military film aesthetic, lens flare from rising sun
```

**Style Modifiers to Add:**
- `--style cinematic`
- `--motion slow`
- `--camera drone orbit`

---

### Mission Section: Tactical Operations Center

**Primary Prompt (Runway Gen-3):**
```
Interior shot of military command center, special operations team gathered around holographic tactical display, blue and amber screen glow illuminating faces, dark room with subtle equipment lights, personnel in tactical gear studying maps, slow deliberate movements, cinematic lighting, desaturated color grade, film grain, Tom Clancy film aesthetic
```

**Alternative Prompt (Kling):**
```
Dark military operations room, soldiers analyzing glowing tactical screens, holographic map projection, tense atmosphere, blue light on faces, slow motion hand gestures over display, professional military documentary, cinematic shallow depth of field
```

**Style Modifiers:**
- `--lighting dramatic low-key`
- `--color desaturated blue tint`
- `--mood tense professional`

---

### CTA Section: Deployment Operations

**Primary Prompt (Runway Gen-3):**
```
Military C-17 cargo aircraft flying over Pacific islands at sunset, dramatic orange and purple sky, island silhouettes below, seen from chase plane perspective, personnel visible through open rear ramp, clouds streaming past, cinematic slow motion, epic scale, Hans Zimmer film score mood, desaturated warm tones
```

**Alternative Prompt (Luma):**
```
Sunset aerial shot following military transport aircraft over tropical Pacific islands, golden hour lighting, dramatic cloudscape, silhouettes of paratroopers preparing at open door, dreamy atmospheric haze, cinematic drone following shot, slow motion
```

---

## Post-Processing Workflow

### Step 1: Loop Creation

Use one of these methods to create seamless loops:

**Method A: Runway Extend**
1. Generate 10-second video
2. Use "Extend" with same prompt
3. Trim to find natural loop point

**Method B: DaVinci Resolve (Free)**
1. Import video
2. Duplicate clip
3. Reverse second clip
4. Cross-dissolve at midpoint (creates ping-pong loop)
5. Export

**Method C: CapCut (Free)**
1. Import video
2. Use "Smooth Loop" effect
3. Adjust blend duration
4. Export

---

### Step 2: Color Grading

Apply consistent grade across all videos:

**DaVinci Resolve Settings:**
```
Lift: -0.05 (shadows darker)
Gamma: -0.03 (midtones slightly down)
Gain: -0.08 (highlights reduced)
Saturation: 0.6 (40% reduction)
Color Temp: -200K (cooler/bluer)
Contrast: +10
```

**Or use LUT**: "Cinematic Blue" or "Military Grade" free LUTs

---

### Step 3: Export Settings

**Optimal Export for Web:**
```
Codec: H.264
Resolution: 1920x1080 (or 1280x720)
Frame Rate: 24fps
Bitrate: 4-6 Mbps (VBR)
Audio: None (remove audio track)
Format: MP4
```

**Compression (if needed):**
Use HandBrake with:
- Preset: "Fast 720p30"
- Quality: RF 23-26
- Target: Under 4MB per video

---

## Quality Checklist

Before using a video, verify:

- [ ] Motion is smooth (no jitter or artifacts)
- [ ] No obvious AI artifacts (melting, morphing)
- [ ] Loop point is seamless
- [ ] Color grade is consistent with other videos
- [ ] File size is under 4MB
- [ ] Plays smoothly on mobile
- [ ] Content is appropriate (no identifiable faces/insignia)

---

## Prompt Engineering Tips

### Do's:
- Be specific about camera movement: "slow orbit", "tracking shot", "aerial dolly"
- Specify time of day: "golden hour", "blue hour", "dawn"
- Reference film styles: "Roger Deakins cinematography", "Top Gun aesthetic"
- Include atmosphere: "atmospheric haze", "lens flare", "film grain"
- Mention motion: "slow motion", "smooth movement", "steady shot"

### Don'ts:
- Don't request specific insignia or unit patches (AI struggles)
- Avoid "action" or "fast" (we need slow/ambient)
- Don't over-specify equipment models (leads to artifacts)
- Avoid text or readable displays (AI can't do text well)

---

## Recommended Generation Strategy

1. **Start with Runway Gen-3** for Hero video (most important)
2. **Use Pika** for atmospheric Mission section
3. **Try Kling** for the aircraft Deployment section
4. **Generate 3-4 versions** of each, pick best
5. **Post-process all** with same color grade for consistency
6. **Test on website** before finalizing

---

## Budget Estimate

| Tool | Plan | Cost | Videos |
|------|------|------|--------|
| Runway Gen-3 | Pro | $35/mo | ~100 generations |
| Pika | Standard | $28/mo | Unlimited |
| Kling | Pro | $10/mo | ~50 generations |
| **Total** | | **~$75** | More than enough |

For budget option: Kling free tier + Minimax free tier can produce good results at $0.

---

## File Naming Convention

```
hero-carrier-ops-v1.mp4
hero-carrier-ops-v2.mp4
hero-carrier-ops-final.mp4

mission-tactical-v1.mp4
mission-tactical-final.mp4

cta-deployment-v1.mp4
cta-deployment-final.mp4
```

---

## Resources

- **Runway**: https://runway.ml
- **Pika**: https://pika.art
- **Kling**: https://klingai.com
- **Luma**: https://lumalabs.ai/dream-machine
- **DaVinci Resolve** (free): https://www.blackmagicdesign.com/products/davinciresolve
- **HandBrake** (free): https://handbrake.fr
- **Free Military LUTs**: Search "cinematic military LUT free download"

---

*Document created for Merge Combinator video background implementation.*
