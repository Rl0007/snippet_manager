# Copyright (c) 2026, Rl0007 and Contributors
# See license.txt

import frappe
from frappe.tests import IntegrationTestCase

from snippet_manager.api import get_asset_graph, node_id


class IntegrationTestAgent(IntegrationTestCase):
	def test_agent_creation_with_skill_and_prompt(self):
		prompt = frappe.new_doc("Prompt")
		prompt.name = "Test Agent Prompt"
		prompt.prompt = "manifest the agent <here>"
		prompt.insert()
		self.addCleanup(frappe.delete_doc, "Prompt", prompt.name, force=1)

		skill = frappe.new_doc("Skill")
		skill.title = "Test Agent Skill"
		skill.body = "skill body"
		skill.insert()
		self.addCleanup(frappe.delete_doc, "Skill", skill.name, force=1)

		agent = frappe.new_doc("Agent")
		agent.title = "Test Agent"
		agent.derived_from_prompt = prompt.name
		agent.system_prompt = "you are <agent>"
		agent.append("related_skills", {"skill": skill.name})
		agent.insert()
		self.addCleanup(frappe.delete_doc, "Agent", agent.name, force=1)

		self.assertEqual(agent.name, "Test Agent")
		self.assertEqual(agent.related_skills[0].skill, skill.name)

		graph = get_asset_graph()
		edges = {(edge["from"], edge["to"], edge["type"]) for edge in graph["edges"]}
		self.assertIn(
			(node_id("Agent", agent.name), node_id("Skill", skill.name), "uses_skill"), edges
		)
		self.assertIn(
			(node_id("Agent", agent.name), node_id("Prompt", prompt.name), "derived_from"), edges
		)
