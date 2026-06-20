# Copyright (c) 2026, Rl0007 and contributors
# For license information, please see license.txt

import frappe
from frappe.utils import md_to_html


def node_id(kind, name):
	"""Stable composite id so kinds can't collide (a Skill and an Agent may share a title)."""
	return f"{kind}::{name}"


@frappe.whitelist()
def get_asset_graph():
	"""Return the full provenance/composition graph of AI assets for the frontend.

	Shape: {"nodes": [...], "edges": [...]} — no envelope, throws on error.
	System Manager only data; default get_all permission checks apply.
	"""
	prompts = frappe.get_all("Prompt", fields=["name"])
	skills = frappe.get_all("Skill", fields=["name", "title", "status", "derived_from_prompt"])
	agents = frappe.get_all("Agent", fields=["name", "title", "status", "derived_from_prompt"])
	workflows = frappe.get_all("Workflow", fields=["name", "title", "status"])

	nodes = []
	for prompt in prompts:
		nodes.append({"id": node_id("Prompt", prompt.name), "kind": "Prompt", "label": prompt.name, "status": None})
	for skill in skills:
		nodes.append(
			{"id": node_id("Skill", skill.name), "kind": "Skill", "label": skill.title, "status": skill.status}
		)
	for agent in agents:
		nodes.append(
			{"id": node_id("Agent", agent.name), "kind": "Agent", "label": agent.title, "status": agent.status}
		)
	for workflow in workflows:
		nodes.append(
			{
				"id": node_id("Workflow", workflow.name),
				"kind": "Workflow",
				"label": workflow.title,
				"status": workflow.status,
			}
		)

	edges = []

	# Workflow --composed_of--> Agent (stitch all child rows in one query, then group in Python)
	workflow_agent_rows = frappe.get_all("Workflow Agent", fields=["parent", "agent"])
	for row in workflow_agent_rows:
		if not row.agent:
			continue
		edges.append(
			{
				"from": node_id("Workflow", row.parent),
				"to": node_id("Agent", row.agent),
				"type": "composed_of",
			}
		)

	# Agent --uses_skill--> Skill
	agent_skill_rows = frappe.get_all("Agent Skill", fields=["parent", "skill"])
	for row in agent_skill_rows:
		if not row.skill:
			continue
		edges.append(
			{
				"from": node_id("Agent", row.parent),
				"to": node_id("Skill", row.skill),
				"type": "uses_skill",
			}
		)

	# Agent --derived_from--> Prompt
	for agent in agents:
		if agent.derived_from_prompt:
			edges.append(
				{
					"from": node_id("Agent", agent.name),
					"to": node_id("Prompt", agent.derived_from_prompt),
					"type": "derived_from",
				}
			)

	# Skill --derived_from--> Prompt
	for skill in skills:
		if skill.derived_from_prompt:
			edges.append(
				{
					"from": node_id("Skill", skill.name),
					"to": node_id("Prompt", skill.derived_from_prompt),
					"type": "derived_from",
				}
			)

	return {"nodes": nodes, "edges": edges}


# Per-kind: (content_field, description_field). The content field holds what's actually written inside the asset.
_DETAIL_FIELDS = {
	"Prompt": ("prompt", "type"),
	"Skill": ("body", "description"),
	"Agent": ("system_prompt", "description"),
	"Workflow": ("definition", "description"),
}


@frappe.whitelist()
def get_asset_detail(kind, name):
	"""Return the content and metadata of a single asset for the drill-down side panel.

	`content` is the actual written body (prompt / skill body / system prompt / workflow definition).
	"""
	if kind not in _DETAIL_FIELDS:
		frappe.throw(f"Unknown asset kind: {kind}")

	content_field, description_field = _DETAIL_FIELDS[kind]
	doc = frappe.get_cached_doc(kind, name)
	content = doc.get(content_field)

	# Workflow content is code (shown verbatim in a <pre>); the rest is Markdown rendered
	# server-side so the page needs no client markdown/sanitizer libs. md_to_html sanitizes.
	content_html = None if kind == "Workflow" else md_to_html(content or "")

	return {
		"kind": kind,
		"name": doc.name,
		"title": doc.get("title") or doc.name,
		"status": doc.get("status"),
		"file_path": doc.get("file_path"),
		"description": doc.get(description_field),
		"content": content,
		"content_html": content_html,
		"derived_from_prompt": doc.get("derived_from_prompt"),
	}
