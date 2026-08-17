# Deployment documentation

Eight documents, in the order you will need them.

| # | Document | When |
|---|---|---|
| 1 | [Production deployment checklist](./01-production-checklist.md) | Master pre-flight. Read first. |
| 2 | [Cloudflare Worker deployment](./02-worker-deployment.md) | Before launch — the contact form depends on it |
| 3 | [GitHub repository initialisation](./03-github-repo-init.md) | First, chronologically |
| 4 | [Domain cutover plan](./04-domain-cutover.md) | Decide before any DNS is touched |
| 5 | [DNS migration checklist](./05-dns-migration.md) | Execution detail for #4 |
| 6 | [Email verification checklist](./06-email-verification.md) | In parallel with #5 |
| 7 | [Launch day runbook](./07-launch-day-runbook.md) | The day itself, timed |
| 8 | [Rollback plan](./08-rollback-plan.md) | Read *before* launching, not during an incident |

---

## Two defects to fix before any deploy

Both were found while writing these documents. Neither is a code problem — both
are configuration that does not yet exist.

### 1 · `SITE_URL` disagrees between local and CI

```
astro.config.mjs   default → https://navadisha.bikashkadayat.com.np
deploy.yml         default → https://navadisha.com.np
```

If the `SITE_URL` repository variable is not set, **CI builds with a different
domain than local**, and every canonical URL, Open Graph tag and sitemap entry
in production points at the wrong host. Setting the repo variable resolves it —
see [#3](./03-github-repo-init.md).

### 2 · `PUBLIC_FORM_ENDPOINT` is never passed to the CI build

The workflow does not set it, so a CI build produces a site where the contact
form is disabled. It fails gracefully — the visitor is told the form is not live
and offered WhatsApp and phone — but **the form will not work in production
until this variable is added to the workflow environment.**

---

## The one-line summary

Nothing is deployed. The directory is not a git repository. The Worker is
written and documented but not live. Everything in these documents is a
first-time setup, not a migration from an existing site.
