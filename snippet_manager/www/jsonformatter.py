import frappe
from frappe import _

from snippet_manager.www.asset_graph import get_asset_version

no_cache = 1


def get_context(context):
	# JSON pasted here is often system output or logs that carry secrets; keep the tool behind login.
	# History never leaves the browser (IndexedDB), so there is no server data boundary to guard.
	if frappe.session.user == "Guest":
		frappe.throw(_("Please log in to use the JSON formatter."), frappe.PermissionError)

	context.no_cache = 1
	context.asset_version = get_asset_version()
	return context
