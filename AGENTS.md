# Repository Guidelines

## 1. Project Status

This repository is currently a project workspace without a finalized application or research topic.

Do not assume:

* the programming language;
* the application type;
* the framework;
* the database;
* the data source;
* the deployment environment;
* or the final project scope.

The project specification and technology stack will be established before implementation begins.

---

## 2. General Development Principles

Follow these principles for all development work:

* Inspect the repository before modifying files.
* Understand the existing structure before proposing changes.
* Do not implement features before the requirements are sufficiently clear.
* Prefer small, incremental changes over large rewrites.
* Preserve existing functionality unless a change explicitly requires otherwise.
* Do not modify unrelated files.
* Avoid unnecessary dependencies.
* Prefer simple and maintainable solutions over unnecessary complexity.
* Do not fabricate data, results, credentials, APIs, or configuration values.
* Clearly identify assumptions when requirements are incomplete.

---

## 3. Required Development Workflow

For significant tasks, follow this sequence:

1. **Inspect**

   * Examine the repository.
   * Identify relevant files and existing configuration.
   * Check Git status when Git is initialized.

2. **Understand**

   * Determine the current behavior.
   * Identify requirements, constraints, dependencies, and risks.
   * Ask for clarification when a requirement is genuinely ambiguous.

3. **Plan**

   * Propose the implementation approach.
   * Identify files that will be created or modified.
   * Explain important architectural or technical decisions.
   * Do not begin implementation until the plan is sufficiently clear.

4. **Implement**

   * Make focused changes.
   * Follow the project's established conventions.
   * Avoid unrelated refactoring.

5. **Test**

   * Run appropriate tests and validation.
   * Check syntax, imports, build status, and relevant functionality.
   * Add tests for meaningful new behavior.

6. **Review**

   * Inspect the resulting changes.
   * Check for regressions, unnecessary complexity, security problems, and incomplete requirements.
   * Review `git diff` before committing.

7. **Summarize**

   * Explain what changed.
   * Report validation performed.
   * Identify remaining limitations or follow-up tasks.

---

## 4. Project Structure

Use a structure appropriate to the selected technology.

Possible directories include:

```text
src/        Application or library source code
tests/      Automated tests
docs/       Project documentation
assets/     Static resources
data/       Data files when required
scripts/    Utility or automation scripts
app/        Application/UI layer when appropriate
```

Do not create directories merely because they appear in this guideline. Create them when the project actually requires them.

A `README.md` should be created once the project scope and technology stack are established.

---

## 5. Technology and Dependencies

Do not select a technology stack arbitrarily.

Before implementation:

* define the project requirements;
* determine the appropriate language and framework;
* document required runtime versions;
* define dependency management;
* document installation and execution commands.

Avoid adding a dependency when the same functionality can reasonably be implemented using the existing stack.

Do not install packages unless:

* the project requires them;
* the reason is understood;
* and the dependency is appropriate for the project.

---

## 6. Coding Standards

* Follow standard conventions of the selected programming language.
* Use consistent indentation and formatting.
* Use descriptive variable, function, class, and file names.
* Keep functions and modules focused.
* Prefer readable code over unnecessarily clever code.
* Avoid duplicated logic when practical.
* Add comments when they explain non-obvious reasoning, assumptions, or business logic.
* Do not add comments that merely restate obvious code.

Once the technology stack is established, use an appropriate formatter and linter.

---

## 7. Testing

Add automated tests when the project contains meaningful functional behavior.

Tests should:

* verify expected behavior;
* cover important edge cases;
* detect regressions;
* be reproducible.

Do not claim that tests pass unless they have actually been executed.

When adding a test framework, document:

* installation;
* test commands;
* relevant configuration;
* and coverage requirements if applicable.

---

## 8. Data and Research Projects

For projects involving financial, economic, market, academic, or other analytical data:

