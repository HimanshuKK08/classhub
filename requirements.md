# Requirements: Classroom + Plagiarism Checker Platform

A self-hosted classroom platform built on real git, with a custom C++ similarity-detection engine. Teachers create classrooms and assignments, students submit via `git push`, and similarity reports are generated in the background after the deadline.

**Status:** v1 requirements, finalized. Items marked **[OPEN]** still need a decision.

---

## 1. Scope

### In scope (v1)
- Classrooms and assignments (multiple per teacher)
- Starter-code templates for assignments
- Submission via `git push` only (real git over smart HTTP)
- Hard server-side deadline enforcement
- Background plagiarism/similarity checking with a C++ engine
- Similarity reports (percentage + matching line ranges), visible to teachers only
- Student and teacher profile views
- Shareable invite links

### Out of scope (v1)
- Submission rules/validation (required files, allowed types, size limits per assignment)
- Website file upload (the web UI is for viewing and management, not for submitting)
- AST-level or semantic comparison (e.g. loop to recursion rewrites)
- Teacher-granted deadline extensions (possible later)
- Per-student teacher approval of joins (possible later)

---

## 2. Roles

| Role | Can do |
|---|---|
| **Teacher** | Create classrooms and assignments, upload template repos, share invite links, view all submissions in their classrooms, trigger/view plagiarism reports |
| **Student** | Join classrooms via invite link, accept assignments, push to their own repo, view their own submissions and history |

Students must never see other students' repos or any similarity report.

---

## 3. Functional Requirements

### 3.1 Accounts and authentication
- **FR-1.** Users can sign up and log in (as teacher or student).
- **FR-2.** Browser sessions use JWT (or session) authentication.
- **FR-3.** Users can create, list, and revoke **personal access tokens** in the UI. Terminal `git` operations authenticate with these tokens, since a browser session cannot authenticate `git push`.

### 3.2 Classrooms
- **FR-4.** A teacher can create multiple classrooms.
- **FR-5.** Each classroom has a unique invite code and a shareable link.
- **FR-6.** A student gains access to a classroom by opening the invite link and joining. Only joined students may accept assignments or push in that classroom. **[OPEN: confirm join-by-link with no teacher approval for v1]**
- **FR-7.** A teacher can view the member list and remove a student.

### 3.3 Assignments
- **FR-8.** A teacher can create multiple assignments per classroom with title, instructions, due date, and a template repo.
- **FR-9.** The template is **starter code** only. The teacher uploads it as a repo (via push or initial upload).
- **FR-10.** Each assignment has a shareable link that takes a student to the accept page (after login and classroom membership check).
- **FR-11.** The teacher's dashboard lists all classrooms and assignments with submission counts and report status.

### 3.4 Accepting an assignment
- **FR-12.** When a student accepts an assignment, the backend creates a new **private bare git repo** for that student, seeded from the template, and links it through a `Submission` record.
- **FR-13.** A student can accept each assignment at most once.
- **FR-14.** After accepting, the UI shows the clone URL and instructions for using a token.

### 3.5 Submitting (git push)
- **FR-15.** Submission is done only with standard `git push` from the terminal, served by `git-http-backend` over smart HTTP.
- **FR-16.** A student can push only to their own repo.
- **FR-17.** Clone/fetch is allowed for the repo owner and for the classroom's teacher. No one else.
- **FR-18.** The website lets users browse files, commits, and diffs of a repo they are allowed to see (read-only).
- **FR-19.** A student's profile shows their submissions overall (classes, assignments, last push time, status).

### 3.6 Deadline enforcement
- **FR-20.** Deadlines are judged by **server time**, never client time.
- **FR-21.** Once the deadline passes, all pushes are rejected, whether new or in progress. There is no grace period in v1.
- **FR-22.** Enforcement is done in a `pre-receive` hook (accurate: runs after data arrives, before refs update), or in Express before handing off to `git-http-backend`. The final design choice is documented in DESIGN.md.
- **FR-23.** Clone and fetch remain allowed after the deadline.
- **FR-24.** After the deadline the repo HEAD is the final submission. The plagiarism job reads HEAD, with no snapshot logic needed since the repo is frozen.

### 3.7 Plagiarism / similarity checking
- **FR-25.** A job is enqueued automatically when an assignment's deadline passes, and a teacher can also trigger it manually.
- **FR-26.** Jobs run in the background (Redis + BullMQ). The front end never waits on them, and they do not run while submissions are still open.
- **FR-27.** The C++ engine compares every pair of submissions for an assignment and returns results to the Node service.
- **FR-28.** Job status is visible to teachers: `pending`, `running`, `done`, `failed`. Failed jobs retry a limited number of times with backoff.
- **FR-29.** Results are written to each `Submission` as a similarity report.
- **FR-30.** The report shows, per pair: similarity percentage and the **matching line ranges in both files**, highlighted in the UI.
- **FR-31.** The teacher's report view lists submissions sorted by highest similarity and lets the teacher open a side-by-side comparison.

---

## 4. Plagiarism Engine Specification

### 4.1 Technique
1. **Tokenize** the source, discarding comments and whitespace.
2. **Normalize identifiers**: replace each variable/function name with a placeholder (`VAR`, `VAR2`, ...) by order of first appearance.
3. **Fingerprint** with rolling hashes over token windows (Rabin-Karp with winnowing).
4. **Match** fingerprints between files and map matches back to original line ranges.
5. **Report** a percentage and the matching regions.

