# Features

Detailed documentation of Snippet Manager features.

## Live Preview

### How It Works

The preview uses an **iframe** to render your Tailwind HTML in isolation:

1. Your HTML code is wrapped in a complete HTML document
2. Tailwind CSS v4 is loaded via CDN (`@tailwindcss/browser@4`)
3. The iframe renders the content independently from Frappe's styles
4. **Preview updates live as you type** (300ms debounce)

### Why Iframe?

- **Style Isolation** - Tailwind classes don't conflict with Frappe desk styles
- **Accurate Preview** - See exactly how your code will look
- **Safe Rendering** - Content is sandboxed

### Auto-Resize

The iframe automatically adjusts its height based on content, with a minimum height of 500px.

---

## Responsive Testing

Toggle between viewport sizes to test your designs:

| Viewport | Width | Use Case |
|----------|-------|----------|
| Desktop | 100% | Default full-width view |
| Tablet | 768px | Test `md:` breakpoint |
| Mobile | 375px | Test `sm:` breakpoint |

### Usage

Click the viewport buttons in the toolbar above the preview. The preview container smoothly animates to the selected width.

---

## Background Modes

Test your components against different backgrounds:

| Mode | Description |
|------|-------------|
| **Light** | White background (default) |
| **Dark** | Dark background (#1a1a2e) with light text |
| **Checkered** | Transparency indicator pattern |

Great for testing:
- Components with transparency
- Dark mode variants
- Image overlays

---

## Zoom Controls

- **Zoom In/Out** - Adjust preview zoom (25% to 200%)
- **Reset** - Return to 100% zoom
- Useful for previewing small components or fitting large pages

---

## Code Editor

### HTML Code Field

- Syntax highlighting for HTML
- Auto-indentation
- Line numbers
- **400px minimum height** for comfortable editing
- 13px font size for readability

### Custom CSS Field

- **250px minimum height**
- Add CSS that works alongside Tailwind:

```css
/* Custom animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fade {
  animation: fadeIn 0.3s ease-in;
}
```

---

## Quick Actions

### Actions Menu

Access from the **Actions** dropdown in the form:

| Action | Description |
|--------|-------------|
| **Copy HTML** | Copy snippet code to clipboard |
| **Copy Complete HTML** | Copy full HTML document with Tailwind included |
| **Full Screen Preview** | Open in new tab (persists on refresh) |
| **Download HTML** | Download as `.html` file |
| **Duplicate** | Create a copy of the snippet |
| **Star/Unstar** | Mark as favorite |

### Toolbar Actions

| Button | Description |
|--------|-------------|
| **Refresh** | Manually refresh the preview |
| **Expand** | Toggle preview height (500px ↔ 800px) |

---

## Full Screen Preview

The full-screen preview opens in a new browser tab at `/snippet_preview/{name}`.

Features:
- **Persists on refresh** - Bookmark and share preview URLs
- **Responsive toggles** - Test viewports in full screen
- **Background modes** - Light/Dark/Checkered
- **Copy button** - Copy HTML directly from preview
- **Edit button** - Jump back to edit the snippet

---

## Star/Favorite System

Mark important snippets as favorites:

1. Click **Star** in the Actions menu
2. Starred snippets show ★ in list view
3. Filter by starred items using the **Starred Only** button

---

## Categories

### Color Coding

Each category has an optional color for visual organization.

### Suggested Organization

```
UI Components/
  ├── Buttons
  ├── Badges
  └── Avatars

Cards/
  ├── Product Cards
  └── Profile Cards

Navigation/
  ├── Navbars
  └── Sidebars

Forms/
  ├── Inputs
  └── Login Forms

Sections/
  ├── Hero
  └── Features

Pages/
  ├── Landing Pages
  └── Dashboard
```

---

## Type Indicators

Snippets are tagged with types, shown as colored indicators in list view:

| Type | Color |
|------|-------|
| Component | Blue |
| Section | Green |
| Page | Purple |
| Layout | Orange |
| Navigation | Cyan |
| Form | Yellow |
| Card | Pink |
| Button | Red |
| Other | Gray |

---

## Import/Export

### Export All Snippets

1. Go to Tailwind Snippet list view
2. Click **Data → Export All**
3. Downloads JSON file with all snippets

### Import Snippets

1. Click **Data → Import**
2. Select a JSON file
3. Confirm import
4. New snippets are created (existing ones not affected)

### JSON Format

```json
[
  {
    "title": "Primary Button",
    "category": "Buttons",
    "snippet_type": "Button",
    "tags": "primary, cta",
    "html_code": "<button class=\"...\">Click</button>",
    "custom_css": ""
  }
]
```

---

## List View Features

### Quick Filters

- **Starred Only** - Show only favorited snippets
- **Filter by Type** - Quick filters for each snippet type

### Preview Button

Each list row has a **Preview** button that opens the full-screen preview.

### Title Formatting

Starred snippets show ★ before the title.

---

## Keyboard Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl/Cmd + Shift + N` | Quick create snippet | List view |

---

## JavaScript API

Global `snippet_manager` object provides utilities:

```javascript
// Copy HTML to clipboard
snippet_manager.copy_snippet(html_code);

// Open preview
snippet_manager.preview_snippet("Snippet-Name-0001");

// Generate complete HTML
snippet_manager.generate_preview_html(html, css, { background: "dark" });

// Download as file
snippet_manager.download_snippet(name, html, css);

// Quick create dialog
snippet_manager.quick_create();

// Search snippets
snippet_manager.search("button", function(results) {
  console.log(results);
});

// Export all
snippet_manager.export_all();

// Import from file
snippet_manager.import_snippets();
```

---

## Tailwind Version

The app uses **Tailwind CSS v4** via the official browser CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
```

### Notes

- Requires internet connectivity for preview
- Some Tailwind v3 classes may differ in v4
- CDN is for development/preview only
