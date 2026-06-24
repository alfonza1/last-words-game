# Repository Working Agreement

## Commit frequently

Treat this as standing authorization to create local Git commits while implementing
requested changes in this repository.

- Commit after each coherent, working increment: a feature slice, bug fix, refactor,
  test addition, or meaningful documentation/configuration change.
- For larger tasks, prefer several small logical commits over one final bulk commit.
- Before committing, review `git status` and the relevant diff, then run targeted
  validation appropriate to the change.
- Stage explicit paths. Never include unrelated or pre-existing user changes.
- Use concise, scoped commit messages consistent with the repository history, such as
  `client: add wave speed scaling` or `server: reject duplicate usernames`.
- Do not commit secrets, generated outputs, dependency directories, or knowingly
  broken code unless the user explicitly requests a checkpoint commit.
- Do not commit directly to `main`; create or use a feature branch.
- Do not push commits or open a pull request unless the user explicitly asks.
