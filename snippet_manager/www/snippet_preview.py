import frappe
from frappe import _

no_cache = 1

def get_context(context):
    snippet_name = frappe.form_dict.get("snippet")
    frappe.errprint(f"{snippet_name}")
    context.snippet = None

    if snippet_name:
        try:
            # Check if user has permission to read
            if frappe.has_permission("Tailwind Snippet", "read", snippet_name):
                context.snippet = frappe.get_doc("Tailwind Snippet", snippet_name)
                context.title = f"{context.snippet.title} - Preview"
            else:
                context.title = "Permission Denied"
        except frappe.DoesNotExistError:
            context.title = "Snippet Not Found"
        except Exception:
            context.title = "Error"
    else:
        context.title = "Snippet Preview"

    # Disable standard Frappe page elements
    context.show_sidebar = False
    context.add_breadcrumbs = False

    return context
