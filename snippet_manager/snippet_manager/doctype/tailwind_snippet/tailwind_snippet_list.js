frappe.listview_settings["Tailwind Snippet"] = {
	add_fields: ["category", "snippet_type", "html_code", "is_favorite"],

	get_indicator: function (doc) {
		const type_colors = {
			Component: "blue",
			Section: "green",
			Page: "purple",
			Layout: "orange",
			Navigation: "cyan",
			Form: "yellow",
			Card: "pink",
			Button: "red",
			Other: "gray",
		};
		return [__(doc.snippet_type), type_colors[doc.snippet_type] || "gray", `snippet_type,=,${doc.snippet_type}`];
	},

	formatters: {
		title: function (value, df, doc) {
			const star = doc.is_favorite
				? '<span style="color: var(--yellow-500); margin-right: 6px;">★</span>'
				: "";
			return star + value;
		},
	},

	button: {
		show: function (doc) {
			return true;
		},
		get_label: function () {
			return __("Preview");
		},
		get_description: function (doc) {
			return __("Preview {0}", [doc.title]);
		},
		action: function (doc) {
			window.open(`/snippet_preview?snippet=${encodeURIComponent(doc.name)}`, "_blank");
		},
	},

	onload: function (listview) {
		// Add custom buttons
		listview.page.add_inner_button(__("New Category"), function () {
			frappe.new_doc("Snippet Category");
		});

		// Add filter for starred items
		listview.page.add_inner_button(
			__("Starred Only"),
			function () {
				listview.filter_area.add([[listview.doctype, "is_favorite", "=", 1]]);
			},
			__("Filters")
		);

		// Add filter by type
		const types = ["Component", "Section", "Page", "Layout", "Navigation", "Form", "Card", "Button"];
		types.forEach((type) => {
			listview.page.add_inner_button(
				__(type),
				function () {
					listview.filter_area.add([[listview.doctype, "snippet_type", "=", type]]);
				},
				__("Filter by Type")
			);
		});
	},

	primary_action: function () {
		frappe.new_doc("Tailwind Snippet");
	},

	get_primary_action_icon: function () {
		return "add";
	},
};
