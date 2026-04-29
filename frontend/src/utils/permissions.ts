export function normalizeRole(role?: string | null) {
    return (role || "").replace(/\s+/g, "").trim().toLowerCase();
}

export function isAdmin(role?: string | null) {
    return normalizeRole(role) === "admin";
}

export function isTeamLeader(role?: string | null) {
    return normalizeRole(role) === "teamleader";
}

export function isMember(role?: string | null) {
    return normalizeRole(role) === "member";
}

export function isAdminOrLeader(role?: string | null) {
    const normalized = normalizeRole(role);
    return normalized === "admin" || normalized === "teamleader";
}