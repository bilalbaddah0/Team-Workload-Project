import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    createUser,
    deleteUser,
    getAllUsers,
    updateUser,
    type CreateUserPayload,
    type UserResponseDto,
} from "../api/usersApi";
import { getAllTeams } from "../api/teamsApi";
import "./AdminUsersPage.css";

function mapRoleLabel(value?: number | string) {
    if (typeof value === "string") return value;

    switch (Number(value)) {
        case 0:
            return "Admin";
        case 1:
            return "TeamLeader";
        case 2:
            return "Member";
        default:
            return "-";
    }
}

export default function AdminUsersPage() {
    const navigate = useNavigate();

    const [users, setUsers] = useState<UserResponseDto[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [editingUserId, setEditingUserId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        role: 2,
        teamId: "",
        isActive: true,
    });

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");

            const [usersData, teamsData] = await Promise.all([getAllUsers(), getAllTeams()]);
            setUsers(usersData);
            setTeams(teamsData);
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.response?.data ||
                "Failed to load users.";

            setError(typeof message === "string" ? message : "Failed to load users.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const resetForm = () => {
        setEditingUserId(null);
        setFormData({
            fullName: "",
            email: "",
            password: "",
            role: 2,
            teamId: "",
            isActive: true,
        });
        setError("");
        setSuccess("");
    };

    const handleSubmit = async () => {
        if (!formData.fullName.trim() || !formData.email.trim()) {
            setError("Full name and email are required.");
            return;
        }

        if (!editingUserId && !formData.password.trim()) {
            setError("Password is required when creating a user.");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            if (editingUserId) {
                const payload = {
                    fullName: formData.fullName.trim(),
                    email: formData.email.trim(),
                    role: Number(formData.role),
                    teamId: formData.teamId ? Number(formData.teamId) : null,
                    isActive: formData.isActive,
                };

                await updateUser(editingUserId, payload as any);
                setSuccess("User updated successfully.");
            } else {
                const payload: CreateUserPayload = {
                    fullName: formData.fullName.trim(),
                    email: formData.email.trim(),
                    password: formData.password,
                    role: Number(formData.role),
                    teamId: formData.teamId ? Number(formData.teamId) : null,
                };

                await createUser(payload);
                setSuccess("User created successfully.");
            }

            resetForm();
            await loadData();
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.response?.data ||
                "Failed to save user.";

            setError(typeof message === "string" ? message : "Failed to save user.");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (user: UserResponseDto) => {
        setEditingUserId(user.id);
        setFormData({
            fullName: user.fullName || "",
            email: user.email || "",
            password: "",
            role: Number(user.role),
            teamId: user.teamId ? String(user.teamId) : "",
            isActive: user.isActive,
        });
        setError("");
        setSuccess("");
    };

    const handleDelete = async (id: number) => {
        try {
            setError("");
            setSuccess("");

            const result = await deleteUser(id);

            if (typeof result === "string") {
                setSuccess(result);
            } else {
                setSuccess("User removed or deactivated successfully.");
            }

            await loadData();
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.response?.data ||
                "Failed to delete user.";

            setError(typeof message === "string" ? message : "Failed to delete user.");
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-shell">
                <div className="admin-header">
                    <div>
                        <p className="admin-eyebrow">Admin Panel</p>
                        <h1>Manage Users</h1>
                        <p className="admin-subtitle">
                            Create users, assign roles, and place users into teams
                        </p>
                    </div>

                    <button className="admin-back-btn" onClick={() => navigate("/dashboard")}>
                        Back
                    </button>
                </div>

                {error && <div className="admin-alert error">{error}</div>}
                {success && <div className="admin-alert success">{success}</div>}

                <div className="admin-grid">
                    <div className="admin-card">
                        <h2>{editingUserId ? "Edit User" : "Create User"}</h2>

                        <div className="admin-form-grid">
                            <div className="admin-field">
                                <label>Full Name</label>
                                <input
                                    value={formData.fullName}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            fullName: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="admin-field">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            email: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            {!editingUserId && (
                                <div className="admin-field">
                                    <label>Password</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                password: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                            )}

                            <div className="admin-field">
                                <label>Role</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            role: Number(e.target.value),
                                        }))
                                    }
                                >
                                    <option value={0}>Admin</option>
                                    <option value={1}>Team Leader</option>
                                    <option value={2}>Member</option>
                                </select>
                            </div>

                            <div className="admin-field">
                                <label>Team</label>
                                <select
                                    value={formData.teamId}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            teamId: e.target.value,
                                        }))
                                    }
                                >
                                    <option value="">No Team</option>
                                    {teams.map((team) => (
                                        <option key={team.id} value={team.id}>
                                            {team.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {editingUserId && (
                                <div className="admin-field">
                                    <label>Status</label>
                                    <select
                                        value={formData.isActive ? "true" : "false"}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                isActive: e.target.value === "true",
                                            }))
                                        }
                                    >
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="admin-actions">
                            <button
                                className="admin-primary-btn"
                                onClick={handleSubmit}
                                disabled={saving}
                            >
                                {saving
                                    ? editingUserId
                                        ? "Updating..."
                                        : "Creating..."
                                    : editingUserId
                                        ? "Update User"
                                        : "Create User"}
                            </button>

                            {editingUserId && (
                                <button className="admin-secondary-btn" onClick={resetForm}>
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="admin-card">
                        <h2>Users</h2>

                        {loading ? (
                            <p>Loading users...</p>
                        ) : (
                            <div className="admin-table-wrap">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Role</th>
                                            <th>Team</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr key={user.id}>
                                                <td>{user.fullName}</td>
                                                <td>{user.email}</td>
                                                <td>{mapRoleLabel(user.role)}</td>
                                                <td>{user.teamId ?? "-"}</td>
                                                <td>{user.isActive ? "Active" : "Inactive"}</td>
                                                <td>
                                                    <div className="admin-table-actions">
                                                        <button
                                                            className="admin-small-btn"
                                                            onClick={() => handleEdit(user)}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            className="admin-small-btn danger"
                                                            onClick={() => handleDelete(user.id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}

                                        {users.length === 0 && (
                                            <tr>
                                                <td colSpan={6}>No users found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}