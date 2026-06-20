import os

import frappe

no_cache = 1


def get_context(context):
	# Gate the page so guests never see chrome or fire calls. This guard only protects the page;
	# the data boundary is enforced by the whitelisted endpoints' own permission checks.
	if frappe.session.user == "Guest":
		frappe.throw("Please log in to view the asset graph.", frappe.PermissionError)

	context.no_cache = 1
	context.show_sidebar = False
	context.add_breadcrumbs = False
	context.title = "Asset Graph"
	# Token for the page's POST /api/method calls; this page loads no Frappe JS to provide it.
	context.csrf_token = frappe.sessions.get_csrf_token()
	# Built-asset mtime, appended as ?v= so a rebuilt tailwind.css / asset_graph.js busts the cache.
	context.asset_version = get_asset_version()
	return context


def get_asset_version():
	public = frappe.get_app_path("snippet_manager", "public")
	assets = [("css", "tailwind.css"), ("js", "asset_graph.js")]
	mtimes = [os.path.getmtime(os.path.join(public, *parts)) for parts in assets if os.path.exists(os.path.join(public, *parts))]
	return int(max(mtimes)) if mtimes else 0
