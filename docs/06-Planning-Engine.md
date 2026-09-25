# Milestone 2 — implementation and verification record

Status: In progress. Started 2026-09-25.

## Baseline and screen mapping

The user confirmed Stitch project `9705578657101269064` and the project documents as the design baseline on 2026-09-25.

| Requirement | Screen ID | Implementation coverage |
| --- | --- | --- |
| Task CRUD, assignment, ceremonies, priority, due dates, status, dependencies, reminders | `c259d32691ef4a71965dad84de8a7da6` | Pending |
| All / My / Event / Overdue / Upcoming / Completed, search, filters, cursor pagination | `c259d32691ef4a71965dad84de8a7da6` | Pending |
| Checklist selection, preview, relative dates, assignee, duplicate strategy | `ec6c776e6b0141618944c2e2e5d7a417` | Pending |
| Detail drawer, editable fields, comments, attachments | `66bf8c6ad196400a94bcd53be07fb6b4` | Pending |
| Document list, upload, authorized download, removal | `911e6587db94423e8983bb06085802cc` | Pending |
| Assignment notifications, due/overdue reminders, read state | Workspace notification control | Pending |
| Real counts, completion progress, overdue summary | `3277f1877e0143de89e9ba86fb25c506` | Pending |

## Scope reconciliation

- Explicit user instruction and locked database/API decisions exclude subtasks despite older PRD/system-design references.
- The database/API enums govern: LOW / MEDIUM / HIGH and TODO / IN_PROGRESS / COMPLETED. Design examples such as Urgent and Pending Review do not add enum values.
- R2 private storage is the documented architecture. The design's end-to-end encryption, virus-scan success, AWS cluster, digital signatures and ritual-certification assertions are not verified capabilities and must not be displayed as product facts.
- Vendor/expense links, gallery moderation and later milestones are excluded. Task and event document links are in scope.
- In-app notifications are the required V1 delivery channel; email is optional in the PRD. The task-detail design additionally depicts email reminders, so its delivery behavior must be recorded explicitly.
- Upcoming means incomplete tasks due from now through the next seven days, following the approved task screen's “Upcoming This Week”. Stored timestamps are UTC; forms display local time with a visible timezone label.
- List presentation is required; board/calendar alternatives, folders, rich text, bulk actions and estimated duration are not in the locked API/database contract.
- Pending clarification: visibility of wedding-wide tasks/documents for members restricted to selected events.

## Verification

Automated checks and live provider/infrastructure verification will be recorded separately. Team Management retains its existing In progress status and separate production validation requirements.
