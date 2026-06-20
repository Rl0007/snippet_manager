# Doctypes

This document describes the doctypes in Snippet Manager.

The app has two parallel domains:

1. **Tailwind Snippet** — store and preview Tailwind HTML/CSS code (`Tailwind Snippet`, `Snippet Category`).
2. **Prompt Manager** — store, version, and track usage of LLM prompts (`Prompt`, `Prompt Category`, `Project`, `Prompt Version`, `Prompt Run`). See [`prompts.md`](./prompts.md) for the workflow guide.

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

## Prompt

Stores a single LLM prompt with markdown content, project/category links, and an attached version + usage history.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `type` | Small Text | Short description / one-liner about what the prompt is for |
| `project` | Link → Project | The project this prompt belongs to (filterable) |
| `category` | Link → Prompt Category | Cross-cutting tag — orthogonal to project |
| `prompt` | Markdown Editor | The current/active prompt body. **Has `ignore_xss_filter: 1`** — see "HTML sanitization gotcha" below |
| `version_history` | HTML | Form-only widget; renders previous `Prompt Version` rows as collapsible cards |
| `runs` | HTML | Form-only widget; renders attached `Prompt Run` rows with Copy / Duplicate / Open / Show |
| `prompt_2` | Long Text | **Deprecated, hidden, read-only.** Kept on disk so legacy paste data is not lost. Migrated content is also snapshotted into a `Prompt Version` row labelled "Migrated from legacy prompt_2 field" |

### Naming Rule

Set by user (`autoname: prompt`). Choose a stable, short title — Prompt Versions and Prompt Runs link by name.

### Controller hooks

`prompt.py` defines `before_save → _snapshot_previous_version`:

- Runs only on update (skips `is_new()`).
- Compares `self.prompt` against `get_doc_before_save().prompt`.
- If the old value is non-empty and differs from the new value, inserts a `Prompt Version` row holding the **old** content. The current `prompt` field is always the live/latest value; history rows are previous values only.

### HTML sanitization gotcha (why `ignore_xss_filter` is set)

Frappe's `frappe/model/base_document.py:1397` runs `sanitize_html()` on every string field whose value contains `<` or `>`, **unless** the fieldtype is `Code` / `Attach` / `Attach Image` / `Barcode`, or the docfield has `ignore_xss_filter = 1`. `Markdown Editor` is **not** in the default exemption list.

Without the flag, prompts containing placeholder syntax like `<route>`, `<active>`, `<path>`, `<page>` get silently truncated mid-paste. The bleach HTML5 parser sees these as unknown HTML tags, gets confused by the unclosed-tag cascade, and drops everything from the first malformed tag onward — leaving partial text in the DB.

The fix: `ignore_xss_filter: 1` on the `prompt` and `Prompt Version.content` and `Prompt Run.body` fields. Safe here because all three are user-only input in a personal tool. **Do not remove this flag** unless you also constrain who can write to these doctypes.

### Permissions

- System Manager: Full access (create, read, write, delete)

---

## Prompt Category

A cross-cutting tag for prompts. Orthogonal to Project — the same category (e.g. "code-review") can apply across many projects.

### Naming Rule

Uses `category_name` as the document name.

### Permissions

- System Manager: Full access

---

## Project

Groups prompts that belong to a single piece of work (e.g. "iVend", "Navgold"). Set the `project` field on a Prompt to put it under a project.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `project_name` | Data | Required, unique. Used as the document name |
| `status` | Select | `Active` (default) / `Archived` |
| `description` | Small Text | Optional |

### Naming Rule

`field:project_name` — the project name is the document ID.

### Permissions

- System Manager: Full access

---

## Prompt Version

A snapshot of a previous value of `Prompt.prompt`. Each row is the **old** content from one save where the prompt actually changed.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `parent_prompt` | Link → Prompt | Required, filterable |
| `content` | Markdown Editor | The snapshotted prompt content (with `ignore_xss_filter: 1`) |
| `notes` | Small Text | Optional. Migration script sets this to "Migrated from legacy prompt_2 field" for back-filled rows |

### Naming Rule

`hash` — random.

### Created by

`Prompt._snapshot_previous_version` (controller hook on parent). Not normally created by hand, but you can.

---

## Prompt Run

A specific usage of a Prompt: an implementation directive, bash script, or note that was paired with the prompt during a session.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `parent_prompt` | Link → Prompt | Required, filterable |
| `title` | Data | Auto-defaults to `<parent>: <first 60 chars of body>` if left blank |
| `kind` | Select | `Implementation Directive` (default) / `Bash Script` / `Note` / `Other`. Filterable |
| `outcome` | Select | `Pending` (default) / `Success` / `Partial` / `Failed`. Filterable |
| `body` | Markdown Editor | The actual content (directive text, fenced bash block, etc.). Has `ignore_xss_filter: 1` |
| `notes` | Small Text | What worked, what to change next time |

### Naming Rule

`hash` — random.

### Form behaviour

- When opened from the Prompt form's `+ New Run` button, `parent_prompt` is prefilled via `frappe.route_options`.
- `before_save` auto-fills `title` if blank.
- All commonly-edited fields (`title`, `parent_prompt`, `kind`, `outcome`, `body`) have `allow_in_quick_entry: 1`. From `/app/prompt-run`, clicking **+** opens a Quick Entry dialog so a run can be logged in one keystroke without leaving the list view. `notes` is intentionally excluded — quick entries should be terse; expand the doc later if there's commentary to add.

---

## Relationships

```
Snippet Category (1) ──────< (many) Tailwind Snippet

Project (1)          ──────< (many) Prompt
Prompt Category (1)  ──────< (many) Prompt
Prompt (1)           ──────< (many) Prompt Version  (history of previous values)
Prompt (1)           ──────< (many) Prompt Run      (usage log)
```

- A snippet category can have many snippets; a snippet belongs to one category (optional).
- A project can have many prompts; a prompt belongs to at most one project.
- A prompt category can tag many prompts; a prompt has at most one category. Project + Category are orthogonal.
- Each prompt accumulates a Version Library (snapshots of older bodies) and a Run Log (usages).

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
