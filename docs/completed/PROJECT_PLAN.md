# 🎯 BUILDING MERGE COMBINATOR IN FRAMER FROM SCRATCH

## Your Perfect Free Starting Template: **"The Bureau" by Pixsellz**

**Why this is ideal for YC + Palantir aesthetic:**
- ✅ 100% FREE
- ✅ Minimalist black & white (perfect base for your color system)
- ✅ Clean, sharp, professional
- ✅ Modern Framer components
- ✅ 4 core pages (Home, About, Blog, 404)
- ✅ No premium dependencies
- ✅ Accessibility optimized
- ✅ Built-in SEO & analytics

---

## 📋 STEP-BY-STEP BUILD GUIDE

### **PHASE 1: GET THE TEMPLATE (5 minutes)**

**Step 1.1: Access The Bureau Template**
1. Go to Framer.com and sign in (or create free account)
2. Navigate to: https://www.framer.com/templates/the-bureau/
3. Click **"Get for Free"** or **"Remix"**
4. The template will duplicate to your Framer workspace

**Step 1.2: Initial Setup**
1. In Framer, click on your new "The Bureau" project
2. Rename it to **"Merge Combinator"**
3. Take 2 minutes to explore the existing pages:
   - Home
   - About
   - Blog
   - 404

---

### **PHASE 2: CONFIGURE YOUR DESIGN SYSTEM (15 minutes)**

**Step 2.1: Set Up Color Variables**

1. **In Framer, click the Paint Bucket icon (top left) → "Colors"**
2. **Delete all existing colors and create your Merge palette:**

   Click **"+ New Color"** for each:
   
   - **Near Black**: `#0B0E11` (name it "Near Black")
   - **Charcoal Slate**: `#1C232B` (name it "Charcoal")
   - **Slate Gray**: `#2C3036` (name it "Slate")
   - **Off-White**: `#F2F5F7` (name it "Off White")
   - **White**: `#FFFFFF` (name it "White")
   - **Signal Blue**: `#2A7FDB` (name it "Signal Blue")
   - **Operator Green**: `#5DA06F` (name it "Operator Green")

**Step 2.2: Set Up Typography**

1. **Click the "Aa" icon (Typography panel)**
2. **Create text styles:**

   Click **"+ New Text Style"** for each:

   - **H1**: 
     - Font: Helvetica Neue (or Inter as fallback)
     - Size: 64px
     - Weight: Bold (700)
     - Line height: 1.1
     - Color: Near Black or White (depending on section)
   
   - **H2**:
     - Size: 48px
     - Weight: Bold
     - Line height: 1.2
   
   - **H3**:
     - Size: 32px
     - Weight: Semibold (600)
     - Line height: 1.3
   
   - **Body Large**:
     - Size: 20px
     - Weight: Regular (400)
     - Line height: 1.6
   
   - **Body**:
     - Size: 18px
     - Weight: Regular
     - Line height: 1.6
   
   - **Mono Label**:
     - Font: Space Mono (or Courier)
     - Size: 12px
     - Weight: Regular
     - Transform: Uppercase
     - Letter spacing: 4%

**Step 2.3: Set Global Background**

