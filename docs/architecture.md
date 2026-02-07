# Architecture

A technical overview of the Snippet Manager application: how it is structured, how its components interact, and how the rendering pipeline works.

---

## Directory Structure

```
snippet_manager/
├── docs/                          # Documentation
├── snippet_manager/               # App root (Python package)
│   ├── hooks.py                   # Frappe hooks — registers assets
│   ├── modules.txt                # Module declarations
│   ├── patches.txt                # Data migration patches
│   ├── config/                    # Desk/workspace config
│   ├── public/                    # Static assets (bundled by Frappe)
│   │   ├── css/
│   │   │   └── snippet_manager.css   # Global custom styles
│   │   └── js/
│   │       └── snippet_manager.js    # Global JS utilities & API
│   ├── snippet_manager/           # Module: Snippet Manager
│   │   ├── doctype/
│   │   │   ├── snippet_category/  # Category doctype
│   │   │   │   ├── snippet_category.json
│   │   │   │   └── snippet_category.py
│   │   │   └── tailwind_snippet/  # Main snippet doctype
│   │   │       ├── tailwind_snippet.json      # Schema definition
│   │   │       ├── tailwind_snippet.py        # Server controller
│   │   │       ├── tailwind_snippet.js        # Form client script
│   │   │       ├── tailwind_snippet_list.js   # List view customization
│   │   │       └── test_tailwind_snippet.py   # Tests
│   │   └── workspace/
│   │       └── snippet_manager.json           # Desk workspace
│   ├── templates/                 # Jinja templates (unused)
│   └── www/                       # Public web pages
│       ├── snippet_preview.py     # Backend context for preview page
│       └── snippet_preview.html   # Full-page preview template
└── pyproject.toml                 # Package metadata
```

---

## Component Overview

The app has four main layers:

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                        │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │  List View    │  │  Form View   │  │  Full-Page Preview │ │
│  │  (list.js)   │  │  (form.js)   │  │  (www/)            │ │
│  └──────┬───────┘  └──────┬───────┘  └─────────┬──────────┘ │
├─────────┼──────────────────┼───────────────────┼────────────┤
│         │     Global JS & CSS Layer            │            │
│         │  ┌──────────────────────────────┐    │            │
│         └──┤ snippet_manager.js/.css      ├────┘            │
│            └──────────────┬───────────────┘                 │
├───────────────────────────┼─────────────────────────────────┤
│                    Iframe Rendering Layer                     │
│            ┌──────────────┴───────────────┐                 │
│            │  Tailwind CSS v4 Browser CDN  │                 │
│            │  + User HTML + Custom CSS     │                 │
│            └──────────────────────────────┘                 │
├─────────────────────────────────────────────────────────────┤
│                     Server Layer (Python)                     │
│  ┌──────────────────┐  ┌──────────────────────────────┐     │
│  │ tailwind_snippet  │  │ snippet_preview.py            │     │
│  │ .py (DocType)     │  │ (www page context + perms)    │     │
│  └──────────────────┘  └──────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## Hooks Registration

`hooks.py` is the app's entry point into the Frappe framework. It registers two global assets:

| Hook | File | Purpose |
|------|------|---------|
| `app_include_css` | `snippet_manager.css` | Styles for preview UI, list view indicators, dark mode |
| `app_include_js` | `snippet_manager.js` | Global `snippet_manager` namespace with utility functions |

These are injected into every Desk page, making the styles and API available app-wide.

---

## Server-Side Architecture

### DocType Controllers

**`tailwind_snippet.py`** — The server controller for the Tailwind Snippet doctype. Currently inherits all behavior from Frappe's base `Document` class with no custom overrides. All business logic (validation, permissions) is handled by the standard Frappe framework.

**`snippet_category.py`** — Similarly empty; relies on Frappe defaults.

### Web Page Backend

**`www/snippet_preview.py`** — Serves the `/snippet_preview` route. This is Frappe's convention: files in `www/` are automatically mapped to URLs.

The `get_context()` function:

1. Reads `?snippet=<name>` from the query string
2. Checks if the current user has `read` permission for the document
3. If permitted, loads the full document via `frappe.get_doc()` and passes it to the Jinja template
4. Disables Frappe's standard sidebar and breadcrumbs for a clean full-screen experience
5. Sets `no_cache = 1` to prevent stale previews

---

