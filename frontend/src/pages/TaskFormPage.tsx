import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEventHandler } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaClipboardCheck, FaUserFriends } from "react-icons/fa";
import { createTask } from "../api/tasksApi";
import { getTeamWorkload } from "../api/teamsApi";
import type { TaskFormData } from "../types/task";
import type { TeamWorkloadMember } from "../types/workload";
import "./TaskFormPage.css";

const DEFAULT_TEAM_ID = 1;

function getThisWeekRange() {
    const today = new Date();
    const day = today.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const start = new Date(today);
    start.setDate(today.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return {
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
    };
}

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

const initialRange = getThisWeekRange();

const initialForm: TaskFormData = {
    title: "",
    description: "",
    assignedMemberId: "",
    priority: "Medium",
    complexity: "Medium",
    estimatedEffortHours: 1,
    startDate: initialRange.startDate,
    dueDate: initialRange.endDate,
};

export default function TaskFormPage() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState<TaskFormData>(initialForm);
    const [members, setMembers] = useState<TeamWorkloadMember[]>([]);
    const [membersLoading, setMembersLoading] = useState(true);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const loadMembers = async () => {
            try {
                setMembersLoading(true);

                const data = await getTeamWorkload(
                    DEFAULT_TEAM_ID,
                    initialRange.startDate,
                    initialRange.endDate
                );

                setMembers(data.members || data.users || []);
            } catch (err) {
                console.error("LOAD MEMBERS ERROR:", err);
            } finally {
                setMembersLoading(false);
            }
        };

        loadMembers();
    }, []);

    const selectedMember = useMemo(() => {
        return members.find((member) => getMemberId(member) === formData.assignedMemberId) || null;
    }, [members, formData.assignedMemberId]);

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
        if (!formData.startDate) return "Start date is required.";
        if (!formData.dueDate) return "Due date is required.";

        const start = new Date(formData.startDate);
        const due = new Date(formData.dueDate);

        if (due < start) return "Due date cannot be earlier than start date.";

        return "";
    };

    const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setLoading(true);
            await createTask(formData);
            setSuccess("Task created successfully.");
            setTimeout(() => navigate("/dashboard"), 900);
        } catch (err: unknown) {
            console.error("CREATE TASK ERROR:", err);

            let message = "Failed to create task.";

            if (typeof err === "object" && err !== null && "response" in err) {
                const response = (err as {
                    response?: {
                        data?: { message?: string } | string;
                    };
                }).response;

                if (typeof response?.data === "string") {
                    message = response.data;
                } else if (response?.data && typeof response.data.message === "string") {
                    message = response.data.message;
                }
            }

            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="task-form-page">
            <div className="task-form-shell">
                <div className="task-form-header">
                    <div>
                        <p className="task-form-eyebrow">Team Leader Action</p>
                        <h1>Create Task</h1>
                        <p className="task-form-subtitle">
                            Create and assign a task with clean validation and professional member
                            selection
                        </p>
                    </div>

                    <button
                        type="button"
                        className="task-back-btn"
                        onClick={() => navigate("/dashboard")}
                    >
                        <FaArrowLeft />
                        <span>Back</span>
                    </button>
                </div>

                <form className="task-form-card" onSubmit={handleSubmit}>
                    {error && <div className="task-alert error">{error}</div>}
                    {success && <div className="task-alert success">{success}</div>}

                    <div className="task-grid">
                        <div className="task-field full">
                            <label htmlFor="title">Title</label>
                            <input
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Enter task title"
                                required
                            />
                        </div>

                        <div className="task-field full">
                            <label htmlFor="description">Description</label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Describe the task scope, expected output, and context"
                            />
                        </div>

                        <div className="task-field full">
                            <label htmlFor="assignedMemberId">Assigned Member</label>
                            <div className="member-selector-wrap">
                                <select
                                    id="assignedMemberId"
                                    name="assignedMemberId"
                                    value={formData.assignedMemberId}
                                    onChange={handleChange}
                                    required
                                    disabled={membersLoading}
                                >
                                    <option value="">
                                        {membersLoading ? "Loading members..." : "Select a team member"}
                                    </option>

                                    {members.map((member) => (
                                        <option key={getMemberId(member)} value={getMemberId(member)}>
                                            {getMemberName(member)} · {getMemberStatus(member)} · Weight{" "}
                                            {getMemberWeight(member).toFixed(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedMember && (
                                <div className="task-member-preview">
                                    <div className="task-member-preview-icon">
                                        <FaUserFriends />
                                    </div>
                                    <div>
                                        <strong>{getMemberName(selectedMember)}</strong>
                                        <p>
                                            Current status: {getMemberStatus(selectedMember)} · Current
                                            weight: {getMemberWeight(selectedMember).toFixed(1)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="task-field">
                            <label htmlFor="estimatedEffortHours">Estimated Effort (hours)</label>
                            <input
                                id="estimatedEffortHours"
                                type="number"
                                min="1"
                                name="estimatedEffortHours"
                                value={formData.estimatedEffortHours}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="task-field">
                            <label htmlFor="priority">Priority</label>
                            <select
                                id="priority"
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                            </select>
                        </div>

                        <div className="task-field">
                            <label htmlFor="complexity">Complexity</label>
                            <select
                                id="complexity"
                                name="complexity"
                                value={formData.complexity}
                                onChange={handleChange}
                            >
                                <option value="Simple">Simple</option>
                                <option value="Medium">Medium</option>
                                <option value="Complex">Complex</option>
                            </select>
                        </div>

                        <div className="task-field">
                            <label htmlFor="startDate">Start Date</label>
                            <input
                                id="startDate"
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="task-field">
                            <label htmlFor="dueDate">Due Date</label>
                            <input
                                id="dueDate"
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
                            onClick={() => navigate("/dashboard")}
                        >
                            Cancel
                        </button>

                        <button type="submit" className="task-primary-btn" disabled={loading}>
                            <FaClipboardCheck />
                            <span>{loading ? "Creating..." : "Create Task"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}