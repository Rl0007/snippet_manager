// Copyright (c) 2026, Rl0007 and contributors
// For license information, please see license.txt

frappe.ui.form.on("Prompt", {
	refresh(frm) {
		render_version_history(frm);
		render_runs(frm);
	},
	after_save(frm) {
		render_version_history(frm);
		render_runs(frm);
	},
});

async function render_version_history(frm) {
	const wrapper = frm.get_field("version_history")?.$wrapper;
	if (!wrapper) return;
	wrapper.empty();

	if (frm.is_new()) {
		wrapper.html(
			`<div class="text-muted small">Version history appears after the first save.</div>`
		);
		return;
	}

	const versions = await frappe.db.get_list("Prompt Version", {
		filters: { parent_prompt: frm.doc.name },
		fields: ["name", "content", "notes", "creation"],
		order_by: "creation desc",
		limit: 0,
	});

	if (!versions.length) {
		wrapper.html(
			`<div class="text-muted small">No previous versions yet. Edit the prompt above and save — the previous value will be snapshotted here.</div>`
		);
		return;
	}

	const container = $(`<div class="prompt-version-list"></div>`).appendTo(wrapper);
	versions.forEach((v, idx) => {
		const card = build_version_card(frm, v, versions.length - idx);
		container.append(card);
	});
}

function build_version_card(frm, version, label_no) {
	const when = frappe.datetime.comment_when(version.creation);
	const html_body = frappe.markdown(version.content || "");
	const card = $(`
		<div class="prompt-version-card border rounded p-3 mb-3" style="background:var(--bg-color);">
			<div class="d-flex justify-content-between align-items-center mb-2">
				<div>
					<strong>Version ${label_no}</strong>
					<span class="text-muted small ml-2">${when}</span>
				</div>
				<div class="d-flex" style="gap:6px;">
					<button class="btn btn-default btn-xs btn-copy">${__("Copy")}</button>
					<button class="btn btn-default btn-xs btn-restore">${__("Restore")}</button>
					<button class="btn btn-default btn-xs btn-toggle">${__("Show")}</button>
				</div>
			</div>
			<div class="prompt-version-body" style="display:none; max-height:400px; overflow:auto;
				border-top:1px solid var(--border-color); padding-top:8px; font-size:13px;">
				${html_body}
			</div>
		</div>
	`);

	const body = card.find(".prompt-version-body");
	const toggle_btn = card.find(".btn-toggle");

	toggle_btn.on("click", () => {
		const visible = body.is(":visible");
		body.toggle(!visible);
		toggle_btn.text(visible ? __("Show") : __("Hide"));
	});

	card.find(".btn-copy").on("click", async () => {
		try {
			await navigator.clipboard.writeText(version.content || "");
			frappe.show_alert({ message: __("Copied to clipboard"), indicator: "green" });
		} catch (e) {
			frappe.msgprint({ message: __("Copy failed: ") + e.message, indicator: "red" });
		}
	});

	card.find(".btn-restore").on("click", () => {
		frappe.confirm(
			__(
				"Restore this version into the current Prompt? The current Prompt will be snapshotted as a new version on save."
			),
			() => {
				frm.set_value("prompt", version.content || "");
				frappe.show_alert({
					message: __("Restored. Click Save to commit."),
					indicator: "blue",
				});
			}
		);
	});

	return card;
}