## Client-Side Architecture

### Global Utilities (`public/js/snippet_manager.js`)

Provides the `snippet_manager` namespace with reusable functions:

| Function | Purpose |
|----------|---------|
| `copy_snippet(html)` | Copy HTML to clipboard with alert |
| `preview_snippet(name)` | Open full-page preview in new tab |
| `generate_preview_html(html, css, opts)` | Build a complete HTML document string with Tailwind CDN |
| `download_snippet(name, html, css)` | Download snippet as `.html` file |
| `quick_create()` | Open a dialog to create a snippet without leaving the page |
| `search(query, callback)` | Search snippets via `frappe.client.get_list` |
| `export_all()` | Export all snippets as a JSON file |
| `import_snippets()` | Import snippets from a JSON file |

Also registers:
- `Ctrl/Cmd + Shift + N` keyboard shortcut for quick create on the list view
- Dynamic "Export All" / "Import" buttons on the list page header (via `frappe.router.on("change")`)

### Form Client Script (`tailwind_snippet.js`)

This is the most complex client-side file. It controls the in-form live preview experience.

**Key event handlers:**

| Event | Action |
|-------|--------|
| `setup` | Initialize preview state (viewport, background, zoom, height) |
| `refresh` | Render preview, add custom buttons, setup code editor heights |
| `onload` | Render preview if HTML code already exists |
| `html_code` / `custom_css` | Trigger debounced preview update (300ms) |

**Core functions:**

| Function | Purpose |
|----------|---------|
| `get_preview_html(frm)` | Builds the full HTML document for the iframe (Tailwind CDN + user HTML + CSS + viewport-height fixes) |
| `update_preview_content(frm)` | Writes the HTML to the iframe via `doc.write()` and triggers auto-resize |
| `auto_resize_iframe(frm)` | Measures iframe content height and resizes the iframe to fit |
| `render_preview(frm)` | Builds the entire preview UI (toolbar, resizable container, handles, iframe) and attaches event listeners |

**Custom buttons added to the form:**

Copy HTML, Copy Complete HTML, Full Screen Preview, Download HTML, Duplicate, Star/Unstar

### List View Script (`tailwind_snippet_list.js`)

Enhances the standard Frappe list view:

- Color-coded type indicators (Component = blue, Section = green, Page = purple, etc.)
- Star prefix on favorite snippet titles
- "Preview" button on each row
- Page header buttons: New Category, Starred Only, Filter by Type dropdown

### Global Styles (`public/css/snippet_manager.css`)

Custom CSS for:
- Preview toolbar and iframe container
- Resizable handles with hover/active states
- Width indicator tooltip during drag resize
- List view: type indicator pills, favorite star styling
- Dark mode overrides (`[data-theme="dark"]`)
- Responsive adjustments for mobile (`@media max-width: 768px`)

---

## Iframe Rendering Pipeline

The core of the app is how HTML snippets are rendered inside an iframe for style isolation. This pipeline is used by both the in-form preview and the full-page preview.

### Step-by-Step Flow

```
User types HTML code
        │
        ▼
Debounce timer (300ms)
        │
        ▼
get_preview_html() builds a complete HTML document:
  ┌─────────────────────────────────────────┐
  │ <!DOCTYPE html>                          │
  │ <html>                                   │
  │ <head>                                   │
  │   <script src="@tailwindcss/browser@4">  │  ← Tailwind CSS v4 JIT
  │   <style>                                │
  │     body { min-height: auto; ... }       │  ← Base styles
  │     ${custom_css}                        │  ← User's custom CSS
  │   </style>                               │
  │ </head>                                  │
  │ <body>                                   │
  │   ${html_code}                           │  ← User's snippet HTML
  │   <style>                                │
  │     .min-h-screen { ... !important }     │  ← Viewport-height fixes
  │     .h-screen { ... !important }         │
  │   </style>                               │
  │ </body>                                  │
  │ </html>                                  │
  └─────────────────────────────────────────┘
        │
        ▼
iframe.contentDocument.write(html)
        │
        ▼
iframe.onload fires
        │
        ▼
auto_resize_iframe() measures content height
        │
        ├── Immediate measurement
        ├── 500ms delayed re-measurement
        └── 1500ms delayed re-measurement
                (accounts for async Tailwind compilation)
        │
        ▼
iframe.style.height = contentHeight + 40px
```

