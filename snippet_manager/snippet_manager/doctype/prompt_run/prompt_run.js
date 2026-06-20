// Copyright (c) 2026, Rl0007 and contributors
// For license information, please see license.txt

frappe.ui.form.on("Prompt Run", {
	refresh(frm) {
		if (frm.is_new() && frappe.route_options?.parent_prompt) {
			frm.set_value("parent_prompt", frappe.route_options.parent_prompt);
		}
	},
});