async function render_runs(frm) {
	const wrapper = frm.get_field("runs")?.$wrapper;
	if (!wrapper) return;
	wrapper.empty();

	if (frm.is_new()) {
		wrapper.html(
			`<div class="text-muted small">Save the prompt first — then you can attach runs.</div>`
		);
		return;
	}

	const header = $(`
		<div class="d-flex justify-content-between align-items-center mb-2">
			<div class="text-muted small">
				Implementation directives, scripts, or notes used with this prompt.
			</div>
			<button class="btn btn-primary btn-xs btn-new-run">+ ${__("New Run")}</button>
		</div>
	`).appendTo(wrapper);

	header.find(".btn-new-run").on("click", () => {
		frappe.route_options = { parent_prompt: frm.doc.name };
		frappe.new_doc("Prompt Run");
	});

	const runs = await frappe.db.get_list("Prompt Run", {
		filters: { parent_prompt: frm.doc.name },
		fields: ["name", "title", "kind", "outcome", "body", "notes", "creation"],
		order_by: "creation desc",
		limit: 0,
	});

	if (!runs.length) {
		$(
			`<div class="text-muted small">No runs yet. Click <strong>+ New Run</strong> above to capture an implementation directive or script you used with this prompt.</div>`
		).appendTo(wrapper);
		return;
	}

	const container = $(`<div class="prompt-run-list"></div>`).appendTo(wrapper);
	runs.forEach((r) => {
		container.append(build_run_card(frm, r));
	});
}

const OUTCOME_INDICATOR = {
	Pending: "gray",
	Success: "green",
	Partial: "orange",
	Failed: "red",
};

function build_run_card(frm, run) {
	const when = frappe.datetime.comment_when(run.creation);
	const html_body = frappe.markdown(run.body || "");
	const outcome_color = OUTCOME_INDICATOR[run.outcome] || "gray";
	const title = run.title || run.name;

	const card = $(`
		<div class="prompt-run-card border rounded p-3 mb-3" style="background:var(--bg-color);">
			<div class="d-flex justify-content-between align-items-center mb-2" style="gap:8px;">
				<div style="min-width:0; flex:1;">
					<div class="d-flex align-items-center" style="gap:8px; flex-wrap:wrap;">
						<strong class="text-truncate">${frappe.utils.escape_html(title)}</strong>
						<span class="indicator-pill ${outcome_color}">${frappe.utils.escape_html(run.outcome || "Pending")}</span>
						<span class="badge badge-secondary">${frappe.utils.escape_html(run.kind || "")}</span>
					</div>
					<div class="text-muted small mt-1">${when}</div>
				</div>
				<div class="d-flex" style="gap:6px; flex-shrink:0;">
					<button class="btn btn-default btn-xs btn-copy">${__("Copy")}</button>
					<button class="btn btn-default btn-xs btn-duplicate">${__("Duplicate")}</button>
					<button class="btn btn-default btn-xs btn-open">${__("Open")}</button>
					<button class="btn btn-default btn-xs btn-toggle">${__("Show")}</button>
				</div>
			</div>
			<div class="prompt-run-body" style="display:none; max-height:400px; overflow:auto;
				border-top:1px solid var(--border-color); padding-top:8px; font-size:13px;">
				${html_body}
				${run.notes ? `<div class="mt-2 text-muted small"><strong>${__("Notes:")}</strong> ${frappe.utils.escape_html(run.notes)}</div>` : ""}
			</div>
		</div>
	`);

	const body = card.find(".prompt-run-body");
	const toggle_btn = card.find(".btn-toggle");

	toggle_btn.on("click", () => {
		const visible = body.is(":visible");
		body.toggle(!visible);
		toggle_btn.text(visible ? __("Show") : __("Hide"));
	});

	card.find(".btn-copy").on("click", async () => {
		try {
			await navigator.clipboard.writeText(run.body || "");
			frappe.show_alert({ message: __("Copied to clipboard"), indicator: "green" });
		} catch (e) {
			frappe.msgprint({ message: __("Copy failed: ") + e.message, indicator: "red" });
		}
	});

	card.find(".btn-open").on("click", () => {
		frappe.set_route("Form", "Prompt Run", run.name);
	});

	card.find(".btn-duplicate").on("click", async () => {
		const dup = await frappe.db.insert({
			doctype: "Prompt Run",
			parent_prompt: frm.doc.name,
			kind: run.kind,
			outcome: "Pending",
			body: run.body,
			notes: run.notes,
			title: `${run.title || run.name} (copy)`,
		});
		frappe.show_alert({ message: __("Duplicated"), indicator: "green" });
		frappe.set_route("Form", "Prompt Run", dup.name);
	});

	return card;
}
