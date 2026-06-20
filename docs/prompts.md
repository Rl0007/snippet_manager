# Prompt Manager

A workflow guide for managing LLM prompts inside Snippet Manager. Covers categorisation, version history, and usage tracking. For the field-by-field schema, see [`doctypes.md`](./doctypes.md).

---

## Why this exists

Working with LLMs day-to-day, three problems show up:

1. **Prompts pile up by project.** Without grouping, a flat list of 50+ prompts is unusable when you only care about the 5 you're using on the current project.
2. **Prompts evolve.** You tweak wording, tighten instructions, add an output-format constraint — and lose the previous version. The "good one from last week" is gone.
3. **The same prompt gets reused with different concrete instructions.** A context-setter prompt is followed by an implementation directive ("Implement page X using reference Y") or a bash script (a Ralph loop, a caffeinated build). Tracking those usages in comments works for a few; after that, you can't find anything.

Snippet Manager's prompt side solves these with three doctypes that link to **Prompt**:

| Doctype | What it captures |
|---------|------------------|
| `Project` | Buckets prompts by piece of work |
| `Prompt Version` | Snapshots of previous prompt bodies |
| `Prompt Run` | Each concrete usage — directive, script, or note |

`Prompt Category` is also available for cross-cutting tags (orthogonal to Project).

---

## Workflow

### 1. Set up projects

```
/app/project/new
```

Create one Project per piece of work — e.g. `iVend`, `Navgold`, `Hobby`. Mark old ones `Archived` to hide them from default filters without deleting.

### 2. Categorise a prompt

Open any Prompt. In the right column:

- **Project** — link to one Project. Filterable in the list view.
- **Category** — link to a `Prompt Category` (e.g. `code-review`, `documentation`). Use this for tags that span projects.

You can use either, both, or neither. The two are orthogonal: filter the list by `Project = iVend, Category = code-review` to see iVend-specific code-review prompts.

### 3. Versioning — automatic

Just edit the **Prompt** field and hit **Save**. The previous body is snapshotted into a `Prompt Version` row before the new value is written. New prompts (first save) do **not** create a snapshot — only edits do.

Open the **Version History** section (collapsed by default at the bottom of the form) to see:

- One card per previous save, newest first
- A `Show` button to inline-render the version's markdown without opening a dialog
- `Copy` to copy the raw markdown to clipboard
- `Restore` to load that version back into the live Prompt field — saving then snapshots whatever was in the field beforehand, so you cannot lose state by restoring

The current/live prompt is always the `prompt` field at the top. The history is *previous* values only.

### 4. Capturing runs — manual

The **Runs** section (also collapsible) tracks every concrete usage of a prompt.

#### Creating a run

Two paths:

1. **From a Prompt form** — click **+ New Run** in the Runs section. The full Prompt Run form opens with `parent_prompt` prefilled. Use this when you want to write notes, tweak title, etc.
2. **From the Prompt Run list** — at `/app/prompt-run`, click the **+** button. A Quick Entry dialog appears with `title`, `parent_prompt`, `kind`, `outcome`, and `body` only — no `notes`, no section breaks. This is the keep-the-momentum path: paste a directive or bash command, hit save, you're back in your work in seconds.

Either way, fill in:

