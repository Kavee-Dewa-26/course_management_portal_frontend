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
  {
    id: "role-requests",
    label: "Role Requests",
    ico: "user-check",
    hint: "Member → student",
    href: "/admin/role-requests",
  },
  { group: "Content" },
  { id: "courses", label: "Courses", ico: "book-open", href: "/admin/courses" },
  { id: "students", label: "Students", ico: "users", href: "/admin/students" },
  { group: "System" },
  { id: "profile", label: "Profile", ico: "user", href: "/admin/profile" },
];

// ---------- V2: Member / Leader / G12 navs ----------

export const MEMBER_NAV: NavItem[] = [
  { group: "Main" },
  { id: "home", label: "Home", ico: "home", href: "/home" },
  { id: "school", label: "Bible School", ico: "book-open", href: "/home" },
  { id: "cells", label: "Cell Groups", ico: "users", href: "/my-cells" },
  { group: "Account" },
  { id: "requests", label: "My Requests", ico: "file-text", href: "/my-requests" },
  { id: "profile", label: "Profile", ico: "user", href: "/profile" },
  { id: "notifications", label: "Notifications", ico: "bell", href: "/notifications" },
];

export const LEADER_NAV: NavItem[] = [
  { group: "Main" },
  { id: "home", label: "Home", ico: "home", href: "/home" },
  { id: "dashboard", label: "Dashboard", ico: "layout-dashboard", href: "/leader/dashboard" },
  { id: "cells", label: "My Cells", ico: "users", href: "/cells" },
  { id: "analytics", label: "Analytics", ico: "bar-chart-3", href: "/leader/analytics" },
  { group: "Account" },
  { id: "profile", label: "Profile", ico: "user", href: "/profile" },
  { id: "notifications", label: "Notifications", ico: "bell", href: "/notifications" },
];

export const G12_NAV: NavItem[] = [
  { group: "Main" },
  { id: "home", label: "Home", ico: "home", href: "/home" },
  { id: "dashboard", label: "Dashboard", ico: "layout-dashboard", href: "/g12/dashboard" },
  { id: "cells", label: "My Cells", ico: "users", href: "/cells" },
  { id: "network", label: "Network", ico: "share-2", href: "/g12/network" },
  { id: "promote", label: "Promote", ico: "user-plus", href: "/g12/promote" },
  { id: "analytics", label: "Analytics", ico: "bar-chart-3", href: "/g12/analytics" },
  { group: "Account" },
  { id: "profile", label: "Profile", ico: "user", href: "/profile" },
  { id: "notifications", label: "Notifications", ico: "bell", href: "/notifications" },
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
