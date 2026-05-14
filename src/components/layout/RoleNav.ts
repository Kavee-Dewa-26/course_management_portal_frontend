export interface NavGroup {
  group: string;
}

export interface NavLink {
  id: string;
  label: string;
  ico: string;
  count?: number;
  hint?: string;
  href: string;
}

export type NavItem = NavGroup | NavLink;

export const isLink = (it: NavItem): it is NavLink => "id" in it;

export const STUDENT_NAV: NavItem[] = [
  { group: "Main" },
  { id: "dashboard", label: "Dashboard", ico: "layout-dashboard", href: "/dashboard" },
  { id: "courses", label: "My Courses", ico: "book-open", href: "/my-courses" },
  { id: "browse", label: "Browse Courses", ico: "search", href: "/browse-courses" },
  { id: "profile", label: "Profile", ico: "user", href: "/profile" },
  { group: "Account" },
  { id: "notifications", label: "Notifications", ico: "bell", href: "/notifications" },
];

export const ADMIN_NAV: NavItem[] = [
  { group: "Approvals" },
  { id: "dashboard", label: "Dashboard", ico: "layout-dashboard", href: "/admin/dashboard" },
  {
    id: "registrations",
    label: "Registrations",
    ico: "user-plus",
    count: 8,
    hint: "New sign-ups",
    href: "/admin/registrations",
  },
  {
    id: "enrollments",
    label: "Enrollments",
    ico: "clipboard-list",
    count: 6,
    hint: "Course access",
    href: "/admin/enrollments",
  },
  { group: "Content" },
  { id: "courses", label: "Courses", ico: "book-open", href: "/admin/courses" },
  { id: "students", label: "Students", ico: "users", href: "/admin/students" },
  { group: "System" },
  { id: "profile", label: "Profile", ico: "user", href: "/admin/profile" },
];

export const SUPERADMIN_NAV: NavItem[] = [
  { group: "Platform" },
  { id: "dashboard", label: "Dashboard", ico: "layout-dashboard", href: "/super-admin/dashboard" },
  {
    id: "admins",
    label: "Administrators",
    ico: "shield-check",
    count: 2,
    hint: "Pending invites",
    href: "/super-admin/admins",
  },
  { group: "Approvals" },
  {
    id: "registrations",
    label: "Registrations",
    ico: "user-plus",
    count: 8,
    href: "/super-admin/registrations",
  },
  {
    id: "enrollments",
    label: "Enrollments",
    ico: "clipboard-list",
    count: 6,
    href: "/super-admin/enrollments",
  },
  { group: "Content" },
  { id: "courses", label: "Courses", ico: "book-open", href: "/super-admin/courses" },
  { id: "students", label: "Students", ico: "users", href: "/super-admin/students" },
  { group: "System" },
  { id: "profile", label: "Profile", ico: "user", href: "/super-admin/profile" },
  { id: "audit", label: "Audit Log", ico: "history", href: "/super-admin/audit-log" },
];