1. Select the **Home page canvas** (click outside all frames)
2. In the right panel, set **Fill → Near Black (#0B0E11)**

---

### **PHASE 3: BUILD SECTION 1 - HERO (30 minutes)**

**Step 3.1: Clear the Existing Hero**
1. On the Home page, select the existing hero section
2. Delete it (or keep for reference in a hidden layer)

**Step 3.2: Create Hero Frame**
1. Press **F** (creates a Frame)
2. Set dimensions:
   - Width: Fill (1fr)
   - Height: 100vh (viewport height)
   - Background: Near Black (#0B0E11)
3. Name it "Hero Section"

**Step 3.3: Add Grid Layout**
1. With Hero Section selected, click **Layout** in right panel
2. Choose **Grid**
3. Set: **2 columns, 1 row**
4. Gap: 48px
5. Padding: 80px (all sides)

**Step 3.4: Left Column - Text Content**
1. **Add a Frame** inside left column
2. Set layout to **Stack (Vertical)**
3. Gap: 32px
4. Alignment: Left, Center Vertically

5. **Add H1 Text:**
   - Press **T** (text tool)
   - Type: "Build What Warfighters Need."
   - Apply your H1 text style
   - Color: White (#FFFFFF)

6. **Add Subheading:**
   - Add another text block
   - Type your 2-line subhead (from your copy doc)
   - Apply Body Large style
   - Color: Off-White (#F2F5F7)
   - Max width: 600px

7. **Add CTA Buttons:**
   - Create a Frame for button group
   - Layout: **Stack (Horizontal)**
   - Gap: 16px
   
   **Primary Button:**
   - Press **F** for frame
   - Size: Auto width, 56px height
   - Padding: 24px horizontal, 16px vertical
   - Background: Signal Blue (#2A7FDB)
   - Border radius: 6px
   - Add text: "Build With Us"
   - Text: White, 16px, Semibold
   
   **Secondary Button:**
   - Duplicate primary button
   - Background: Transparent
   - Border: 1px solid Slate Gray (#2C3036)
   - Text: Off-White

   **Add hover states:**
   - Select each button → Effects panel → Add **Hover** variant
   - Primary: Slightly darker blue (#2270C2)
   - Secondary: Background changes to rgba(42, 127, 219, 0.1)

**Step 3.5: Right Column - Abstract Visual**

*Option A: Dot Grid Pattern*
1. Create a Frame in right column
2. Size: Fill container
3. Add subtle dot grid using:
   - Multiple small circles (4px diameter)
   - Arranged in grid pattern
   - Opacity: 3-5%
   - Color: White

*Option B: Use Framer's built-in effects*
1. Frame → Effects → add subtle gradient
2. Or use noise texture at low opacity

**Pro tip:** Keep this minimal. The visual should be atmospheric, not distracting.

---

### **PHASE 4: BUILD SECTION 2 - WHAT MERGE DOES (45 minutes)**

**Step 4.1: Create Section Frame**
1. Below Hero, press **F** for new frame
2. Width: Fill (1fr)
3. Height: Auto
4. Background: Off-White (#F2F5F7)
5. Padding: 120px top/bottom, 80px sides

**Step 4.2: Add Section Header**
1. Add text: "How Merge Works"
2. Style: H2
3. Color: Near Black
4. Alignment: Center
5. Margin bottom: 80px

**Step 4.3: Create Program Cards (3-up layout)**

1. **Create Cards Container:**
   - Frame with **Grid layout**
   - 3 columns, 1 row
   - Gap: 32px
   - Width: Max 1200px, center aligned

2. **Build First Card (Discover):**
   - Frame: 
     - Auto height
     - Padding: 32px
     - Background: White (#FFFFFF)
     - Border: 1px Slate Gray
     - Border radius: 6px
     - Shadow: 0px 2px 6px rgba(0,0,0,0.05)
   
   - **Add content (Stack vertical, gap 16px):**
     
     a. **Mono Label:**
        - Text: "DISCOVER"
        - Style: Mono Label
        - Color: Signal Blue
     
     b. **Card Title (H3):**
        - Your title text
        - Color: Near Black
     
     c. **Description:**
        - 2-3 lines of copy
        - Body style
        - Color: Charcoal
     
     d. **Small CTA:**
        - Link or button
        - Text: "Learn More →"
        - Color: Signal Blue
        - Size: 14px

3. **Duplicate Card Twice:**
   - Select first card
   - Cmd/Ctrl + D to duplicate
   - Edit content for "BUILD" and "DEPLOY"
   - Change mono labels accordingly

**Step 4.4: Add Pipeline Diagram Below Cards**

1. **Create diagram frame:**
   - Width: 800px, center aligned
   - Margin top: 80px

2. **Build the line:**
   - Draw a line (L key) horizontally
   - Width: 600px
   - Stroke: 2px, Slate Gray
   - Position: centered

3. **Add 3 nodes:**
   - Create circles (O key)
   - Size: 12px diameter
   - Fill: Signal Blue
   - Position: at start, middle, end of line
   
4. **Add node labels:**
   - Below each node
   - Text: "Discover" / "Build" / "Deploy"
   - Style: Mono Label
   - Color: Charcoal

---

### **PHASE 5: BUILD SECTION 3 - WHY MERGE EXISTS (30 minutes)**

**Step 5.1: Create Dark Section**
1. New Frame below Section 2
2. Background: Near Black (#0B0E11)
3. Padding: 120px vertical, 80px horizontal

**Step 5.2: Two-Column Layout**
1. Layout: Grid (2 columns)
2. Gap: 80px

**Left: Mission Text**
- H2: "Why Merge Exists"
- Color: White
- Body text (3-4 paragraphs)
- Color: Off-White
- Max width: 500px

**Right: Technical Visual**
- Simple line diagram or grid
- Palantir-style aesthetic
- Minimal, clean
- White lines at 10% opacity

---

### **PHASE 6: BUILD SECTION 4 - ECOSYSTEM (Deep Cards) (30 minutes)**

**Step 6.1: Section Setup**
1. Background: Off-White
2. Padding: 120px vertical

**Step 6.2: Create 3 Large Cards**
1. Stack them vertically
2. Gap: 48px
3. Each card:
   - Max width: 1000px, centered
   - Padding: 48px
   - Two-column grid inside
   - Left: Icon + Title + Description
   - Right: Key details or visual

**Cards:**
- The Combine
- Merge Studio
- Defense Builders

---

### **PHASE 7: REMAINING SECTIONS (Streamlined approach)**

I'll give you the quick structure for each:

**Section 5: Social Proof**
- Light section (Off-White)
- Logo grid (4 columns)
- Logos in monochrome/grayscale
- Gap: 48px

**Section 6: Testimonials**
- Dark section (Near Black)
- 3-column layout
- Quote + attribution per card
- Large quote text (26-30px)
- Mono attribution

**Section 7: Metrics**
- Light section
- 4-column grid
- Large number (H1 size) + mono label below
- Numbers: 80+, 150+, 20+, Multiple

**Section 8: How to Engage**
- 3 audience cards
- Similar to program cards
- Segments: Founders, Government, Industry

**Section 9: About Merge**
- Two-column profile
- Left: Text about Merge
- Right: Team photo or abstract visual

**Section 10: Final CTA**
- Full-width strip
- Signal Blue background
- Strong H2 + CTA button
- Centered content

---

### **PHASE 8: CREATE ADDITIONAL PAGES (20 minutes each)**

**Step 8.1: About Page**
1. Duplicate Home page structure
2. Remove unnecessary sections
3. Add:
   - Expanded mission content
   - Team bios (grid layout)
   - Timeline or milestones

**Step 8.2: Programs Pages**

Create separate pages:
- /sigmablox
- /merge-studio
- /defense-builders

Each follows similar structure:
- Hero (program-specific)
- What it does
- How it works
- CTA to apply/learn more

**Step 8.3: Contact Page**
- Simple centered form
- Fields: Name, Email, Organization, Message
- Use Framer's built-in form component
- Submit button: Signal Blue

---

### **PHASE 9: ADD NAVIGATION (15 minutes)**

**Step 9.1: Create Nav Component**
1. At top of Home page, create frame
2. Width: Fill (1fr), Height: 80px
3. Make it **sticky** (Position → Sticky → Top)
4. Background: Near Black with 80% opacity (for glass effect)
5. Backdrop blur: 10px

**Step 9.2: Nav Content**
1. Layout: Horizontal stack
2. Left: Merge logo/wordmark
3. Center: Nav links
   - Home
   - Ecosystem (dropdown for programs)
   - About
   - Contact
4. Right: "Build With Us" button (Signal Blue)

**Step 9.3: Make it a Component**
1. Select entire nav frame
2. Right-click → "Create Component"
3. Name it "Navigation"
4. Now you can reuse it on all pages

---

### **PHASE 10: RESPONSIVE DESIGN (30 minutes)**

**Step 10.1: Set Breakpoints**
Framer has visual breakpoints:
- Desktop (default)
- Tablet (768px)
- Mobile (480px)

**Step 10.2: Adjust for Tablet**
1. Click tablet icon in top right
2. Modify layouts:
   - 2-column grids → 1 column
   - Reduce padding: 60px → 40px
   - Font sizes: H1 → 48px

**Step 10.3: Adjust for Mobile**
1. Click mobile icon
2. Further simplifications:
   - All grids → single column
   - Padding: 32px
   - H1: 36-40px
   - Stack navigation (hamburger menu)

---

### **PHASE 11: ADD BACKGROUND PATTERNS (Optional - 30 minutes)**

**Create reusable pattern components:**

**Dot Grid Pattern:**
1. Create small frame (200x200px)
2. Add dots in grid
3. Set as repeating background
4. Low opacity (2-3%)

**Diagonal Lines:**
1. Draw diagonal lines with pen tool
2. Group them
3. Use as decorative element
4. Operator-style cutlines

**Contour Lines:**
1. Use SVG of topographic lines
2. Import as background
3. Very subtle, low opacity

---

### **PHASE 12: CONNECT TO GHOST CMS (20 minutes)**

**For Defense Builders blog integration:**

**Step 12.1: Set Up External Links**
1. On Defense Builders page
2. Add button: "Visit Platform"
3. Link → External URL → your Ghost site URL

**Step 12.2: Embed Ghost Content (Optional)**
1. Use Framer's **Embed** component
2. Paste Ghost RSS feed or embed code
3. Style to match your design

**Step 12.3: Create Blog Preview Section**
1. On home page, add "Latest from Defense Builders"
2. Manually link to 3 recent posts (or use Framer CMS)
3. Style as cards matching your design

---

### **PHASE 13: POLISH & OPTIMIZE (30 minutes)**

**Step 13.1: Add Micro-Interactions**
1. Button hover states (already done)
2. Card lift on hover:
   - Select card → Hover variant
   - Transform: translateY(-4px)
   - Shadow: increase

**Step 13.2: SEO Setup**
1. For each page, click ⚙️ (page settings)
2. Add:
   - Page title
   - Meta description
   - Open Graph image

**Step 13.3: Performance Check**
1. Preview site (Cmd/Ctrl + P)
2. Test all interactions
3. Check mobile view
4. Test all links

---

### **PHASE 14: PUBLISH (10 minutes)**

**Step 14.1: Domain Setup**
1. Click **Publish** (top right)
2. Options:
   - Use free Framer subdomain: mergecombinator.framer.website
   - Connect custom domain: mergecombinator.com

**Step 14.2: Go Live**
1. Review checklist
2. Click **"Publish to Web"**
3. Your site is live! 🚀

---

## 📊 TIME ESTIMATE SUMMARY

| Phase | Task | Time |
|-------|------|------|
| 1 | Get template | 5 min |
| 2 | Design system setup | 15 min |
| 3 | Hero section | 30 min |
| 4 | What Merge Does | 45 min |
| 5 | Why Merge | 30 min |
| 6 | Ecosystem | 30 min |
| 7 | Remaining sections | 2 hours |
| 8 | Additional pages | 1 hour |
| 9 | Navigation | 15 min |
| 10 | Responsive design | 30 min |
| 11 | Background patterns | 30 min |
| 12 | Ghost CMS connect | 20 min |
| 13 | Polish | 30 min |
| 14 | Publish | 10 min |
| **TOTAL** | **Full site** | **6-8 hours** |

