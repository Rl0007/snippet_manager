// Snippet Manager JS
// Global utilities for snippet management

frappe.provide("snippet_manager");

// Copy snippet HTML to clipboard
snippet_manager.copy_snippet = function (html_code) {
	navigator.clipboard.writeText(html_code).then(() => {
		frappe.show_alert({
			message: __("Snippet copied to clipboard!"),
			indicator: "green",
		});
	});
};

// Open full-screen preview
snippet_manager.preview_snippet = function (name) {
	window.open(`/snippet_preview?snippet=${encodeURIComponent(name)}`, "_blank");
};

// Generate complete HTML with Tailwind
snippet_manager.generate_preview_html = function (html_code, custom_css, options = {}) {
	const bg = options.background || "light";
	const title = options.title || "Tailwind Preview";

	const bg_styles = {
		light: "background-color: #ffffff;",
		dark: "background-color: #1a1a2e; color: #eaeaea;",
		checkered: "background: repeating-conic-gradient(#e5e5e5 0% 25%, #fff 0% 50%) 50% / 16px 16px;",
	};

	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    <style>
        * { box-sizing: border-box; }
        body {
            margin: 0;
            padding: 20px;
            font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
            min-height: 100vh;
            ${bg_styles[bg] || bg_styles.light}
        }
        ${custom_css || ""}
    </style>
</head>
<body>
    ${html_code || ""}
</body>
</html>`;
};

// Download snippet as HTML file
snippet_manager.download_snippet = function (name, html_code, custom_css) {
	const html = snippet_manager.generate_preview_html(html_code, custom_css, { title: name });
	const blob = new Blob([html], { type: "text/html" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `${name}.html`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);

	frappe.show_alert({
		message: __("Snippet downloaded!"),
		indicator: "green",
	});
};

// Quick create snippet dialog
snippet_manager.quick_create = function () {
	const d = new frappe.ui.Dialog({
		title: __("Quick Create Snippet"),
		fields: [
			{
				fieldname: "title",
				fieldtype: "Data",
				label: __("Title"),
				reqd: 1,
			},
			{
				fieldname: "category",
				fieldtype: "Link",
				label: __("Category"),
				options: "Snippet Category",
			},
			{
				fieldname: "snippet_type",
				fieldtype: "Select",
				label: __("Type"),
				options: "Component\nSection\nPage\nLayout\nNavigation\nForm\nCard\nButton\nOther",
				default: "Component",
			},
			{
				fieldname: "html_code",
				fieldtype: "Code",
				label: __("HTML Code"),
				options: "HTML",
				reqd: 1,
			},
		],
		primary_action_label: __("Create"),
		primary_action: function (values) {
			frappe.call({
				method: "frappe.client.insert",
				args: {
					doc: {
						doctype: "Tailwind Snippet",
						...values,
					},
				},
				callback: function (r) {
					if (r.message) {
						frappe.show_alert({
							message: __("Snippet created!"),
							indicator: "green",
						});
						d.hide();
						frappe.set_route("Form", "Tailwind Snippet", r.message.name);
					}
				},
			});
		},
	});
	d.show();
};

// Search snippets
snippet_manager.search = function (query, callback) {
	frappe.call({
		method: "frappe.client.get_list",
		args: {
			doctype: "Tailwind Snippet",
			filters: [
				[
					"Tailwind Snippet",
					"title",
					"like",
					`%${query}%`,
				],
			],
			or_filters: [
				[
					"Tailwind Snippet",
					"tags",
					"like",
					`%${query}%`,
				],
			],
			fields: ["name", "title", "category", "snippet_type", "is_favorite"],
			limit_page_length: 20,
		},
		callback: function (r) {
			if (callback) {
				callback(r.message || []);
			}
		},
	});
};

// Export all snippets as JSON
snippet_manager.export_all = async function () {
	frappe.call({
		method: "frappe.client.get_list",
		args: {
			doctype: "Tailwind Snippet",
			fields: ["name", "title", "category", "snippet_type", "tags", "description", "html_code", "custom_css", "is_favorite"],
			limit_page_length: 0,
		},
		callback: function (r) {
			if (r.message) {
				const data = JSON.stringify(r.message, null, 2);
				const blob = new Blob([data], { type: "application/json" });
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `tailwind-snippets-${frappe.datetime.now_date()}.json`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);

				frappe.show_alert({
					message: __("{0} snippets exported!", [r.message.length]),
					indicator: "green",
				});
			}
		},
	});
};

// Import snippets from JSON
snippet_manager.import_snippets = function () {
	const input = document.createElement("input");
	input.type = "file";
	input.accept = ".json";
	input.onchange = function (e) {
		const file = e.target.files[0];
		const reader = new FileReader();
		reader.onload = function (e) {
			try {
				const snippets = JSON.parse(e.target.result);
				if (!Array.isArray(snippets)) {
					frappe.throw(__("Invalid format. Expected an array of snippets."));
				}

				frappe.confirm(
					__("Import {0} snippets? This will create new snippets, not update existing ones.", [snippets.length]),
					function () {
						let imported = 0;
						snippets.forEach((snippet) => {
							frappe.call({
								method: "frappe.client.insert",
								args: {
									doc: {
										doctype: "Tailwind Snippet",
										title: snippet.title,
										category: snippet.category,
										snippet_type: snippet.snippet_type,
										tags: snippet.tags,
										description: snippet.description,
										html_code: snippet.html_code,
										custom_css: snippet.custom_css,
									},
								},
								async: false,
								callback: function () {
									imported++;
								},
							});
						});

						frappe.show_alert({
							message: __("{0} snippets imported!", [imported]),
							indicator: "green",
						});

						// Refresh list if on list view
						if (cur_list && cur_list.doctype === "Tailwind Snippet") {
							cur_list.refresh();
						}
					}
				);
			} catch (err) {
				frappe.throw(__("Failed to parse JSON file: {0}", [err.message]));
			}
		};
		reader.readAsText(file);
	};
	input.click();
};

// Add keyboard shortcuts
$(document).on("keydown", function (e) {
	// Ctrl/Cmd + Shift + N: Quick create snippet (when on snippet pages)
	if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "N") {
		if (
			frappe.get_route()[0] === "List" &&
			frappe.get_route()[1] === "Tailwind Snippet"
		) {
			e.preventDefault();
			snippet_manager.quick_create();
		}
	}
});

// Initialize on page load
$(document).ready(function () {
	// Add export/import buttons to list view
	frappe.router.on("change", function () {
		setTimeout(function () {
			if (
				frappe.get_route()[0] === "List" &&
				frappe.get_route()[1] === "Tailwind Snippet" &&
				cur_list
			) {
				// Remove existing buttons first to avoid duplicates
				if (!cur_list._snippet_manager_buttons_added) {
					cur_list.page.add_inner_button(__("Export All"), snippet_manager.export_all, __("Data"));
					cur_list.page.add_inner_button(__("Import"), snippet_manager.import_snippets, __("Data"));
					cur_list._snippet_manager_buttons_added = true;
				}
			}
		}, 500);
	});
});
