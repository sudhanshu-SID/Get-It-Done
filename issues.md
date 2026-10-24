# Production Issues & Post-Mortems

This document tracks technical incidents, bugs, root-cause analyses, and architectural solutions encountered in the Get It Done (GID) project.

---

## Issue #001: E11000 Duplicate Key Error on Daily Records (`date_1`)

- **Date Encountered:** October 25, 2026
- **Component Affected:** Backend API (`/api/daily/today`), MongoDB Atlas (`test.dailyrecords`)
- **Error Signature:**
  ```text
  [SYSTEM ERROR] E11000 duplicate key error collection: test.dailyrecords index: date_1 dup key: { date: "2026-10-23" }
  ```

---

### 1. Why Is Unique Data Needed Here in the First Place?

In a habit and task accountability platform, each user must have **exactly one daily record per calendar date**.

#### What happens if there is NO uniqueness?
- **Split-Brain Data:** If a user opens the app in two browser tabs or checks off tasks in rapid succession, two separate daily record rows could be created for the same date.
- **Double-Counting Analytics:** Work sessions and task completions would be divided across different documents, corrupting total work minutes and milestone goals.
- **Broken Streak Calculations:** Streak engines walk backward day-by-day (`today - 1`, `today - 2`). If yesterday has two conflicting records (e.g., one marked `completed` and one marked `partial`), the streak algorithm breaks or resets the user's streak to 0.

#### The Requirement:
Uniqueness is mandatory, but it **must be scoped per user**:
- User A can have a record for `2026-10-23`.
- User B can ALSO have a record for `2026-10-23`.
- But User A cannot have *two* records for `2026-10-23`.

This is achieved via a **compound unique constraint**: `{ userId: 1, date: 1 }`.

---

### 2. The Problem We Faced

#### In Simple Terms:
Imagine a shared calendar notebook in an office:
1. When only one person used the notebook, a strict rule was written on the cover:
   > *"Every page must have a unique date. No two pages can ever have the date '2026-10-23'."*
2. Later, the office grew, and multiple team members were given their own accounts. The team thought each person would have their own pages, and removed the note from the cover.
3. **The Trap:** The filing cabinet (MongoDB) **never threw away the old rule** and kept enforcing it in secret.
4. When Person B logged in and opened the Today page, the system tried to create a page for `2026-10-23`. But Person A had already written on `2026-10-23`. The filing cabinet shouted:
   > *"STOP! Error E11000: A page for '2026-10-23' already exists! Duplicate rejected!"*

#### In Technical Terms:
1. **Legacy Index Creation:** In early single-tenant versions of the app, `DailyRecord.js` defined:
   ```javascript
   DailyRecordSchema.index({ date: 1 }, { unique: true });
   ```
   MongoDB Atlas created a persistent unique B-tree index named **`date_1`** in the `dailyrecords` collection.
2. **Catalog Drift:** When multi-tenant isolation was introduced, `userId` was added and that schema line was removed from the code. However, **Mongoose never deletes existing indexes from a live MongoDB collection**. The database continued to enforce collection-wide date uniqueness.
3. **The Trigger:** Visiting the "Today" dashboard calls `/api/daily/today`, which runs:
   ```javascript
   await dailyService.evaluatePastDays(7, req.userId);
   ```
   This routine inspects the past 7 days (`2026-10-24`, `2026-10-23`, etc.) to backfill unrecorded days.
4. When evaluating `2026-10-23`, the query `{ userId: req.userId, date: '2026-10-23' }` returned `null` for the current user. The service then called `new DailyRecord(...).save()`.
5. Because a document with `date: "2026-10-23"` already existed in MongoDB (from another user account or pre-auth legacy history), MongoDB rejected the insertion with `E11000 duplicate key error on index: date_1`.

---

### 3. How We Solved the Issue

#### In Simple Terms:
1. We went straight into the database and deleted the outdated global rule (`date_1`). No user data was lost (all 85 historical records were kept 100% safe).
2. We replaced it with the proper rule: uniqueness is now enforced on **User + Date together**.
3. We added a safety net in the server code so that even if two actions happen at the exact same millisecond, the app handles it smoothly without crashing.

#### In Technical Terms:
1. **Database Index Migration:**
   - Inspected active indexes and dropped the obsolete single-key unique index:
     ```javascript
     await mongoose.connection.collection('dailyrecords').dropIndex('date_1');
     ```
   - Created the compound unique index in MongoDB Atlas:
     ```javascript
     await mongoose.connection.collection('dailyrecords').createIndex(
       { userId: 1, date: 1 },
       { unique: true }
     );
     ```
2. **Schema Declaration (`backend/models/DailyRecord.js`):**
   - Registered the compound index directly on the schema:
     ```javascript
     DailyRecordSchema.index({ userId: 1, date: 1 }, { unique: true });
     ```
3. **Self-Healing Server Startup (`backend/server.js`):**
   - Added an automatic check inside the MongoDB connection handler to detect and drop `date_1` if it is ever encountered on new environments (like Render deployments):
     ```javascript
     mongoose.connect(process.env.MONGO_URI).then(async () => {
       try {
         const col = mongoose.connection.collection('dailyrecords');
         const idxs = await col.indexes();
         if (idxs.some(i => i.name === 'date_1')) {
           await col.dropIndex('date_1');
           console.log('Cleaned up legacy unique index "date_1"');
         }
       } catch (_) {}
     });
     ```
4. **Idempotent Error Recovery (`backend/services/dailyService.js`):**
   - Wrapped `record.save()` in `createTodayRecord` and `evaluatePastDays` with a `try / catch` for MongoServerError code `11000`. If a concurrent request creates the record during evaluation, the service fetches and returns the existing record instead of throwing a 500 error.

---

### 4. Verification

- Tested simultaneous record creation for two distinct user IDs on the exact same date (`2026-10-23`): **Passed**.
- Verified database count: **All 85 historical records preserved with zero data corruption**.

---

### 5. Key Engineering Lessons

1. **Application Code vs. Database State:** Removing constraints in Mongoose or ORM schemas does not alter live database catalogs. Always plan index cleanup migrations when evolving data models.
2. **Multi-Tenant Index Scoping:** In multi-tenant systems, natural keys (like dates, order numbers, slugs) should virtually never be globally unique. Always prefix with a tenant identifier (`userId` or `organizationId`).
3. **Idempotent Background Jobs:** Any routine that runs automatically on page load or on a cron timer should expect concurrent executions and handle unique constraint collisions idempotently.