### 4.2 Accuracy criteria (testable)
The engine is considered accurate when:

| # | Criterion |
|---|---|
| A-1 | Renaming variables/functions does not change the result |
| A-2 | Adding, removing, or editing comments does not change the result |
| A-3 | Changing whitespace or formatting (brace style, line breaks) does not change the result |
| A-4 | Reordering functions or blocks still matches, since matching is per chunk |
| A-5 | Partial copying is detected and reported as a partial match |
| A-6 | **Starter/template code is excluded**, so two students who both kept it are not flagged |
| A-7 | Very short matches (includes, closing braces, boilerplate) are ignored via a minimum match length |
| A-8 | Output includes a percentage and matching line ranges for both files |
| A-9 | Unrelated files score near 0% |

### 4.3 Percentage definition
- Similarity of A to B = share of A's tokens (after template exclusion) covered by matches in B.
- This is **directional**, so A to B and B to A can differ. Show both, or the higher of the two. **[OPEN: pick one]**

### 4.4 Test corpus (required)
Build and keep a small test set in the repo:
- an original file
- a renamed-variables copy
- a comment-padded copy
- a reformatted copy
- a reordered-functions copy
- a partial copy
- an unrelated file
- two files that differ only by shared starter code

### 4.5 Known and accepted limitations
- Does not catch full logical rewrites or control-flow translations (loop to recursion). This is by design, since that represents independent effort.
- Scoped to reasonable repo/file sizes in v1.

### 4.6 Languages
- **[OPEN]** Tokenizing is language-specific. Suggested for v1: **C++ and Python** (or one of them to start). Unsupported file types are skipped.

---

## 5. Non-Functional Requirements

### 5.1 Authentication and authorization
- **NFR-1.** All classroom, assignment, and submission endpoints require authentication.
- **NFR-2.** Authorization rules are enforced server-side on every request, including git operations:
  - A student can read and write only their own submission.
  - A student cannot read other students' repos or any similarity report.
  - Only the classroom's teacher can create assignments, view all submissions, and view reports.
  - Only joined students can accept assignments in a classroom.
- **NFR-3.** Tokens used for git are stored hashed, can be revoked, and are never shown again after creation.

### 5.2 Consistency
- **NFR-4.** One student's submission can never be mixed with or overwrite another's. Each repo maps to exactly one (student, assignment) pair. Enforced by authorization checks and unique constraints on `Submission(studentId, assignmentId)`.
- **NFR-5.** The bare repo is the single source of truth for code. MongoDB stores metadata only, never code.

### 5.3 Security
- **NFR-6.** Never build shell commands from user input. Use argument arrays (`execFile`/`simple-git`), not shell strings.
- **NFR-7.** Sanitize and validate all inputs that reach git commands (names, refs, paths).
- **NFR-8.** Protect against path traversal: repo paths are derived from server-generated IDs, never from user-supplied strings.
- **NFR-9.** Passwords are hashed (bcrypt/argon2), and rate limiting applies to login and token endpoints.

### 5.4 Limits and reliability
- **NFR-10.** Maximum push size and per-user rate limiting on pushes (Redis).
- **NFR-11.** The plagiarism job never blocks the API.
- **NFR-12.** A failed or retried job does not corrupt submission state. Report writes are atomic per submission, and rerunning a job replaces prior results.
- **NFR-13.** Deadline checks are based on server clock only.

### 5.5 Usability
- **NFR-14.** The UI is simple and clear for both teachers and students: obvious next steps, copyable clone commands, readable report view.

### 5.6 Maintainability
- **NFR-15.** A `DESIGN.md` is maintained throughout, recording each major decision and its reasoning (bare repos, hooks vs. Express checks, why Mongo, why C++, etc.).

---

## 6. Tech Stack (summary)

| Layer | Choice |
|---|---|
| Frontend | React, Monaco Editor (viewing), react-markdown |
| Backend | Node.js + Express |
| Database | MongoDB (metadata only) |
| Git | Real git CLI, `git-http-backend` mounted in Express |
| Queue / limits | Redis, BullMQ |
| Plagiarism engine | C++ service (HTTP API or child process) |
| Storage | Bare repos on server filesystem, one per student per assignment |

---

## 7. Core Flow

1. Teacher creates a classroom and shares the invite link.
2. Student opens the link, logs in, and joins the classroom.
3. Teacher creates an assignment and uploads a template repo.
4. Student accepts the assignment, and a private bare repo is created from the template.
5. Student creates a personal access token and clones the repo.
6. Student works locally and runs `git push` until the deadline. The server rejects pushes after it.
7. At the deadline a background job runs the C++ engine over all submissions (excluding template code).
8. Reports are saved to each submission and shown to the teacher.

---

## 8. Open Decisions

| # | Decision | Suggestion |
|---|---|---|
| 1 | Languages supported in v1 | C++ and Python, or one to start |
| 2 | Join flow | Join by invite link, no per-student approval |
| 3 | Similarity percentage direction | Show both directions, or the higher one |
| 4 | Deadline enforcement point | `pre-receive` hook (document the choice in DESIGN.md) |

---

## 9. Build Order (suggested)

1. Bare repo creation + `git-http-backend` wiring + token auth, validated from the terminal (riskiest piece)
2. Data model (Mongo schemas), drafted by you
3. Auth, classrooms, assignments, accept flow
4. Deadline enforcement
5. C++ engine on the test corpus, standalone first
6. Queue integration and report storage
7. UI: dashboards, file browser, report view