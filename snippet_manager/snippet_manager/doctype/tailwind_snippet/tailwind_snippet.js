// Copyright (c) 2025, Rl0007 and contributors
// For license information, please see license.txt

frappe.ui.form.on("Tailwind Snippet", {
	setup(frm) {
		// Initialize state
		frm.preview_state = {
			viewport: "100%",
			viewport_label: "Desktop",
			background: "light",
			zoom: 100,
			height: 500,
			custom_width: null,
		};
		frm.preview_debounce_timer = null;
	},

	refresh(frm) {
		// Always render preview on refresh (handles existing docs)
		setTimeout(() => {
			frm.trigger("render_preview");
		}, 100);

		frm.trigger("add_custom_buttons");
		frm.trigger("setup_code_editor_height");
	},

	onload(frm) {
		// Render preview when form loads with existing data
		if (frm.doc.html_code) {
			setTimeout(() => {
				frm.trigger("render_preview");
			}, 200);
		}
	},

	html_code(frm) {
		// Debounced live preview - updates as you type
		frm.trigger("debounced_preview_update");
	},

	custom_css(frm) {
		frm.trigger("debounced_preview_update");
	},

	debounced_preview_update(frm) {
		// Clear existing timer
		if (frm.preview_debounce_timer) {
			clearTimeout(frm.preview_debounce_timer);
		}

		// Set new timer - update preview after 300ms of no typing
		frm.preview_debounce_timer = setTimeout(() => {
			frm.trigger("update_preview_content");
		}, 300);
	},

	setup_code_editor_height(frm) {
		// Make code editors bigger
		setTimeout(() => {
			const html_editor = frm.fields_dict.html_code?.$wrapper?.find(".ace_editor");
			const css_editor = frm.fields_dict.custom_css?.$wrapper?.find(".ace_editor");

			if (html_editor?.length) {
				html_editor.css("min-height", "400px");
				const ace_instance = frm.fields_dict.html_code?.ace_editor_target?.env?.editor;
				if (ace_instance) {
					ace_instance.resize();
				}
			}

			if (css_editor?.length) {
				css_editor.css("min-height", "250px");
				const ace_instance = frm.fields_dict.custom_css?.ace_editor_target?.env?.editor;
				if (ace_instance) {
					ace_instance.resize();
				}
			}
		}, 500);
	},

	add_custom_buttons(frm) {
		// Primary actions
		frm.add_custom_button(
			__("Copy HTML"),
			() => frm.trigger("copy_to_clipboard"),
			__("Actions")
		);

		frm.add_custom_button(
			__("Copy Complete HTML"),
			() => frm.trigger("copy_complete_html"),
			__("Actions")
		);

		frm.add_custom_button(
			__("Full Screen Preview"),
			() => frm.trigger("open_fullscreen_preview"),
			__("Actions")
		);

		frm.add_custom_button(
			__("Download HTML"),
			() => frm.trigger("download_html"),
			__("Actions")
		);

		if (!frm.is_new()) {
			frm.add_custom_button(
				__("Duplicate"),
				() => frm.trigger("duplicate_snippet"),
				__("Actions")
			);
		}

		// Toggle favorite
		if (!frm.is_new()) {
			const is_favorite = frm.doc.is_favorite;
			frm.add_custom_button(
				is_favorite ? __("Unstar") : __("Star"),
				() => frm.trigger("toggle_favorite"),
				__("Actions")
			);
		}
	},

	copy_to_clipboard(frm) {
		const html_code = frm.doc.html_code || "";
		navigator.clipboard.writeText(html_code).then(() => {
			frappe.show_alert({
				message: __("HTML code copied to clipboard!"),
				indicator: "green",
			});
		});
	},

	copy_complete_html(frm) {
		frm.trigger("get_preview_html");
		navigator.clipboard.writeText(frm.preview_html_content).then(() => {
			frappe.show_alert({
				message: __("Complete HTML with Tailwind copied!"),
				indicator: "green",
			});
		});
	},

	download_html(frm) {
		frm.trigger("get_preview_html");
		const blob = new Blob([frm.preview_html_content], { type: "text/html" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${frm.doc.title || "snippet"}.html`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		frappe.show_alert({
			message: __("HTML file downloaded!"),
			indicator: "green",
		});
	},

	duplicate_snippet(frm) {
		frappe.new_doc("Tailwind Snippet", {
			title: `${frm.doc.title} (Copy)`,
			category: frm.doc.category,
			snippet_type: frm.doc.snippet_type,
			tags: frm.doc.tags,
			description: frm.doc.description,
			html_code: frm.doc.html_code,
			custom_css: frm.doc.custom_css,
		});
	},

	toggle_favorite(frm) {
		frm.set_value("is_favorite", !frm.doc.is_favorite);
		frm.save();
	},

	open_fullscreen_preview(frm) {
		if (frm.is_new()) {
			frappe.msgprint(__("Please save the snippet first to use full screen preview."));
			return;
		}
		// Open the dedicated preview page with query param
		window.open(`/snippet_preview?snippet=${encodeURIComponent(frm.doc.name)}`, "_blank");
	},

	get_preview_html(frm) {
		const html_code = frm.doc.html_code || "";
		const custom_css = frm.doc.custom_css || "";
		const bg = frm.preview_state?.background || "light";
		const bg_style =
			bg === "dark"
				? "background-color: #1a1a2e; color: #eaeaea;"
				: bg === "checkered"
					? "background: repeating-conic-gradient(#e5e5e5 0% 25%, #fff 0% 50%) 50% / 16px 16px;"
					: "background-color: #ffffff;";

		const preview_html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${frm.doc.title || "Tailwind Preview"}</title>
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    <style>
        * { box-sizing: border-box; }
        body {
            margin: 0;
            padding: 20px;
            font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
            min-height: 100vh;
            ${bg_style}
        }
        ${custom_css}
    </style>
</head>
<body>
    ${html_code}
</body>
</html>`;
		frm.preview_html_content = preview_html;
		return preview_html;
	},

	update_preview_content(frm) {
		const iframe = frm.preview_iframe;
		if (!iframe) return;

		frm.trigger("get_preview_html");

		const iframe_doc = iframe.contentDocument || iframe.contentWindow.document;
		iframe_doc.open();
		iframe_doc.write(frm.preview_html_content);
		iframe_doc.close();

		// Auto-resize after content loads
		iframe.onload = function () {
			frm.trigger("auto_resize_iframe");
		};
	},

	auto_resize_iframe(frm) {
		const iframe = frm.preview_iframe;
		if (!iframe) return;

		try {
			const iframe_doc = iframe.contentDocument || iframe.contentWindow.document;
			const body = iframe_doc.body;
			const html = iframe_doc.documentElement;
			const contentHeight = Math.max(
				body?.scrollHeight || 0,
				body?.offsetHeight || 0,
				html?.clientHeight || 0,
				html?.scrollHeight || 0,
				html?.offsetHeight || 0
			);
			const minHeight = frm.preview_state?.height || 500;
			iframe.style.height = Math.max(contentHeight + 40, minHeight) + "px";
		} catch (e) {
			// Ignore cross-origin errors
		}
	},

	render_preview(frm) {
		const wrapper = frm.fields_dict.preview_html?.$wrapper;
		if (!wrapper) return;

		wrapper.empty();

		const state = frm.preview_state;

		// Build the preview UI with resizable container
		const container = $(`
			<div class="tailwind-preview-container">
				<!-- Toolbar -->
				<div class="preview-toolbar">
					<!-- Viewport Controls -->
					<div class="toolbar-group">
						<span class="toolbar-label">Viewport</span>
						<div class="btn-group">
							<button class="btn btn-xs btn-default viewport-btn ${state.viewport === "100%" && !state.custom_width ? "active" : ""}" data-width="100%" data-label="Desktop" title="Desktop (100%)">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
							</button>
							<button class="btn btn-xs btn-default viewport-btn ${state.viewport === "768px" ? "active" : ""}" data-width="768px" data-label="Tablet" title="Tablet (768px)">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M12 18h.01"/></svg>
							</button>
							<button class="btn btn-xs btn-default viewport-btn ${state.viewport === "375px" ? "active" : ""}" data-width="375px" data-label="Mobile" title="Mobile (375px)">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>
							</button>
						</div>
					</div>

					<!-- Background Controls -->
					<div class="toolbar-group">
						<span class="toolbar-label">Background</span>
						<div class="btn-group">
							<button class="btn btn-xs btn-default bg-btn ${state.background === "light" ? "active" : ""}" data-bg="light" title="Light Background">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
							</button>
							<button class="btn btn-xs btn-default bg-btn ${state.background === "dark" ? "active" : ""}" data-bg="dark" title="Dark Background">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
							</button>
							<button class="btn btn-xs btn-default bg-btn ${state.background === "checkered" ? "active" : ""}" data-bg="checkered" title="Checkered Background">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
							</button>
						</div>
					</div>

					<!-- Quick Actions -->
					<div class="toolbar-group toolbar-actions">
						<button class="btn btn-xs btn-default refresh-btn" title="Refresh Preview">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
						</button>
					</div>

					<!-- Viewport Info -->
					<div class="viewport-info">
						<span class="viewport-size">${state.custom_width ? state.custom_width + "px" : state.viewport === "100%" ? "Full Width" : state.viewport}</span>
						<span class="drag-hint">Drag edges to resize</span>
					</div>
				</div>

				<!-- Resizable Preview Frame -->
				<div class="preview-resizable-wrapper">
					<div class="resize-handle resize-handle-left" data-side="left">
						<div class="handle-bar"></div>
					</div>
					<div class="preview-frame-wrapper" style="width: ${state.custom_width ? state.custom_width + "px" : state.viewport};">
						<div class="preview-frame-container" data-bg="${state.background}">
							<iframe class="preview-iframe" style="
								width: 100%;
								min-height: ${state.height}px;
								border: none;
								display: block;
							"></iframe>
						</div>
					</div>
					<div class="resize-handle resize-handle-right" data-side="right">
						<div class="handle-bar"></div>
					</div>
				</div>

				<!-- Width indicator while dragging -->
				<div class="width-indicator" style="display: none;">
					<span class="width-value">0px</span>
				</div>

				<!-- Empty State -->
				${
					!frm.doc.html_code
						? `
				<div class="preview-empty-state">
					<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6M9 15l3 3 3-3"/></svg>
					<p>Enter HTML code above to see the preview</p>
				</div>
				`
						: ""
				}
			</div>
		`);

		wrapper.append(container);

		// Store references
		frm.preview_iframe = container.find(".preview-iframe")[0];
		const frameWrapper = container.find(".preview-frame-wrapper");
		const resizableWrapper = container.find(".preview-resizable-wrapper");
		const viewportSize = container.find(".viewport-size");
		const widthIndicator = container.find(".width-indicator");
		const widthValue = container.find(".width-value");

		// Render initial content
		if (frm.doc.html_code) {
			frm.trigger("update_preview_content");
		}

		// Drag resize functionality
		let isDragging = false;
		let startX = 0;
		let startWidth = 0;
		let dragSide = null;

		container.find(".resize-handle").on("mousedown", function (e) {
			e.preventDefault();
			isDragging = true;
			dragSide = $(this).data("side");
			startX = e.clientX;
			startWidth = frameWrapper.width();

			// Show width indicator
			widthIndicator.css({
				display: "flex",
				position: "fixed",
				top: e.clientY - 40 + "px",
				left: e.clientX - 30 + "px",
			});

			$(document).on("mousemove.resize", function (e) {
				if (!isDragging) return;

				const diff = dragSide === "right" ? e.clientX - startX : startX - e.clientX;
				// Multiply by 2 because we resize from center
				let newWidth = startWidth + diff * 2;

				// Clamp width between 280 and container width
				const maxWidth = resizableWrapper.width();
				newWidth = Math.max(280, Math.min(maxWidth, newWidth));

				frameWrapper.css({
					width: newWidth + "px",
					margin: "0 auto",
				});

				// Update indicators
				widthValue.text(Math.round(newWidth) + "px");
				viewportSize.text(Math.round(newWidth) + "px");
				widthIndicator.css({
					top: e.clientY - 40 + "px",
					left: e.clientX - 30 + "px",
				});

				// Store custom width and deselect preset buttons
				frm.preview_state.custom_width = Math.round(newWidth);
				container.find(".viewport-btn").removeClass("active");
			});

			$(document).on("mouseup.resize", function () {
				isDragging = false;
				widthIndicator.hide();
				$(document).off("mousemove.resize mouseup.resize");
			});
		});

		// Viewport preset buttons
		container.find(".viewport-btn").on("click", function () {
			const width = $(this).data("width");
			const label = $(this).data("label");

			frm.preview_state.viewport = width;
			frm.preview_state.viewport_label = label;
			frm.preview_state.custom_width = null; // Clear custom width

			container.find(".viewport-btn").removeClass("active");
			$(this).addClass("active");

			frameWrapper.css({
				width: width,
				margin: width === "100%" ? "0" : "0 auto",
			});

			viewportSize.text(width === "100%" ? "Full Width" : `${width} (${label})`);
		});

		// Background buttons
		container.find(".bg-btn").on("click", function () {
			const bg = $(this).data("bg");
			frm.preview_state.background = bg;

			container.find(".bg-btn").removeClass("active");
			$(this).addClass("active");

			container.find(".preview-frame-container").attr("data-bg", bg);
			frm.trigger("update_preview_content");
		});

		// Refresh button
		container.find(".refresh-btn").on("click", function () {
			frm.trigger("update_preview_content");
			frappe.show_alert({ message: __("Preview refreshed"), indicator: "green" });
		});
	},
});