* Do not fabricate observations or research results.
* Preserve raw data whenever possible.
* Treat raw data as immutable.
* Keep processed data separate from raw data.
* Document important data sources.
* Document transformations and assumptions.
* Clearly distinguish observed data from calculated variables.
* Avoid look-ahead bias and data leakage.
* Use information that would have been available at the relevant point in time when performing historical analysis.
* Clearly document formulas, indicators, model specifications, and methodological assumptions.
* Do not silently change observations to obtain a desired result.
* Make analytical results reproducible whenever reasonably possible.

For financial or investment-related projects, explicitly document:

* data frequency;
* trading/calendar assumptions;
* corporate-action treatment where relevant;
* missing-value treatment;
* transaction-cost assumptions where relevant;
* benchmark definitions;
* and backtesting limitations.

---

## 9. Security and Configuration

Never commit:

* API keys;
* passwords;
* authentication tokens;
* private keys;
* database credentials;
* personal access tokens;
* or other secrets.

Use environment variables or appropriate secret-management mechanisms.

Use `.env.example` or equivalent placeholder configuration when necessary.

Never place real credentials in:

* source code;
* documentation;
* test fixtures;
* notebooks;
* configuration committed to Git.

---

## 10. Git Rules

Before modifying an existing repository:

```text
git status
```

Review existing changes before editing files.

Do not:

* force-push;
* reset or discard user changes;
* delete branches;
* rewrite Git history;
* remove unrelated files;
* or commit generated secrets.

unless explicitly requested.

Keep commits focused.

Use concise imperative commit messages, for example:

```text
Add initial project structure
Implement data acquisition module
Add technical indicator calculations
Fix missing-value handling
Add tests for signal generation
```

Before committing:

```text
git status
git diff
```

Verify that only intended files are included.

---

## 11. Codex Behavior

Codex should not immediately build an entire project from a vague request.

When requirements are incomplete:

1. inspect the repository;
2. identify missing information;
3. propose a plan;
4. wait for confirmation when the decision materially affects architecture or scope;
5. implement incrementally.

For major tasks, provide:

* objective;
* files to be changed;
* implementation approach;
* dependencies;
* testing approach;
* potential risks.

Do not silently make major architectural decisions.

---

## 12. File Modification Rules

Before modifying a file:

* read the relevant content;
* understand its role;
* identify dependencies;
* preserve unrelated functionality.

When creating a file:

* use an appropriate location;
* follow the project's naming conventions;
* avoid duplicate files;
* document important configuration where necessary.

Do not rewrite an entire file when a smaller change is sufficient.

---

## 13. Validation Requirements

After implementation, perform the most relevant validation available.

Depending on the project, this may include:

```text
Syntax validation
Import validation
Unit tests
Integration tests
Linting
Formatting checks
Build checks
Application startup
Manual functional verification
```

Report exactly what was tested.

Do not state that an application is fully working if only part of it has been validated.

---

## 14. Documentation

Important project decisions should be documented when they are likely to affect future development.

Useful documentation may include:

```text
README.md
docs/architecture.md
docs/data_dictionary.md
docs/decisions.md
```

Documentation should explain the project's actual implementation rather than describe an idealized system that does not exist.

---

## 15. Current Project Rule

Until a project topic and specification are defined:

* Do not create application source code.
* Do not install project-specific dependencies.
* Do not select a framework without justification.
* Do not create unnecessary directories.
* Do not generate fake datasets.
* Do not implement features based on assumptions.

The next step should be defining the project specification.

---

## 16. Preferred Project Workflow

The overall development process should follow:

```text
Project Idea
    ↓
Project Specification
    ↓
Requirements
    ↓
System Architecture
    ↓
Development Roadmap
    ↓
Codex Repository Analysis
    ↓
Implementation Plan
    ↓
Human Review
    ↓
Implementation
    ↓
Testing
    ↓
Code Review
    ↓
Git Diff Review
    ↓
Commit
    ↓
Push
```
