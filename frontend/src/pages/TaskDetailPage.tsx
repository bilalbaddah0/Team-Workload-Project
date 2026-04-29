import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEventHandler } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    FaArrowLeft,
    FaCalendarAlt,
    FaCheckCircle,
    FaClipboardList,
    FaClock,
    FaEdit,
    FaExclamationTriangle,
    FaHistory,
    FaLayerGroup,
    FaSave,
    FaTrash,
    FaUser,
    FaUserCheck,
} from "react-icons/fa";
import {
    acknowledgeTask,
    createTaskChangeRequest,
    deleteTask,
    getTaskDetails,
    mapStatusToApi,
    updateTaskStatus,
} from "../api/tasksApi";
import { getAllUsers, type UserResponseDto } from "../api/usersApi";
import type {
    TaskChangeHistoryItem,
    TaskDetailsResponse,
    TaskStatusHistoryItem,
} from "../types/task";
import { getRole, getUserId } from "../utils/auth";
import { isAdminOrLeader } from "../utils/permissions";
import "./TaskDetailPage.css";

type TaskDetailTab = "overview" | "actions" | "status-history" | "change-history";

function safeDate(value?: string) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
}

function safeDateTime(value?: string) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
}

function getTaskId(task: TaskDetailsResponse) {
    return task.id ?? task.taskId ?? 0;
}

function getUserName(user?: { fullName?: string } | string) {
    if (!user) return "-";
    if (typeof user === "string") return user;
    return user.fullName || "-";
}

function getAssignedName(task: TaskDetailsResponse) {
    return (
        task.assignedMember?.fullName ||
        task.assignedMemberName ||
        task.assignedToName ||
        "Unassigned"
    );
}

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
            return "User";
    }
}
function getAssignedEmail(task: TaskDetailsResponse) {
    return task.assignedMember?.email || "-";
}

function getCreatedByName(task: TaskDetailsResponse) {
    return task.createdBy?.fullName || task.createdByName || "-";
}

function getCreatedByEmail(task: TaskDetailsResponse) {
    return task.createdBy?.email || "-";
}

function getEffort(task: TaskDetailsResponse) {
    return Number(
        task.weightBreakdown?.estimatedEffortHours ??
        task.estimatedEffortHours ??
        task.effortHours ??
        0
    );
}

function getWeight(task: TaskDetailsResponse) {
    return Number(task.weight ?? task.weightBreakdown?.calculatedWeight ?? task.totalWeight ?? 0);
}

function getAcknowledged(task: TaskDetailsResponse) {
    return task.isAcknowledged ?? task.acknowledged ?? false;
}

function mapPriorityLabel(value?: number | string) {
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
            return "-";
    }
}

function mapComplexityLabel(value?: number | string) {
    if (typeof value === "string") return value;

    switch (Number(value)) {
        case 1:
            return "Simple";
        case 2:
            return "Medium";
        case 3:
            return "Complex";
        default:
            return "-";
    }
}

function mapStatusLabel(value?: number | string) {
    if (typeof value === "string") return value;

    switch (Number(value)) {
        case 0:
            return "New";
        case 1:
            return "In Progress";
        case 2:
            return "Blocked";
        case 3:
            return "Done";
        default:
            return "-";
    }
}

function getStatusClass(status?: number | string) {
    const label = mapStatusLabel(status).toLowerCase();

    if (label.includes("done")) return "done";
    if (label.includes("progress")) return "progress";
    if (label.includes("block")) return "blocked";
    if (label.includes("new")) return "new";

    return "default";
}

