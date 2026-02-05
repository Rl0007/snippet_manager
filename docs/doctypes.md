# Doctypes

This document describes the doctypes in Snippet Manager.

## Tailwind Snippet

The main doctype for storing and previewing Tailwind CSS code.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | Data | Name of the snippet (required) |
| `category` | Link | Reference to Snippet Category |
| `snippet_type` | Select | Type classification |
| `tags` | Small Text | Comma-separated tags for search |
| `description` | Small Text | Description of the snippet |
| `html_code` | Code (HTML) | The Tailwind HTML code (required) |
| `custom_css` | Code (CSS) | Optional additional CSS |
| `preview_html` | HTML | Rendered preview area |

### Snippet Types

- **Component** - Small UI elements (buttons, badges, inputs)
- **Section** - Page sections (hero, features, testimonials)
- **Page** - Full page layouts
- **Layout** - Structural layouts (grids, containers)
- **Navigation** - Navbars, sidebars, breadcrumbs
- **Form** - Form elements and layouts
- **Card** - Card components
- **Button** - Button variations
- **Other** - Miscellaneous snippets

### Naming Rule

Auto-generated: `{title}-{####}` (e.g., "Primary Button-0001")

### Permissions

- System Manager: Full access (create, read, write, delete)

---

## Snippet Category

Categories for organizing snippets.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `category_name` | Data | Name of the category (required, unique) |
| `color` | Color | Color for visual identification |
| `description` | Small Text | Description of the category |

### Naming Rule

Uses `category_name` as the document name.

### Features

- **Quick Entry** - Simplified form for fast creation
- **Color Coding** - Visual organization in lists

### Permissions

- System Manager: Full access (create, read, write, delete)

---

## Relationships

```
Snippet Category (1) ──────< (many) Tailwind Snippet
```

- A category can have many snippets
- A snippet belongs to one category (optional)

---

## Extending the Doctypes

### Adding Custom Fields

You can add custom fields via:
1. **Customize Form** in Frappe desk
2. Custom app with fixtures

### Adding New Snippet Types

Edit the `snippet_type` field options in:
```
snippet_manager/doctype/tailwind_snippet/tailwind_snippet.json
```

Then run migration:
```bash
bench --site your-site migrate
```

### Custom Permissions

Add roles in the doctype JSON files or use **Role Permission Manager** in desk.
