# Contributing to Noninvasive Disease Risk Predictor

Thanks for checking out this project. This repository is maintained with a portfolio-quality workflow: small changes, clear commits, readable documentation, and practical review notes.

## Contribution Principles

- Keep changes focused and easy to review.
- Prefer clarity over cleverness.
- Update documentation when behavior, setup, or architecture changes.
- Avoid committing secrets, generated credentials, personal tokens, or private environment files.
- Include screenshots, terminal output, or test notes for UI/behavior changes.

## Recommended Workflow

```bash
# 1. Create a focused branch
git checkout -b docs/improve-project-notes

# 2. Make the change
# edit files

# 3. Review locally
git status
git diff --check

# 4. Commit with a meaningful message
git add .
git commit -m "docs: improve project documentation"

# 5. Push and open a pull request
git push origin HEAD
```

## Commit Style

Use concise, meaningful commit messages:

- `docs: update architecture notes`
- `feat: add transaction filter`
- `fix: handle empty input state`
- `refactor: simplify service layer`
- `test: add workflow coverage`

## Pull Request Checklist

Before opening a PR, confirm:

- [ ] The change has one clear purpose.
- [ ] README/docs were updated when needed.
- [ ] No secrets or local-only files were committed.
- [ ] Screenshots/test notes are included for visible changes.
- [ ] The project still runs or the limitation is clearly documented.

## Documentation Standard

This portfolio uses a consistent documentation layer:

- `README.md` for first impression and high-level overview.
- `docs/ARCHITECTURE.md` for structure and system thinking.
- `docs/CASE_STUDY.md` for product story and decisions.
- `docs/ROADMAP.md` for future improvements.
- `.github/` templates for professional issue and PR handling.
