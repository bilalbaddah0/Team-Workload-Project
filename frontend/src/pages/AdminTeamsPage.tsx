import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    createTeam,
    deleteTeam,
    getAllTeams,
    getTeamDetails,
    updateTeam,
    type TeamDetailsDto,
    type TeamResponseDto,
} from "../api/teamsApi";
import "./AdminTeamsPage.css";

export default function AdminTeamsPage() {
    const navigate = useNavigate();

    const [teams, setTeams] = useState<TeamResponseDto[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<TeamDetailsDto | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [editingTeamId, setEditingTeamId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
    });

    const loadTeams = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await getAllTeams();
            setTeams(data);
        } catch (err: any) {
            console.error("ADMIN TEAMS ERROR:", err);
            const message =
                err?.response?.data?.message ||
                err?.response?.data ||
                "Failed to load teams.";
            setError(typeof message === "string" ? message : "Failed to load teams.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTeams();
    }, []);

    const resetForm = () => {
        setEditingTeamId(null);
        setFormData({
            name: "",
            description: "",
        });
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            setError("Team name is required.");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            if (editingTeamId) {
                await updateTeam(editingTeamId, {
                    name: formData.name.trim(),
                    description: formData.description.trim(),
                });
                setSuccess("Team updated successfully.");
            } else {
                await createTeam({
                    name: formData.name.trim(),
                    description: formData.description.trim(),
                });
                setSuccess("Team created successfully.");
            }

            resetForm();
            await loadTeams();
        } catch (err: any) {
            console.error("SAVE TEAM ERROR:", err);
            const message =
                err?.response?.data?.message ||
                err?.response?.data ||
                "Failed to save team.";
            setError(typeof message === "string" ? message : "Failed to save team.");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (team: TeamResponseDto) => {
        setEditingTeamId(team.id);
        setFormData({
            name: team.name || "",
            description: team.description || "",
        });
        setError("");
        setSuccess("");
    };

    const handleDelete = async (id: number) => {
        try {
            setError("");
            setSuccess("");
            await deleteTeam(id);
            setSuccess("Team deleted successfully.");
            if (selectedTeam?.id === id) {
                setSelectedTeam(null);
            }
            await loadTeams();
        } catch (err: any) {
           
            const message =
                err?.response?.data?.message ||
                err?.response?.data ||
                "Failed to delete team.";
            setError(typeof message === "string" ? message : "Failed to delete team.");
        }
    };

    const handleViewDetails = async (id: number) => {
        try {
            setError("");
            const data = await getTeamDetails(id);
            setSelectedTeam(data);
        } catch (err: any) {
            console.error("TEAM DETAILS ERROR:", err);
            const message =
                err?.response?.data?.message ||
                err?.response?.data ||
                "Failed to load team details.";
            setError(typeof message === "string" ? message : "Failed to load team details.");
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-shell">
                <div className="admin-header">
                    <div>
                        <p className="admin-eyebrow">Admin Panel</p>
                        <h1>Manage Teams</h1>
                        <p className="admin-subtitle">
                            Create teams, update team information, and review team members
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
                        <h2>{editingTeamId ? "Edit Team" : "Create Team"}</h2>

                        <div className="admin-form-grid">
                            <div className="admin-field">
                                <label>Team Name</label>
                                <input
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                                    }
                                />
                            </div>

                            <div className="admin-field full">
                                <label>Description</label>
                                <textarea
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            description: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </div>

                        <div className="admin-actions">
                            <button className="admin-primary-btn" onClick={handleSubmit} disabled={saving}>
                                {saving
                                    ? editingTeamId
                                        ? "Updating..."
                                        : "Creating..."
                                    : editingTeamId
                                        ? "Update Team"
                                        : "Create Team"}
                            </button>

                            {editingTeamId && (
                                <button className="admin-secondary-btn" onClick={resetForm}>
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="admin-card">
                        <h2>Teams</h2>

                        {loading ? (
                            <p>Loading teams...</p>
                        ) : (
                            <div className="admin-table-wrap">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Description</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {teams.map((team) => (
                                            <tr key={team.id}>
                                                <td>{team.name}</td>
                                                <td>{team.description || "-"}</td>
                                                <td>
                                                    <div className="admin-table-actions">
                                                        <button
                                                            className="admin-small-btn"
                                                            onClick={() => handleViewDetails(team.id)}
                                                        >
                                                            Details
                                                        </button>
                                                        <button
                                                            className="admin-small-btn"
                                                            onClick={() => handleEdit(team)}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            className="admin-small-btn danger"
                                                            onClick={() => handleDelete(team.id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}

                                        {teams.length === 0 && (
                                            <tr>
                                                <td colSpan={3}>No teams found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {selectedTeam && (
                    <div className="admin-card" style={{ marginTop: 22 }}>
                        <h2>Team Details — {selectedTeam.name}</h2>

                        <div className="admin-table-wrap">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Member</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedTeam.members.length === 0 ? (
                                        <tr>
                                            <td colSpan={4}>No members assigned.</td>
                                        </tr>
                                    ) : (
                                        selectedTeam.members.map((member) => (
                                            <tr key={member.id}>
                                                <td>{member.fullName}</td>
                                                <td>{member.email}</td>
                                                <td>{member.role}</td>
                                                <td>{member.isActive ? "Active" : "Inactive"}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}