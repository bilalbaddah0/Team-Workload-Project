const TOKEN_KEY = "token";
const USER_ID_KEY = "userId";
const FULL_NAME_KEY = "fullName";
const EMAIL_KEY = "email";
const ROLE_KEY = "role";

export function saveAuth(data: {
    token: string;
    userId: number;
    fullName: string;
    email: string;
    role: string;
}) {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_ID_KEY, String(data.userId));
    localStorage.setItem(FULL_NAME_KEY, data.fullName);
    localStorage.setItem(EMAIL_KEY, data.email);
    localStorage.setItem(ROLE_KEY, data.role);
}

export function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(FULL_NAME_KEY);
    localStorage.removeItem(EMAIL_KEY);
    localStorage.removeItem(ROLE_KEY);
}

export function getToken() {
    return localStorage.getItem(TOKEN_KEY) || "";
}

export function getUserId() {
    return localStorage.getItem(USER_ID_KEY) || "";
}

export function getFullName() {
    return localStorage.getItem(FULL_NAME_KEY) || "";
}

export function getEmail() {
    return localStorage.getItem(EMAIL_KEY) || "";
}

export function getRole() {
    return localStorage.getItem(ROLE_KEY) || "";
}