export default function TaskDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const currentUserId = Number(getUserId() ?? 0);
    const currentRole = getRole() || "";
    const canEditTask = isAdminOrLeader();

    const [task, setTask] = useState<TaskDetailsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [actionError, setActionError] = useState("");
    const [actionSuccess, setActionSuccess] = useState("");

    const [ackLoading, setAckLoading] = useState(false);
    const [statusLoading, setStatusLoading] = useState(false);
    const [changeRequestLoading, setChangeRequestLoading] = useState(false);

    const [selectedStatus, setSelectedStatus] = useState("New");
    const [activeTab, setActiveTab] = useState<TaskDetailTab>("overview");
    const [changeRequestForm, setChangeRequestForm] = useState({
        newAssignedMemberId: "",
        newDueDate: "",
        newEstimatedEffortHours: "",
        reason: "",
    });
    const [availableUsers, setAvailableUsers] = useState<UserResponseDto[]>([]);

    const loadTask = async () => {
        if (!id) {
            setError("Task ID is missing.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const data = await getTaskDetails(id);
            setTask(data);
            setSelectedStatus(mapStatusLabel(data.status));
        } catch (err: any) {
           
            const message =
                err?.response?.data?.message ||
                err?.response?.data ||
                "Failed to load task details.";

            setError(typeof message === "string" ? message : "Failed to load task details.");
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            const data = await getAllUsers();
            setAvailableUsers(data.filter((user) => user.isActive));
        } catch {
            setAvailableUsers([]);
        }
    };

    useEffect(() => {
        loadTask();
        loadUsers();
    }, [id]);

    const statusHistory = useMemo<TaskStatusHistoryItem[]>(() => {
        if (!task) return [];
        return task.statusHistory || task.taskStatusHistories || [];
    }, [task]);

    const changeHistory = useMemo<TaskChangeHistoryItem[]>(() => {
        if (!task) return [];
        return task.changeHistory || task.taskChangeHistories || [];
    }, [task]);

    const isAssignedMember = useMemo(() => {
        if (!task) return false;
        return Number(task.assignedMember?.id ?? task.assignedMemberId ?? 0) === currentUserId;
    }, [task, currentUserId]);

    const canAcknowledge = Boolean(task && isAssignedMember && !getAcknowledged(task));
    const canUpdateStatus = Boolean(task && (isAssignedMember || canEditTask));
    const canRequestChange = Boolean(task && isAssignedMember && currentRole === "Member");
    const canDeleteTask = Boolean(task && currentRole === "TeamLeader");

    const handleStatusChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setSelectedStatus(e.target.value);
    };

    const handleChangeRequestInput = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setChangeRequestForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleAcknowledge = async () => {
        if (!task) return;

        try {
            setAckLoading(true);
            setActionError("");
            setActionSuccess("");

            await acknowledgeTask(getTaskId(task));
            setActionSuccess("Task acknowledged successfully.");
            await loadTask();
        } catch (err: any) {
          
            const message =
                err?.response?.data?.message ||
                err?.response?.data ||
                "Failed to acknowledge task.";
            setActionError(typeof message === "string" ? message : "Failed to acknowledge task.");
        } finally {
            setAckLoading(false);
        }
    };

    const handleUpdateStatus = async () => {
        if (!task) return;

        try {
            setStatusLoading(true);
            setActionError("");
            setActionSuccess("");

            await updateTaskStatus(getTaskId(task), mapStatusToApi(selectedStatus));
            setActionSuccess("Task status updated successfully.");
            await loadTask();
        } catch (err: any) {
   
            const message =
                err?.response?.data?.message ||
                err?.response?.data ||
                "Failed to update task status.";
            setActionError(typeof message === "string" ? message : "Failed to update task status.");
        } finally {
            setStatusLoading(false);
        }
    };

    const handleSubmitChangeRequest: FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault();

        if (!task) return;

        const payload: {
            newAssignedMemberId?: number;
            newDueDate?: string;
            newEstimatedEffortHours?: number;
            reason?: string;
        } = {};

        if (changeRequestForm.newAssignedMemberId) {
            payload.newAssignedMemberId = Number(changeRequestForm.newAssignedMemberId);
        }

        if (changeRequestForm.newDueDate) {
            payload.newDueDate = changeRequestForm.newDueDate;
        }

        if (changeRequestForm.newEstimatedEffortHours.trim()) {
            payload.newEstimatedEffortHours = Number(changeRequestForm.newEstimatedEffortHours);
        }

        if (changeRequestForm.reason.trim()) {
            payload.reason = changeRequestForm.reason.trim();
        }
        if (
            payload.newAssignedMemberId === undefined &&
            !payload.newDueDate &&
            payload.newEstimatedEffortHours === undefined
        ) {
            setActionError("Please request a new owner, due date change, or increased effort.");
            setActiveTab("actions");
            return;
        }

        try {
            setChangeRequestLoading(true);
            setActionError("");
            setActionSuccess("");

            await createTaskChangeRequest(getTaskId(task), payload);
            setActionSuccess("Change request submitted successfully.");
            setChangeRequestForm({
                newAssignedMemberId: "",
                newDueDate: "",
                newEstimatedEffortHours: "",
                reason: "",
            });
            setActiveTab("change-history");
            await loadTask();
        } catch (err: any) {
            
            const message =
                err?.response?.data?.message ||
                err?.response?.data ||
                "Failed to create change request.";
            setActionError(
                typeof message === "string" ? message : "Failed to create change request."
            );
            setActiveTab("actions");
        } finally {
            setChangeRequestLoading(false);
        }
    };

    const handleDeleteTask = async () => {
        if (!task) return;

        

        try {
            setActionError("");
            setActionSuccess("");

            await deleteTask(getTaskId(task));

        
            navigate("/dashboard");
        } catch (err: any) {
       

            const message =
                err?.response?.data?.message ||
                err?.response?.data ||
                "Failed to delete task.";

            setActionError(typeof message === "string" ? message : "Failed to delete task.");
        }
    };

    if (loading) {
        return (
            <div className="task-detail-page">
                <div className="task-detail-shell">
                    <div className="task-detail-card">
                        <p>Loading task details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !task) {
        return (
            <div className="task-detail-page">
                <div className="task-detail-shell">
                    <div className="task-detail-card">
                        <div className="task-detail-error">
                            <FaExclamationTriangle />
                            <div>
                                <h2>Unable to load task</h2>
                                <p>{error || "Task details were not found."}</p>
                            </div>
                        </div>

                        <button className="task-back-btn" onClick={() => navigate(-1)}>
                            <FaArrowLeft />
                            <span>Go Back</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const taskId = getTaskId(task);
    const statusLabel = mapStatusLabel(task.status);
    const priorityLabel = mapPriorityLabel(task.priority);
    const complexityLabel = mapComplexityLabel(task.complexity);
    const acknowledged = getAcknowledged(task);
    const effort = getEffort(task);
    const weight = getWeight(task);

    return (
        <div className="task-detail-page">
            <div className="task-detail-shell">
                <div className="task-detail-header">
                    <div>
                        <p className="task-detail-eyebrow">Task Management</p>
                        <h1>{task.title || "Untitled Task"}</h1>
                        <p className="task-detail-subtitle">
                            Detailed task overview, ownership, weighting, history, and major change
                            tracking
                        </p>
                    </div>

                    <div className="task-detail-header-actions">
                        <button className="task-back-btn" onClick={() => navigate(-1)}>
                            <FaArrowLeft />
                            <span>Back</span>
                        </button>

                        {canEditTask && (
                            <Link to={`/tasks/${taskId}/edit`} className="task-edit-btn">
                                <FaEdit />
                                <span>Edit Task</span>
                            </Link>
                        )}

                        {canDeleteTask && (
                            <button className="task-delete-btn" onClick={handleDeleteTask}>
                                <FaTrash />
                                <span>Delete Task</span>
                            </button>
                        )}
                    </div>
                </div>

                {(actionError || actionSuccess) && (
                    <div className="task-detail-card" style={{ marginBottom: 20 }}>
                        {actionError && <div className="task-detail-inline-error">{actionError}</div>}
                        {actionSuccess && (
                            <div className="task-detail-inline-success">{actionSuccess}</div>
                        )}
                    </div>
                )}

                <div className="task-detail-hero-card">
                    <div className="task-detail-hero-main">
                        <div className="task-detail-chip-row">
                            <span className={`task-chip ${getStatusClass(task.status)}`}>
                                Status: {statusLabel}
                            </span>
                            <span className="task-chip">Priority: {priorityLabel}</span>
                            <span className="task-chip">Complexity: {complexityLabel}</span>
                            <span className="task-chip">Weight: {weight.toFixed(1)}</span>
                        </div>

                        <div className="task-detail-description">
                            <h3>Description</h3>
                            <p>{task.description || "No description was provided for this task."}</p>
                        </div>
                    </div>

                    <div className="task-detail-ack-box">
                        <div className={`ack-indicator ${acknowledged ? "yes" : "no"}`}>
                            {acknowledged ? <FaCheckCircle /> : <FaClock />}
                        </div>
                        <div>
                            <h3>{acknowledged ? "Acknowledged" : "Pending Acknowledgement"}</h3>
                            <p>
                                {acknowledged
                                    ? `Acknowledged on ${safeDateTime(task.acknowledgedAt)}`
                                    : "This task has not been acknowledged yet."}
                            </p>

                            {canAcknowledge && (
                                <button
                                    className="task-primary-action-btn"
                                    onClick={handleAcknowledge}
                                    disabled={ackLoading}
                                >
                                    {ackLoading ? "Acknowledging..." : "Acknowledge Task"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="task-detail-tabs">
                    <button
                        className={`task-detail-tab ${activeTab === "overview" ? "active" : ""}`}
                        onClick={() => setActiveTab("overview")}
                    >
                        Overview
                    </button>

                    {(canUpdateStatus || canRequestChange) && (
                        <button
                            className={`task-detail-tab ${activeTab === "actions" ? "active" : ""}`}
                            onClick={() => setActiveTab("actions")}
                        >
                            Actions
                        </button>
                    )}

                    <button
                        className={`task-detail-tab ${activeTab === "status-history" ? "active" : ""}`}
                        onClick={() => setActiveTab("status-history")}
                    >
                        Status History
                    </button>

                    <button
                        className={`task-detail-tab ${activeTab === "change-history" ? "active" : ""}`}
                        onClick={() => setActiveTab("change-history")}
                    >
                        Change History
                    </button>
                </div>

                {activeTab === "overview" && (
                    <div className="task-detail-grid">
                        <div className="task-detail-card">
                            <div className="card-title">
                                <FaClipboardList />
                                <h2>Task Overview</h2>
                            </div>

                            <div className="detail-grid">
                                <div className="detail-item">
                                    <label>Task ID</label>
                                    <strong>{taskId || "-"}</strong>
                                </div>

                                <div className="detail-item">
                                    <label>Status</label>
                                    <strong>{statusLabel}</strong>
                                </div>

                                <div className="detail-item">
                                    <label>Priority</label>
                                    <strong>{priorityLabel}</strong>
                                </div>

                                <div className="detail-item">
                                    <label>Complexity</label>
                                    <strong>{complexityLabel}</strong>
                                </div>

                                <div className="detail-item">
                                    <label>Estimated Effort</label>
                                    <strong>{effort.toFixed(1)} hours</strong>
                                </div>

                                <div className="detail-item">
                                    <label>Total Weight</label>
                                    <strong>{weight.toFixed(1)}</strong>
                                </div>

                                <div className="detail-item">
                                    <label>Start Date</label>
                                    <strong>{safeDate(task.startDate)}</strong>
                                </div>

                                <div className="detail-item">
                                    <label>Due Date</label>
                                    <strong>{safeDate(task.dueDate)}</strong>
                                </div>

                                <div className="detail-item">
                                    <label>Created At</label>
                                    <strong>{safeDateTime(task.createdAt)}</strong>
                                </div>

                                <div className="detail-item">
                                    <label>Last Updated</label>
                                    <strong>{safeDateTime(task.updatedAt)}</strong>
                                </div>
                            </div>
                        </div>

                        <div className="task-detail-card">
                            <div className="card-title">
                                <FaUserCheck />
                                <h2>Assigned Member</h2>
                            </div>

                            <div className="person-card">
                                <div className="person-avatar">
                                    <FaUser />
                                </div>
                                <div>
                                    <h3>{getAssignedName(task)}</h3>
                                    <span>{getAssignedEmail(task) || task.assignedMemberId || "-"}</span>
                                </div>
                            </div>
                        </div>

                        <div className="task-detail-card">
                            <div className="card-title">
                                <FaUser />
                                <h2>Created By</h2>
                            </div>

                            <div className="person-card">
                                <div className="person-avatar">
                                    <FaUser />
                                </div>
                                <div>
                                    <h3>{getCreatedByName(task)}</h3>
                                    <span>{getCreatedByEmail(task) || task.createdById || "-"}</span>
                                </div>
                            </div>
                        </div>

                        <div className="task-detail-card">
                            <div className="card-title">
                                <FaLayerGroup />
                                <h2>Weight Breakdown</h2>
                            </div>

                            <div className="detail-grid">
                                <div className="detail-item">
                                    <label>Estimated Effort</label>
                                    <strong>
                                        {Number(
                                            task.weightBreakdown?.estimatedEffortHours ?? effort
                                        ).toFixed(1)}
                                    </strong>
                                </div>

                                <div className="detail-item">
                                    <label>Complexity Multiplier</label>
                                    <strong>
                                        {Number(
                                            task.weightBreakdown?.complexityMultiplier ?? 0
                                        ).toFixed(1)}
                                    </strong>
                                </div>

                                <div className="detail-item">
                                    <label>Priority Multiplier</label>
                                    <strong>
                                        {Number(
                                            task.weightBreakdown?.priorityMultiplier ?? 0
                                        ).toFixed(1)}
                                    </strong>
                                </div>

                                <div className="detail-item">
                                    <label>Calculated Weight</label>
                                    <strong>
                                        {Number(
                                            task.weightBreakdown?.calculatedWeight ?? weight
                                        ).toFixed(1)}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {activeTab === "actions" && (canUpdateStatus || canRequestChange) && (
                    <div className="task-detail-section-grid">
                        {canUpdateStatus && (
                            <div className="task-detail-card">
                                <div className="card-title">
                                    <FaSave />
                                    <h2>Update Status</h2>
                                </div>

                                <div className="task-action-stack">
                                    <div className="task-field">
                                        <label>Status</label>
                                        <select value={selectedStatus} onChange={handleStatusChange}>
                                            <option value="New">New</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Blocked">Blocked</option>
                                            <option value="Done">Done</option>
                                        </select>
                                    </div>

                                    <button
                                        className="task-primary-action-btn"
                                        onClick={handleUpdateStatus}
                                        disabled={statusLoading}
                                    >
                                        {statusLoading ? "Saving..." : "Save Status"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {canRequestChange && (
                            <div className="task-detail-card">
                                <div className="card-title">
                                    <FaCalendarAlt />
                                    <h2>Request Major Change</h2>
                                </div>

                                <form className="task-action-stack" onSubmit={handleSubmitChangeRequest}>
                                    <div className="task-field">
                                        <div className="task-field">
                                            <label>Requested New Owner</label>
                                            <select
                                                name="newAssignedMemberId"
                                                value={changeRequestForm.newAssignedMemberId}
                                                onChange={(e) =>
                                                    setChangeRequestForm((prev) => ({
                                                        ...prev,
                                                        newAssignedMemberId: e.target.value,
                                                    }))
                                                }
                                            >
                                                <option value="">Keep current owner</option>
                                                {availableUsers
                                                    .filter((user) => Number(user.id) !== Number(task.assignedMember?.id ?? task.assignedMemberId))
                                                    .map((user) => (
                                                        <option key={user.id} value={user.id}>
                                                            {user.fullName} ({mapRoleLabel(user.role)})
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>
                                        <label>Requested Due Date</label>
                                        <input
                                            type="date"
                                            name="newDueDate"
                                            value={changeRequestForm.newDueDate}
                                            onChange={handleChangeRequestInput}
                                        />
                                    </div>

                                    <div className="task-field">
                                        <label>Requested Effort (hours)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            name="newEstimatedEffortHours"
                                            value={changeRequestForm.newEstimatedEffortHours}
                                            onChange={handleChangeRequestInput}
                                            placeholder="Only increased effort requires approval"
                                        />
                                    </div>

                                    <div className="task-field">
                                        <label>Reason</label>
                                        <textarea
                                            name="reason"
                                            rows={4}
                                            value={changeRequestForm.reason}
                                            onChange={handleChangeRequestInput}
                                            placeholder="Explain why this task needs a major change"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="task-primary-action-btn"
                                        disabled={changeRequestLoading}
                                    >
                                        {changeRequestLoading
                                            ? "Submitting..."
                                            : "Submit Change Request"}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "status-history" && (
                    <div className="task-detail-card">
                        <div className="card-title">
                            <FaHistory />
                            <h2>Status History</h2>
                        </div>

                        {statusHistory.length === 0 ? (
                            <div className="empty-history">No status history found.</div>
                        ) : (
                            <div className="timeline-list">
                                {statusHistory.map((item, index) => (
                                    <div className="timeline-item" key={item.id || index}>
                                        <div className="timeline-icon">
                                            <FaHistory />
                                        </div>

                                        <div className="timeline-content">
                                            <div className="timeline-top">
                                                <strong>
                                                    {mapStatusLabel(item.oldStatus)} →{" "}
                                                    {mapStatusLabel(item.newStatus)}
                                                </strong>
                                                <span>{safeDateTime(item.changedAt)}</span>
                                            </div>

                                            <p>
                                                Changed by{" "}
                                                {getUserName(item.changedBy) || item.changedByName || "-"}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "change-history" && (
                    <div className="task-detail-card">
                        <div className="card-title">
                            <FaCalendarAlt />
                            <h2>Major Change History</h2>
                        </div>

                        {changeHistory.length === 0 ? (
                            <div className="empty-history">No change history found.</div>
                        ) : (
                            <div className="change-history-list">
                                {changeHistory.map((item, index) => (
                                    <div className="change-history-item" key={item.id || index}>
                                        <div className="change-history-top">
                                            <strong>Major Change Request</strong>
                                            <span>{item.status || "-"}</span>
                                        </div>

                                        <div className="change-history-values">
                                            <div>
                                                <label>Current Owner</label>
                                                <p>{item.currentAssignedMember?.fullName || "-"}</p>
                                            </div>

                                            <div>
                                                <label>Requested Owner</label>
                                                <p>{item.newAssignedMember?.fullName || "-"}</p>
                                            </div>

                                            <div>
                                                <label>Current Due Date</label>
                                                <p>{safeDate(item.currentDueDate)}</p>
                                            </div>

                                            <div>
                                                <label>Requested Due Date</label>
                                                <p>{safeDate(item.newDueDate)}</p>
                                            </div>

                                            <div>
                                                <label>Current Effort</label>
                                                <p>
                                                    {item.currentEstimatedEffortHours !== undefined
                                                        ? `${item.currentEstimatedEffortHours} hours`
                                                        : "-"}
                                                </p>
                                            </div>

                                            <div>
                                                <label>Requested Effort</label>
                                                <p>
                                                    {item.newEstimatedEffortHours !== undefined
                                                        ? `${item.newEstimatedEffortHours} hours`
                                                        : "-"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="change-history-values">
                                            <div style={{ gridColumn: "1 / -1" }}>
                                                <label>Reason</label>
                                                <p>{item.reason || "-"}</p>
                                            </div>
                                        </div>

                                        <div className="change-history-meta">
                                            <span>
                                                Requested by{" "}
                                                {item.requestedBy?.fullName ||
                                                    item.requestedByName ||
                                                    "-"}{" "}
                                                on {safeDateTime(item.createdAt || item.requestedAt)}
                                            </span>

                                            <span>
                                                Reviewed by {item.reviewedBy?.fullName || "-"}{" "}
                                                {item.reviewedAt
                                                    ? `· ${safeDateTime(item.reviewedAt)}`
                                                    : ""}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}