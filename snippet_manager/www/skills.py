import frappe
from frappe.utils import get_url

from snippet_manager.skill_registry import CATALOG_ROUTE, DISCOVERY_PREFIXES, published_filters
from snippet_manager.www.asset_graph import get_asset_version

no_cache = 1


def get_context(context):
	# Guest-readable on purpose: it lists only what the discovery endpoints already expose.
	site_url = get_url()
	skills = frappe.get_all(
		"Skill", filters=published_filters(), fields=["slug", "title", "description"], order_by="slug asc"
	)
	for skill in skills:
		skill.skill_url = f"{site_url}/{DISCOVERY_PREFIXES[0]}/{skill.slug}/SKILL.md"
		skill.claude_prompt = (
			f"Fetch {skill.skill_url} and save it verbatim to ~/.claude/skills/{skill.slug}/SKILL.md"
		)

	context.no_cache = 1
	context.skills = skills
	context.install_all_command = f"npx skills add {site_url}/{CATALOG_ROUTE}"
	context.asset_version = get_asset_version()
	return context
