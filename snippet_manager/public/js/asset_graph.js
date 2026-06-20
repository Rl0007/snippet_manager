// Drives the /asset-graph page: loads the asset graph, renders it on a zoomable Drawflow
// canvas, and opens a detail panel showing what's written inside the clicked asset.

// Left-to-right columns so composition/provenance reads one way: Workflow -> Agent -> Skill -> Prompt.
const KIND_COLUMN = { Workflow: 0, Agent: 1, Skill: 2, Prompt: 3 };
const COLUMN_X = [70, 380, 690, 1000];
const ROW_TOP = 60;
const ROW_GAP = 104;

async function fetch_method(method, args) {
	// www pages load no Frappe JS, so there's no frappe.call here — plain fetch + CSRF token.
	const response = await fetch(`/api/method/${method}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Frappe-CSRF-Token': window.csrf_token || '',
		},
		body: JSON.stringify(args || {}),
	});
	if (!response.ok) {
		throw new Error(`${method} failed: ${response.status}`);
	}
	return (await response.json()).message;
}

function escape_html(text) {
	const div = document.createElement('div');
	div.textContent = text || '';
	return div.innerHTML;
}

function node_html(kind, label) {
	return `<div class="asset-node">
		<span class="kind-dot"></span>
		<div class="node-meta">
			<div class="node-kind">${escape_html(kind)}</div>
			<div class="node-title">${escape_html(label)}</div>
		</div>
	</div>`;
}

function asset_graph() {
	return {
		loading: true,
		has_nodes: false,
		node_count: 0,
		detail: null,
		focusing: false,
		editor: null,
		df_el: null,
		asset_by_df: {},

		async init() {
			const data = (await fetch_method(
				'snippet_manager.api.get_asset_graph',
			)) || {
				nodes: [],
				edges: [],
			};
			this.node_count = data.nodes.length;
			this.has_nodes = data.nodes.length > 0;
			this.loading = false;
			if (this.has_nodes) {
				// Wait for x-show to reveal the canvas so Drawflow measures a real size.
				this.$nextTick(() => this.render(data));
			}
		},

		render(data) {
			const container = this.$refs.canvas;
			const editor = new Drawflow(container);
			editor.start();
			// Default 'edit' mode is the only one that fires nodeSelected on click; 'fixed'/'view'
			// swallow node clicks. Connection-drawing is blocked via pointer-events on the ports (CSS).
			this.editor = editor;
			this.df_el = container.querySelector('.drawflow');

			const df_by_asset = {};
			const row_count = {};
			for (const node of data.nodes) {
				const column = KIND_COLUMN[node.kind] ?? 3;
				const row = row_count[column] ?? 0;
				row_count[column] = row + 1;
				const df_id = editor.addNode(
					node.id,
					1,
					1,
					COLUMN_X[column],
					ROW_TOP + row * ROW_GAP,
					`kind-${node.kind.toLowerCase()}`,
					{},
					node_html(node.kind, node.label),
					false,
				);
				df_by_asset[node.id] = df_id;
				this.asset_by_df[df_id] = node.id;
			}

			for (const edge of data.edges) {
				const from = df_by_asset[edge.from];
				const to = df_by_asset[edge.to];
				if (from != null && to != null) {
					editor.addConnection(from, to, 'output_1', 'input_1');
				}
			}

			editor.on('nodeSelected', (df_id) => this.open_detail(df_id));
		},

		async open_detail(df_id) {
			const asset_id = this.asset_by_df[df_id];
			if (!asset_id) {
				return;
			}
			const [kind, name] = asset_id.split('::');
			this.detail = await fetch_method('snippet_manager.api.get_asset_detail', {
				kind,
				name,
			});
			this.focus_node(df_id);
		},

		focus_node(df_id) {
			// Emphasise the clicked node plus its directly connected neighbours; fade the rest.
			const node = this.editor.getNodeFromId(df_id);
			const neighbours = new Set([String(df_id)]);
			for (const port of Object.values(node.outputs)) {
				for (const connection of port.connections) {
					neighbours.add(String(connection.node));
				}
			}
			for (const port of Object.values(node.inputs)) {
				for (const connection of port.connections) {
					neighbours.add(String(connection.node));
				}
			}
			this.df_el.classList.add('is-focusing');
			for (const element of this.df_el.querySelectorAll('.drawflow-node')) {
				const id = element.id.replace('node-', '');
				element.classList.toggle('is-focused', neighbours.has(id));
			}
			this.focusing = true;
		},

		reset_focus() {
			if (!this.df_el) {
				return;
			}
			this.df_el.classList.remove('is-focusing');
			for (const element of this.df_el.querySelectorAll('.is-focused')) {
				element.classList.remove('is-focused');
			}
			this.focusing = false;
		},

		close_panel() {
			this.detail = null;
			this.reset_focus();
		},

		zoom_in() {
			this.editor?.zoom_in();
		},

		zoom_out() {
			this.editor?.zoom_out();
		},

		zoom_reset() {
			this.editor?.zoom_reset();
		},
	};
}

window.asset_graph = asset_graph;
