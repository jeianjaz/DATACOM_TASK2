# Kudos System Specification

## Functional Requirements

### User Stories

1. As an authenticated employee, I can select another active colleague from a directory-backed list.
2. As an authenticated employee, I can write a specific appreciation message of up to 240 characters.
3. As an authenticated employee, I can submit one kudos to a colleague and receive clear success or validation feedback.
4. As an authenticated employee, I can view an organization-visible feed of recently submitted, visible kudos on the main dashboard.
5. As an administrator, I can hide or permanently delete inappropriate kudos messages.
6. As an administrator, I can see the moderation reason and actor for a hidden kudos entry in the audit record.

### Acceptance Criteria

- The recipient must be another active user; the current user cannot give kudos to themselves.
- Recipient selection must use a searchable or selectable list populated from authorized directory data.
- A message is required, trimmed before storage, and limited to 240 characters. Empty, whitespace-only, and over-limit input is rejected without a request being sent.
- Successful submission stores the sender, recipient, message, creation time, and visible status, then places the new entry at the top of the feed.
- The feed displays sender, recipient, message, and relative or localized timestamp, ordered newest first.
- Only visible kudos are returned to standard users. Feed retrieval supports pagination so the dashboard remains responsive as the dataset grows.
- Administrators can hide a kudos without destroying its audit history, or delete it when policy requires permanent removal.
- Hiding a kudos removes it from the employee feed but preserves the original record and moderation audit entry.
- Restoring a hidden kudos makes it visible in the employee feed again.
- Deleting a kudos removes its message from normal application views and records a deletion event in the audit log.
- A moderation reason is required when hiding or deleting a kudos, and only administrators can access moderation actions.
- Duplicate submissions and spam are handled with server-side rate limiting and a configurable duplicate window. Client-side controls must not be treated as authorization.
- A user cannot submit the same normalized message to the same recipient within 24 hours and may submit no more than 10 kudos within one hour.
- All user-generated content is escaped or sanitized on output. Authentication is required for creating kudos; authorization is required for moderation endpoints.
- The experience is usable on mobile, tablet, and desktop widths and provides keyboard-focus states and screen-reader labels.

## Technical Design

### Database Schema

**users**

- `id` UUID, primary key
- `display_name` VARCHAR(120), required
- `email` VARCHAR(255), unique, required
- `role` ENUM(`employee`, `admin`), required
- `is_active` BOOLEAN, default `true`
- `created_at` TIMESTAMP, required

**kudos**

- `id` UUID, primary key
- `sender_id` UUID, required, foreign key to `users.id`
- `recipient_id` UUID, required, foreign key to `users.id`
- `message` VARCHAR(240), required
- `is_visible` BOOLEAN, default `true`
- `moderation_status` ENUM(`visible`, `hidden`, `deleted`), default `visible`
- `moderated_by` UUID, nullable, foreign key to `users.id`
- `moderated_at` TIMESTAMP, nullable
- `reason_for_moderation` VARCHAR(500), nullable
- `created_at` TIMESTAMP, required
- `updated_at` TIMESTAMP, required

Add indexes on `kudos(created_at DESC, is_visible)`, `kudos(recipient_id, created_at DESC)`, and a uniqueness or application-level duplicate check over sender, recipient, and normalized message within the configured duplicate window.

**moderation_audit**

- `id` UUID, primary key
- `kudos_id` UUID, nullable, foreign key to `kudos.id` with `ON DELETE SET NULL`
- `moderator_id` UUID, required, foreign key to `users.id`
- `action` ENUM(`hide`, `restore`, `delete`), required
- `reason` VARCHAR(500), required
- `created_at` TIMESTAMP, required

The audit record remains after a permanent kudos deletion; the nullable foreign key preserves the moderation history without retaining the deleted message.

### API Endpoints

- `GET /api/users?status=active`: authenticated users only; returns selectable colleagues without sensitive fields.
- `GET /api/kudos?limit=20&cursor=`: authenticated users; returns visible kudos newest first with a next cursor.
- `POST /api/kudos`: authenticated users; body `{ recipientId, message }`; validates authorization, length, self-recipient, rate limits, and duplicate policy; returns `201` with the created public kudos.
- `PATCH /api/kudos/:id/moderation`: admin only; body `{ action: "hide" | "restore", reason }`; records moderator and timestamp.
- `DELETE /api/kudos/:id`: admin only; permanently deletes a kudos and writes an audit event.

Expected errors include `400` for invalid input, `401` for unauthenticated requests, `403` for unauthorized moderation, `404` for missing records, `409` for duplicate submissions, and `429` for rate limits.

### Frontend Components

- `Dashboard`: owns page layout and loads the recent feed.
- `KudosComposer`: colleague picker, message input, character count, validation, submit state, and success/error feedback.
- `KudosFeed`: paginated public list with empty, loading, and error states.
- `KudosItem`: accessible presentation of sender, recipient, message, timestamp, and moderation state where appropriate.
- `ModerationControls`: admin-only hide, restore, and delete actions with a required reason.

The current prototype is implemented as a dependency-free browser app in `kudos/`. It uses local storage to make the employee feed and demo admin review mode demonstrable without a backend; production deployment should replace those storage calls with the API contract above and enforce administrator authorization on the server.

### Security, Performance, and Observability

- Derive identity from the authenticated session rather than accepting a sender ID from the client.
- Enforce recipient, length, role, visibility, rate-limit, and duplicate rules on the server.
- Sanitize or contextually escape message content before rendering; use parameterized database queries.
- Use cursor pagination, a bounded initial feed, and an index on visibility plus creation time. Cache the first feed page briefly where appropriate.
- Log creation, moderation, deletion, validation failures, and rate-limit events with request IDs, while excluding message content from routine logs.
- Provide structured error responses and alert on unusual moderation or spam activity.

## Implementation Plan

1. Confirm employee authentication and directory data contracts.
2. Create the users and kudos migrations, indexes, moderation fields, and audit event model.
3. Implement `GET /api/users`, `GET /api/kudos`, and `POST /api/kudos` with validation, sanitization, rate limiting, and duplicate detection.
4. Implement admin moderation and deletion endpoints with authorization and audit logging.
5. Build the composer and public feed with loading, empty, error, responsive, and accessible states.
6. Add unit tests for validation and duplicate detection, API tests for authorization and moderation, and browser tests for submit-to-feed behavior.
7. Add monitoring, run a security review, and deploy behind the existing authenticated employee portal.

### Testing Strategy

Test valid and invalid messages, self-recipient attempts, inactive recipients, duplicate and spam submissions, pagination ordering, hidden-message exclusion, admin-only actions, keyboard navigation, mobile layout, and safe rendering of HTML-like message content.

## Step 2 Review Record

Step 2 requirements and design review completed. The specification was updated to include organization-only feed visibility, explicit moderation status, a persistent moderation audit table, required moderation reasons, hide/restore/delete behavior, and concrete duplicate and spam limits. This specification is ready for approval before Step 3 implementation.
