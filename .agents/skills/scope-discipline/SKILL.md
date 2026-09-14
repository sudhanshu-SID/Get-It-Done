---
name: scope-discipline
description: Strict guidelines to make only minimal necessary changes, avoid speculative features or unnecessary refactoring, and proactively discuss ideas before adding code.
---

# Scope Discipline & Minimal Changes

Follow these principles across all tasks to prevent codebase bloating, architectural clutter, and unintended regressions:

## 1. Minimal Necessary Modifications
- **Strictly Scoped Edits:** Only add, modify, or delete lines of code directly required to fulfill the explicit requirement.
- **No Drive-by Refactoring:** Do not reformat, rename, or restructure unrelated code or files in passing, even if it looks suboptimal, unless explicitly asked.
- **Preserve Existing Comments & Styles:** Maintain existing project patterns, docstrings, and comments unless directly obsoleted by the change.

## 2. Proactive Idea Discussion (Before Coding)
- **Discuss First, Code Second:** If you conceive an idea, optimization, UX improvement, or potential new feature while writing or reading code, **do NOT write the code immediately**.
- **Log the Thought:** Raise the idea in the conversation with the user as a concise proposal with pros, cons, and potential trade-offs.
- **Wait for Alignment:** Only proceed with implementing new ideas or tangential improvements after the user explicitly reviews and agrees to add them to scope.
