"""Agent Skills discovery (Cloudflare RFC, agentskills.io schema 0.2.0).

Serves published skills so any machine can run `npx skills add <site-url>/skills` or fetch a SKILL.md
directly. The `published` checkbox is the only gate: these routes are deliberately guest-readable.

Mounted under /skills, not the site root: frappe/app.py claims every root `/.well-known/*` GET for
its OAuth metadata and raises NotFound before page renderers run. Discovery clients resolve the
well-known path against the source URL, so `<site>/skills` works the same way Mintlify's `/docs` does.
"""

import hashlib
import json
import re

import frappe
from frappe.website.page_renderers.base_renderer import BaseRenderer
from werkzeug.wrappers import Response

# Newer RFC path first; the `skills` CLI and Mintlify still probe the older one.
CATALOG_ROUTE = "skills"
DISCOVERY_PREFIXES = (f"{CATALOG_ROUTE}/.well-known/agent-skills", f"{CATALOG_ROUTE}/.well-known/skills")
INDEX_SCHEMA = "https://schemas.agentskills.io/discovery/0.2.0/schema.json"
SKILL_FIELDS = ["slug", "description", "body"]
FRONTMATTER_PATTERN = re.compile(r"\A---\n.*?\n---\n+", re.DOTALL)


class SkillRegistryPage(BaseRenderer):
	def can_render(self):
		return self.get_prefix() is not None

	def render(self):
		prefix = self.get_prefix()
		remainder = self.path[len(prefix) :].strip("/")

		if remainder in ("", "index.json"):
			return self.make_response(json.dumps(get_skill_index(prefix), indent=1), "application/json")

		slug, _separator, filename = remainder.partition("/")
		if filename == "SKILL.md":
			skill = frappe.db.get_value(
				"Skill", {"slug": slug, **published_filters()}, SKILL_FIELDS, as_dict=True
			)
			if skill:
				return self.make_response(format_skill_md(skill), "text/markdown")

		return self.make_response("Not found", "text/plain", 404)

	def get_prefix(self):
		for prefix in DISCOVERY_PREFIXES:
			if self.path == prefix or self.path.startswith(prefix + "/"):
				return prefix
		return None

	def make_response(self, content, mimetype, status=200):
		response = Response(content, status=status, mimetype=mimetype)
		response.headers["Access-Control-Allow-Origin"] = "*"
		response.headers["Cache-Control"] = "no-cache"
		return response


def published_filters():
	return {"published": 1, "status": ["!=", "Archived"]}


def get_skill_index(prefix):
	skills = frappe.get_all("Skill", filters=published_filters(), fields=SKILL_FIELDS, order_by="slug asc")
	return {
		"$schema": INDEX_SCHEMA,
		"skills": [
			{
				"name": skill.slug,
				"type": "skill-md",
				"description": skill.description,
				"url": f"/{prefix}/{skill.slug}/SKILL.md",
				"digest": "sha256:" + hashlib.sha256(format_skill_md(skill).encode()).hexdigest(),
			}
			for skill in skills
		],
	}


def format_skill_md(skill):
	# Bodies imported from on-disk SKILL.md files may carry their own frontmatter; the doctype is the
	# source of truth for name/description, so drop it rather than emit two blocks.
	body = FRONTMATTER_PATTERN.sub("", (skill.body or "").lstrip())
	# JSON strings are valid YAML scalars, which sidesteps quoting colons/newlines in descriptions.
	description = json.dumps(" ".join((skill.description or "").split()), ensure_ascii=False)
	return f"---\nname: {skill.slug}\ndescription: {description}\n---\n\n{body.rstrip()}\n"
