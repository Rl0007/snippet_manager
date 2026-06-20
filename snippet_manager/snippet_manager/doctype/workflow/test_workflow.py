# Copyright (c) 2026, Rl0007 and Contributors
# See license.txt

import frappe
from frappe.tests import IntegrationTestCase

from snippet_manager.api import get_asset_graph, node_id


class IntegrationTestWorkflow(IntegrationTestCase):
	def test_workflow_creation_with_agent(self):
		agent = frappe.new_doc("Agent")
		agent.title = "Test Workflow Agent"
		agent.system_prompt = "you are <agent>"
		agent.insert()
		self.addCleanup(frappe.delete_doc, "Agent", agent.name, force=1)

		workflow = frappe.new_doc("Workflow")
		workflow.title = "Test Workflow"
		workflow.definition = "print('hi')"
		workflow.append("agents", {"agent": agent.name})
		workflow.insert()
		self.addCleanup(frappe.delete_doc, "Workflow", workflow.name, force=1)

		self.assertEqual(workflow.name, "Test Workflow")
		self.assertEqual(workflow.agents[0].agent, agent.name)

		graph = get_asset_graph()
		edges = {(edge["from"], edge["to"], edge["type"]) for edge in graph["edges"]}
		self.assertIn(
			(node_id("Workflow", workflow.name), node_id("Agent", agent.name), "composed_of"), edges
		)

		node_ids = {node["id"] for node in graph["nodes"]}
		self.assertIn(node_id("Workflow", workflow.name), node_ids)
		self.assertIn(node_id("Agent", agent.name), node_ids)