### Why an Iframe?

- **Style isolation**: Tailwind classes do not conflict with Frappe desk CSS
- **Accurate preview**: The rendered output matches what a standalone HTML file would look like
- **Security**: Content is sandboxed within the iframe

### Viewport-Height Fix

When an iframe is auto-sized to match its content height, CSS viewport units (`100vh`) resolve to the iframe's own height instead of the user's screen height. This creates a circular dependency:

```
iframe height set to content height
  → 100vh = iframe height
    → elements using min-h-screen expand
      → content height increases
        → iframe grows again
          → (loop)
```

**Solution**: The generated HTML includes a `<style>` block at the end of `<body>` that overrides Tailwind's viewport-height utilities (`.min-h-screen`, `.h-screen`, `.max-h-screen`) with fixed pixel values derived from the parent window's `window.innerHeight`. The body's own `min-height` is set to `auto` instead of `100vh`.

### Tailwind Async Compilation

The `@tailwindcss/browser@4` CDN script compiles Tailwind classes at runtime via a JIT compiler in the browser. This happens asynchronously after the iframe loads. To ensure the iframe height is correct after Tailwind finishes generating styles, the auto-resize function runs three times:

1. Immediately on `iframe.onload`
2. After 500ms delay
3. After 1500ms delay

---

## Full-Page Preview Architecture

The `/snippet_preview` page is a standalone HTML page outside of Frappe Desk.

### Request Flow

```
Browser navigates to /snippet_preview?snippet=My-Snippet-0001
        │
        ▼
Frappe routes to www/snippet_preview.py
        │
        ▼
get_context() checks permissions and loads document
        │
        ▼
Passes snippet object to snippet_preview.html (Jinja)
        │
        ▼
Template renders:
  - Fixed toolbar (viewport toggles, background, copy, edit)
  - Resizable iframe container with drag handles
  - JavaScript injects snippet into iframe using same pipeline
```

### Features

- Viewport presets (Desktop / Tablet / Mobile) + manual pixel or percentage input
- Drag-to-resize with pointer capture for reliable cross-device behavior
- Light / Dark / Checkered background switching
- Copy HTML and Edit buttons in toolbar
- Same iframe rendering pipeline as the in-form preview

---

## Data Flow Diagram

```
                    ┌─────────────┐
                    │   Browser    │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
     ┌────────────┐ ┌───────────┐ ┌──────────────┐
     │  List View  │ │ Form View │ │ /snippet_    │
     │             │ │           │ │  preview     │
     └─────┬──────┘ └─────┬─────┘ └──────┬───────┘
           │               │              │
           │        ┌──────┴──────┐       │
           │        │ iframe with │       │
           │        │ Tailwind    │◄──────┘
           │        │ CDN + HTML  │
           │        └─────────────┘
           │
     ┌─────┴──────┐
     │ Export/     │
     │ Import JSON │
     └────────────┘

Server Side:
     ┌────────────┐     ┌───────────────────────┐
     │ Frappe ORM  │────▶│ MariaDB               │
     │ (DocType)   │     │  - tabTailwind Snippet │
     │             │     │  - tabSnippet Category │
     └────────────┘     └───────────────────────┘
```

---

## Key Design Decisions

### 1. CDN-Based Tailwind (No Build Step)

The app uses `@tailwindcss/browser@4` which compiles Tailwind classes at runtime in the browser. This means:
- No Node.js or build pipeline required
- Works instantly on any Frappe installation
- Requires internet connectivity for previews
- Preview is for development purposes, not production

### 2. Auto-Expanding Iframe (Not Scrolling)

The iframe auto-resizes to show all content without internal scrollbars. This gives a complete view of the snippet but requires the viewport-height fix described above.

### 3. Client-Heavy Architecture

Almost all rendering logic lives on the client side. The server only stores and retrieves documents. This keeps the app simple and avoids server-side rendering complexity.

### 4. Debounced Live Preview

The preview updates live as the user types, but with a 300ms debounce to avoid excessive re-renders. This balances responsiveness with performance.

### 5. Frappe Convention Compliance

- DocType naming, permissions, and form layout follow standard Frappe patterns
- The `www/` directory convention is used for the public preview page
- `hooks.py` asset registration follows the standard `app_include_css`/`app_include_js` pattern
- List view customization uses the standard `{doctype}_list.js` convention
