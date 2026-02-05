# Getting Started

This guide walks you through setting up and using Snippet Manager.

## Prerequisites

- Frappe Framework v15+
- A working Frappe bench setup

## Installation

### 1. Get the App

```bash
cd $PATH_TO_YOUR_BENCH
bench get-app snippet_manager $URL_OF_THIS_REPO --branch develop
```

### 2. Install on Your Site

```bash
bench --site your-site install-app snippet_manager
```

### 3. Run Migrations

```bash
bench --site your-site migrate
```

### 4. Build Assets

```bash
bench build --app snippet_manager
```

### 5. Clear Cache & Restart

```bash
bench --site your-site clear-cache
bench restart
```

## First Steps

### 1. Access the Workspace

Navigate to the **Snippet Manager** workspace from the sidebar, or go directly to:
- `/app/snippet-manager` - Workspace
- `/app/tailwind-snippet` - Snippet list
- `/app/snippet-category` - Category list

### 2. Create Categories

Before adding snippets, create some categories to organize them:

1. Go to **Snippet Category** list
2. Click **+ Add Snippet Category**
3. Enter a name (e.g., "Buttons", "Cards", "Navigation")
4. Pick a color for visual identification
5. Save

Suggested categories:
- **UI Components** - Buttons, badges, avatars
- **Cards** - Product cards, profile cards, info cards
- **Navigation** - Headers, sidebars, breadcrumbs
- **Forms** - Input fields, login forms, contact forms
- **Sections** - Hero sections, feature grids, testimonials
- **Pages** - Full page layouts

### 3. Add Your First Snippet

1. Go to **Tailwind Snippet** list
2. Click **+ Add Tailwind Snippet**
3. Fill in the details:
   - **Title**: Descriptive name (e.g., "Primary Button")
   - **Category**: Select from your categories
   - **Snippet Type**: Component, Section, Page, etc.
   - **HTML Code**: Paste your Tailwind HTML

Example snippet:

```html
<button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
  Click Me
</button>
```

4. The preview updates automatically as you type
5. Use viewport toggles to test responsiveness
6. Save when done

### 4. Using the Preview

The preview section includes:

- **Desktop** (100% width) - Default view
- **Tablet** (768px) - Test tablet breakpoints
- **Mobile** (375px) - Test mobile breakpoints

Additional actions:
- **Copy HTML** button - Copies code to clipboard
- **Full Screen Preview** - Opens in new tab

## Tips

1. **Use Tags** - Add comma-separated tags for better searchability
2. **Custom CSS** - Add extra styles that work alongside Tailwind
3. **Quick Preview** - Use the Preview button in list view for quick checks
4. **Type Filtering** - Filter by snippet type in the list view

## Troubleshooting

### Preview Not Loading

1. Check browser console for errors
2. Ensure internet connectivity (Tailwind loads from CDN)
3. Clear browser cache and reload

### Styles Not Applying

1. Verify you're using valid Tailwind v4 classes
2. Check for typos in class names
3. Some Tailwind v3 classes may differ in v4

### Migration Issues

```bash
bench --site your-site clear-cache
bench --site your-site migrate --rebuild-website
```
