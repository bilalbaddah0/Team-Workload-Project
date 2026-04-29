import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaSave, FaUserFriends } from "react-icons/fa";
import { getTaskById, updateTask } from "../api/tasksApi";
import { getTeamWorkload } from "../api/teamsApi";
import type { TaskFormData } from "../types/task";
import type { TeamWorkloadMember } from "../types/workload";
import "./TaskFormPage.css";

const DEFAULT_TEAM_ID = 1;

function getMemberId(member: TeamWorkloadMember) {
    return String(member.userId ?? member.id ?? "");
}

function getMemberName(member: TeamWorkloadMember) {
    return member.fullName || member.name || member.memberName || member.userName || "Unknown Member";
}

function getMemberStatus(member: TeamWorkloadMember) {
    return member.workloadStatus || member.status || "Available";
}

function getMemberWeight(member: TeamWorkloadMember) {
    return Number(member.totalWeight ?? 0);
}

function enumToPriority(value?: string | number) {
    if (typeof value === "string") return value;
    switch (Number(value)) {
        case 1:
            return "Low";
        case 2:
            return "Medium";
        case 3:
            return "High";
        case 4:
            return "Critical";
        default:
            return "Medium";
    }
}

function enumToComplexity(value?: string | number) {
    if (typeof value === "string") return value;
    switch (Number(value)) {
        case 1:
            return "Simple";
        case 2:
            return "Medium";
        case 3:
            return "Complex";
        default:
            return "Medium";
    }
}

function formatDateInput(value?: string) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
}

export default function TaskEditPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState<TaskFormData>({
        title: "",
        description: "",
        assignedMemberId: "",
        priority: "Medium",
        complexity: "Medium",
        estimatedEffortHours: 1,
        startDate: "",
        dueDate: "",
    });

    const [members, setMembers] = useState<TeamWorkloadMember[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const loadPage = async () => {
            if (!id) return;

            try {
                setPageLoading(true);
                setError("");

                const [task, team] = await Promise.all([
                    getTaskById(id),
                    getTeamWorkload(DEFAULT_TEAM_ID),
                ]);

                setMembers(team.members || team.users || []);
                setFormData({
                    title: task.title || "",
                    description: task.description || "",
                    assignedMemberId: String(task.assignedMemberId ?? ""),
                    priority: enumToPriority(task.priority),
                    complexity: enumToComplexity(task.complexity),
                    estimatedEffortHours: Number(task.estimatedEffortHours ?? 1),
                    startDate: formatDateInput(task.startDate),
                    dueDate: formatDateInput(task.dueDate),
                });
            } catch (err: any) {
                console.error("TASK EDIT LOAD ERROR:", err);
                const message =
                    err?.response?.data?.message ||
                    err?.response?.data ||
                    "Failed to load task for editing.";
                setError(typeof message === "string" ? message : "Failed to load task for editing.");
            } finally {
                setPageLoading(false);
            }
        };

        loadPage();
    }, [id]);

    const selectedMember = useMemo(() => {
        return members.find((member) => getMemberId(member) === formData.assignedMemberId) || null;
    }, [members, formData.assignedMemberId]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: name === "estimatedEffortHours" ? Number(value) : value,
        }));
    };

    const validate = () => {
        if (!formData.title.trim()) return "Title is required.";
        if (!formData.assignedMemberId) return "Please select a team member.";
        if (formData.estimatedEffortHours < 1) return "Estimated effort must be at least 1 hour.";
        if (!formData.startDate || !formData.dueDate) return "Start date and due date are required.";
        if (new Date(formData.dueDate) < new Date(formData.startDate)) {
            return "Due date cannot be earlier than start date.";
        }
        return "";
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!id) return;

        setError("");
        setSuccess("");

        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setSaving(true);
            await updateTask(id, formData);
            setSuccess("Task updated successfully.");
            setTimeout(() => navigate(`/tasks/${id}`), 900);
        } catch (err: any) {
            console.error("UPDATE TASK ERROR:", err);
            const message =
                err?.response?.data?.message ||
                err?.response?.data ||
                "Failed to update task.";
            setError(typeof message === "string" ? message : "Failed to update task.");
        } finally {
            setSaving(false);
        }
    };

    if (pageLoading) {
        return (
            <div className="task-form-page">
                <div className="task-form-shell">
                    <div className="task-form-card">Loading task...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="task-form-page">
            <div className="task-form-shell">
                <div className="task-form-header">
                    <div>
                        <p className="task-form-eyebrow">Task Management</p>
                        <h1>Edit Task</h1>
                        <p className="task-form-subtitle">
                            Update task ownership, scope, schedule, and workload inputs
                        </p>
                    </div>

                    <button className="task-back-btn" onClick={() => navigate(-1)}>
                        <FaArrowLeft />
                        <span>Back</span>
                    </button>
                </div>

                <form className="task-form-card" onSubmit={handleSubmit}>
                    {error && <div className="task-alert error">{error}</div>}
                    {success && <div className="task-alert success">{success}</div>}

                    <div className="task-grid">
                        <div className="task-field full">
                            <label>Title</label>
                            <input
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="task-field full">
                            <label>Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                            />
                        </div>

                        <div className="task-field full">
                            <label>Assigned Member</label>
                            <select
                                name="assignedMemberId"
                                value={formData.assignedMemberId}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select a team member</option>
                                {members.map((member) => (
                                    <option key={getMemberId(member)} value={getMemberId(member)}>
                                        {getMemberName(member)} · {getMemberStatus(member)} · Weight{" "}
                                        {getMemberWeight(member).toFixed(1)}
                                    </option>
                                ))}
                            </select>

                            {selectedMember && (
                                <div className="task-member-preview">
                                    <div className="task-member-preview-icon">
                                        <FaUserFriends />
                                    </div>
                                    <div>
                                        <strong>{getMemberName(selectedMember)}</strong>
                                        <p>
                                            Current status: {getMemberStatus(selectedMember)} · Current weight:{" "}
                                            {getMemberWeight(selectedMember).toFixed(1)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="task-field">
                            <label>Estimated Effort (hours)</label>
                            <input
                                type="number"
                                min="1"
                                name="estimatedEffortHours"
                                value={formData.estimatedEffortHours}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="task-field">
                            <label>Priority</label>
                            <select name="priority" value={formData.priority} onChange={handleChange}>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                            </select>
                        </div>

                        <div className="task-field">
                            <label>Complexity</label>
                            <select name="complexity" value={formData.complexity} onChange={handleChange}>
                                <option value="Simple">Simple</option>
                                <option value="Medium">Medium</option>
                                <option value="Complex">Complex</option>
                            </select>
                        </div>

                        <div className="task-field">
                            <label>Start Date</label>
                            <input
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="task-field">
                            <label>Due Date</label>
                            <input
                                type="date"
                                name="dueDate"
                                value={formData.dueDate}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="task-form-actions">
                        <button
                            type="button"
                            className="task-secondary-btn"
                            onClick={() => navigate(-1)}
                        >
                            Cancel
                        </button>

                        <button type="submit" className="task-primary-btn" disabled={saving}>
                            <FaSave />
                            <span>{saving ? "Saving..." : "Save Changes"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}