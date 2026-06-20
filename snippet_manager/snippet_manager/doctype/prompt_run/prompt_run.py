# Copyright (c) 2026, Rl0007 and contributors
# For license information, please see license.txt

from frappe.model.document import Document


class PromptRun(Document):
	def before_save(self):
		if not self.title:
			body_preview = (self.body or "").strip().splitlines()[0:1]
			snippet = body_preview[0][:60] if body_preview else self.kind
			self.title = f"{self.parent_prompt}: {snippet}".strip(": ")
