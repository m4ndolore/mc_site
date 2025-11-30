# Component Inspector Plugin - Usage Guide

## What This Plugin Does

The **Component Inspector** plugin allows you to extract HTML and CSS from any element in your Framer project. This is perfect for integrating Framer-designed components into your custom website.

## Installation & Setup

### 1. Start the Development Server

```bash
cd merge_template
npm run dev
```

This will start the plugin in development mode.

### 2. Load the Plugin in Framer

1. Open your Framer project (https://important-strategists-917012.framer.app)
2. Go to **Plugins** menu
3. Click **"Development"** → **"Connect to localhost"**
4. The Component Inspector should appear on the right side

## How to Use

### Extract Components

1. **Select a layer** in your Framer canvas (like the navbar, a button, or any component)
2. The plugin will show the layer name in a badge
3. Click **"Extract Component"**
4. View the extracted code in three tabs:
   - **HTML** - Generated HTML markup
   - **CSS** - Generated CSS styles
   - **Info** - Raw component properties (size, position, colors, etc.)

### Copy Code

- **Copy HTML** - Click "Copy HTML" to copy just the HTML
- **Copy CSS** - Click "Copy CSS" to copy just the CSS
- **Copy Both** - Click "Copy Both" to copy both HTML and CSS together

### Best Workflow for Navbar

1. Select the entire navbar frame in Framer
2. Click "Extract Component"
3. Click "Copy Both"
4. Paste into your custom `index.html` and `styles.css` files
5. Refine and adjust as needed

## Tips

- **Work with nested components**: The plugin works best with Frame containers
- **Text elements**: Text content will be extracted if available
- **Check the Info tab**: See exact dimensions, colors, and properties
- **Iterative approach**: Extract individual components and combine them

## Building for Production

When ready to share or install permanently:

```bash
npm run pack
```

This creates a `.framer-plugin` file you can install in Framer.

## Next Steps

After extracting components from Framer:

1. Paste the HTML into `/index.html`
2. Paste the CSS into `/styles.css`
3. Adjust spacing, responsive breakpoints, and interactions
4. Test across devices
5. Deploy!

---

**Pro Tip**: Start with the navbar, then move to other key components like hero sections, cards, and CTAs.
