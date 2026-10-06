// Sections covered by a site backup, shared by the backup API and the
// /admin/backup page (kept free of server imports so the page can use it).
//
// Parents come before children: restore inserts in this order and deletes in
// reverse (InfoSubmissionImage references InfoSubmission).
export const BACKUP_TABLES = [
  { model: "Page", label: "Pages", restoreByDefault: true },
  { model: "MenuItem", label: "Menus", restoreByDefault: true },
  { model: "News", label: "News & Announcements", restoreByDefault: true },
  { model: "Slide", label: "Homepage Slider", restoreByDefault: true },
  { model: "Faq", label: "FAQs", restoreByDefault: true },
  { model: "Department", label: "Departments", restoreByDefault: true },
  { model: "ContactSubmission", label: "Contact Inquiries", restoreByDefault: true },
  { model: "InfoSubmission", label: "Info Submissions", restoreByDefault: true },
  { model: "InfoSubmissionImage", label: "Info Submission Images", restoreByDefault: true },
  // Opt-in so restoring content never silently rolls back passwords or
  // admin accounts.
  { model: "User", label: "Users & Sub-Admins", restoreByDefault: false },
] as const;

export type BackupModel = (typeof BACKUP_TABLES)[number]["model"];
