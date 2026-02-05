# Snippet Manager

A powerful Frappe app for managing and previewing Tailwind CSS snippets. Store components, sections, pages, and layouts with live preview capabilities.

## Features

### Core
- **Live Preview** - Real-time preview updates as you type (300ms debounce)
- **Tailwind CSS v4** - Latest Tailwind loaded via CDN
- **Style Isolation** - iframe-based preview keeps Tailwind separate from Frappe

### Preview Tools
- **Responsive Testing** - Desktop, Tablet, Mobile viewport toggles
- **Background Modes** - Light, Dark, Checkered backgrounds
- **Zoom Controls** - 25% to 200% zoom
- **Full Screen Preview** - Persistent URLs that work on refresh

### Organization
- **Categories** - Color-coded categories for organization
- **Type Indicators** - Visual tags (Component, Page, Section, etc.)
- **Star/Favorites** - Mark important snippets
- **Tags** - Searchable comma-separated tags

### Productivity
- **Large Code Editor** - 400px HTML editor, 250px CSS editor
- **Copy HTML** - One-click copy
- **Copy Complete HTML** - Copy with Tailwind included
- **Download HTML** - Export as `.html` file
- **Duplicate Snippet** - Quick copy creation
- **Import/Export** - JSON-based backup and restore
- **Quick Create** - Dialog for fast snippet creation

## Documentation

See the [docs](./docs/) folder for detailed documentation:

- [Getting Started](./docs/getting-started.md) - Installation and first steps
- [Doctypes](./docs/doctypes.md) - Field reference
- [Features](./docs/features.md) - Complete feature documentation

## Installation

```bash
cd $PATH_TO_YOUR_BENCH
bench get-app $URL_OF_THIS_REPO --branch develop
bench install-app snippet_manager
```

After installation:

```bash
bench --site your-site migrate
bench --site your-site clear-cache
bench build --app snippet_manager
bench restart
```

## Quick Start

1. Navigate to **Snippet Manager** workspace or `/app/tailwind-snippet`
2. Create categories to organize your snippets
3. Add new Tailwind Snippets with your HTML code
4. Preview updates live as you type
5. Use viewport toggles to test responsiveness

## Doctypes

| Doctype | Description |
|---------|-------------|
| **Tailwind Snippet** | Store and preview Tailwind code |
| **Snippet Category** | Organize snippets by category |

## Preview Modes

| Mode | Description |
|------|-------------|
| Desktop | 100% width |
| Tablet | 768px width |
| Mobile | 375px width |

| Background | Use Case |
|------------|----------|
| Light | Default white |
| Dark | Test dark mode |
| Checkered | Check transparency |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Shift + N` | Quick create (list view) |

## JavaScript API

```javascript
// Copy to clipboard
snippet_manager.copy_snippet(html);

// Preview in new tab
snippet_manager.preview_snippet("Snippet-Name-0001");

// Export all snippets
snippet_manager.export_all();

// Import snippets
snippet_manager.import_snippets();
```

## Tech Stack

- **Frappe Framework** - Backend and frontend
- **Tailwind CSS v4** - Via jsdelivr CDN
- **Ace Editor** - Code editing
- **Iframe Isolation** - Clean previews

## Contributing

```bash
cd apps/snippet_manager
pre-commit install
```

Tools: ruff, eslint, prettier, pyupgrade

## License

MIT
