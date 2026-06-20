# Copyright (c) 2026, Rl0007 and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Prompt(Document):
	def before_save(self):
		self._snapshot_previous_version()

	def _snapshot_previous_version(self):
		if self.is_new():
			return

		previous = self.get_doc_before_save()
		if not previous:
			return

		old_prompt = (previous.prompt or "").strip()
		new_prompt = (self.prompt or "").strip()

		if not old_prompt or old_prompt == new_prompt:
			return

		snapshot = frappe.new_doc("Prompt Version")
		snapshot.parent_prompt = self.name
		snapshot.content = previous.prompt
		snapshot.insert(ignore_permissions=True)