- **Kind** — `Implementation Directive` (default) / `Bash Script` / `Note` / `Other`
- **Body** — the actual content. Markdown Editor; fenced ` ```bash ` blocks render in preview.
- **Outcome** — start at `Pending`. Update to `Success` / `Partial` / `Failed` after the run finishes.
- **Notes** — what worked, what to tweak next time. Only on the full form.
- **Title** — leave blank to auto-name from the first line of body.

Save and the run shows up as a card on the parent Prompt's Runs section.

#### Run card actions

| Action | Effect |
|--------|--------|
| `Copy` | Copies the raw body markdown to clipboard. The fastest path back into a chat or terminal. |
| `Duplicate` | Clones the run (same parent prompt, same kind, fresh outcome = Pending), opens the duplicate. Treat past runs as templates. |
| `Open` | Navigates to the Prompt Run form. |
| `Show` | Inline renders the markdown body and any notes. |

#### Why this beats comments

- **List view across all prompts.** `/app/prompt-run` shows every run, filterable by `kind`, `outcome`, `parent_prompt`. Find that caffeinated build script from two weeks ago in three clicks.
- **Stable URLs.** Each run has its own form URL — paste it into Slack/git notes/follow-up tasks.
- **Outcome tracking.** Patterns surface over time ("the directives that include a Reference URL succeed more than the ones that don't").
- **Templates.** Duplicate a successful run, tweak the path, fire again.

---

## Common operations

### Find every implementation directive that worked

```
/app/prompt-run?kind=Implementation Directive&outcome=Success
```

### See all prompts on the active project

```
/app/prompt?project=iVend
```

### Compare versions of a prompt

Open the prompt, expand **Version History**, click `Show` on two cards side-by-side (browser tabs or split window).

### Roll back a prompt

Open Version History, find the desired version, click `Restore`, then `Save`. The Restore button only stages the change in the form — you still control the commit. Saving auto-snapshots whatever is currently in the prompt field, so the rollback itself becomes a recoverable point.

### Migrate legacy `prompt_2` content

Run once after upgrading:

```python
import frappe
prompts_with_legacy = frappe.get_all(
    "Prompt",
    filters={"prompt_2": ["is", "set"]},
    fields=["name", "prompt_2"],
)
for p in prompts_with_legacy:
    if not (p.prompt_2 or "").strip():
        continue
    if frappe.db.exists(
        "Prompt Version",
        {"parent_prompt": p.name, "notes": "Migrated from legacy prompt_2 field"},
    ):
        continue
    pv = frappe.new_doc("Prompt Version")
    pv.parent_prompt = p.name
    pv.content = p.prompt_2
    pv.notes = "Migrated from legacy prompt_2 field"
    pv.insert(ignore_permissions=True)
frappe.db.commit()
```

The legacy `prompt_2` field stays on disk (read-only, hidden under the `Legacy` collapsed section) so the original data is never deleted.

---

## Gotchas

### Angle-bracket placeholders used to be silently truncated

Pre-fix, pasting a prompt that contained `<route>`, `<active>`, `<path>`, etc. would store a partial value: Frappe's `sanitize_html()` runs on `Markdown Editor` fields and bleach drops content from the first malformed-tag onward. The placeholder text has the **shape** of HTML tags, even though it is plain text.

The fix is `ignore_xss_filter: 1` on `Prompt.prompt`, `Prompt Version.content`, and `Prompt Run.body`. Safe in this app because only authenticated users (System Manager role by default) can write to these doctypes — there is no XSS surface.

If you ever expose any of these doctypes to unauthenticated input, you must remove the flag and find a different way to escape angle brackets (e.g. fenced code blocks at the application layer).

### Markdown Editor stores up to 4 GB

The underlying MariaDB column is `longtext`. Don't worry about size — the truncation problem above is sanitization, not storage.

### `prompt.js` runs `frappe.markdown()` on version + run content for inline rendering

This is safe because we render in the Frappe-trusted desk context only, and content originates from the same trusted user. If you re-use the rendering helpers in a public/portal context, route through Frappe's safe HTML pipeline instead.

### Save the parent Prompt before creating a Run

The `+ New Run` button is only meaningful once `Prompt.name` exists. The form shows a hint and disables run creation while `frm.is_new()` is true.

### `before_save` snapshots **only when the prompt body changes**

If you save a Prompt without editing the `prompt` field — e.g. you only changed Project or Category — no version is created. This is intentional: history tracks prompt-body evolution, not metadata churn.

---

## Quick start (cheat sheet)

```
1. /app/project/new          → Create projects
2. /app/prompt/new           → Create a prompt, set project + category
3. Edit prompt, Save         → Auto-versioning kicks in
4. + New Run on a prompt     → Capture how you used it (directive, script, note)
5. /app/prompt-run?...       → Filter across runs
```
