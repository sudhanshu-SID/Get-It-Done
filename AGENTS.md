## Agent skills

### Issue tracker

GitHub issues using the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default triage labels (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repository. See `docs/agents/domain.md`.

### Git Commit Guidelines

- Always write natural, human-developer commit messages matching the established project convention (`feat:`, `fix:`, `perf:`, `docs:`, `refactor:`).
- Keep commit messages concise, descriptive, and written in standard developer voice.
- Never add AI signatures, bot tags, or `Co-authored-by:` bot trailers to commit messages.
- Maintain consistent commit styling so the git log reads as a single individual developer.

### Collaborative Development & Edge Case Protocol

- Before modifying code or running mutating commands, always discuss the proposed plan and explain what needs to be changed and why.
- Explicitly list and highlight potential edge cases upfront (e.g. data desync, race conditions, partial failures, cascading deletes, user typos, backwards compatibility) to build shared intuition.
- Wait for user alignment on the approach before touching any code.
