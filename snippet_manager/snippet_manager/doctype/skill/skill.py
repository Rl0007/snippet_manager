# Copyright (c) 2026, Rl0007 and contributors
# For license information, please see license.txt

import re

import frappe
from frappe import _
from frappe.model.document import Document

# agentskills.io spec: 1-64 chars, lowercase alphanumerics, single hyphens, no leading/trailing hyphen.
SKILL_NAME_PATTERN = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")


class Skill(Document):
	def validate(self):
		self.slug = slugify_skill_name(self.title)
		if not SKILL_NAME_PATTERN.match(self.slug):
			frappe.throw(_("Title must contain at least one letter or number to form a skill name."))

		if len(self.description or "") > 1024:
			frappe.throw(_("Description must be 1024 characters or fewer (Agent Skills spec)."))

		# Agents pick skills by description alone, so a published skill without one never triggers.
		if self.published and not (self.description or "").strip():
			frappe.throw(_("A published skill needs a description."))


def slugify_skill_name(title):
	slug = re.sub(r"[^a-z0-9]+", "-", (title or "").lower()).strip("-")
	return slug[:64].strip("-")
