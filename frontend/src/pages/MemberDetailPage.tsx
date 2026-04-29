import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaCalendarAlt, FaClipboardList, FaLayerGroup, FaUser } from "react-icons/fa";
import { getUserWorkload } from "../api/usersApi";
import StatusBadge from "../components/common/StatusBadge";
import "./MemberDetailPage.css";

function safeDate(value?: string) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
}

function formatDateInput(date: Date) {
    return date.toISOString().split("T")[0];
}

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
        startDate: formatDateInput(start),
        endDate: formatDateInput(end),
    };
}

function getNextWeekRange() {
    const thisWeek = getThisWeekRange();

    const start = new Date(thisWeek.startDate);
    start.setDate(start.getDate() + 7);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return {
        startDate: formatDateInput(start),
        endDate: formatDateInput(end),
    };
}

function mapTaskStatusLabel(value?: number | string) {
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

export default function MemberDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const initialRange = useMemo(() => getThisWeekRange(), []);

    const [startDate, setStartDate] = useState(initialRange.startDate);
    const [endDate, setEndDate] = useState(initialRange.endDate);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [data, setData] = useState<any>(null);

    const loadMember = async (from = startDate, to = endDate) => {
        if (!id) {
            setError("Member id is missing.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");
            const response = await getUserWorkload(id, from, to);
            setData(response);
        } catch (err: any) {
            console.error("MEMBER DETAIL ERROR:", err);
            const message =
                err?.response?.data?.message ||
                err?.response?.data ||
                "Failed to load member details.";
            setError(typeof message === "string" ? message : "Failed to load member details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMember(initialRange.startDate, initialRange.endDate);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleThisWeek = () => {
        const range = getThisWeekRange();
        setStartDate(range.startDate);
        setEndDate(range.endDate);
        loadMember(range.startDate, range.endDate);
    };

    const handleNextWeek = () => {
        const range = getNextWeekRange();
        setStartDate(range.startDate);
        setEndDate(range.endDate);
        loadMember(range.startDate, range.endDate);
    };

    if (loading) {
        return (
            <div className="member-detail-page">
                <div className="member-detail-shell">
                    <div className="member-detail-card">Loading member details...</div>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="member-detail-page">
                <div className="member-detail-shell">
                    <div className="member-detail-card">
                        <p>{error || "Member details not found."}</p>
                        <button className="member-back-btn" onClick={() => navigate("/dashboard")}>
                            <FaArrowLeft />
                            <span>Back</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="member-detail-page">
            <div className="member-detail-shell">
                <div className="member-detail-header">
                    <div>
                        <p className="member-detail-eyebrow">Member Detail</p>
                        <h1>{data.fullName}</h1>
                        <p className="member-detail-subtitle">{data.email}</p>
                    </div>

                    <button className="member-back-btn" onClick={() => navigate("/dashboard")}>
                        <FaArrowLeft />
                        <span>Back</span>
                    </button>
                </div>

                <div className="member-detail-summary-grid">
                    <div className="member-detail-card">
                        <div className="member-summary-head">
                            <FaUser />
                            <h2>Workload Status</h2>
                        </div>
                        <StatusBadge status={data.workloadStatus} />
                    </div>

                    <div className="member-detail-card">
                        <div className="member-summary-head">
                            <FaClipboardList />
                            <h2>Total Tasks</h2>
                        </div>
                        <strong>{data.totalTasks ?? 0}</strong>
                    </div>

                    <div className="member-detail-card">
                        <div className="member-summary-head">
                            <FaLayerGroup />
                            <h2>Total Effort</h2>
                        </div>
                        <strong>{data.totalEffortHours ?? 0} hours</strong>
                    </div>

                    <div className="member-detail-card">
                        <div className="member-summary-head">
                            <FaLayerGroup />
                            <h2>Total Weight</h2>
                        </div>
                        <strong>{Number(data.totalWeight ?? 0).toFixed(1)}</strong>
                    </div>
                </div>

                <div className="member-filter-bar">
                    <div className="member-input-group">
                        <label>Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>

                    <div className="member-input-group">
                        <label>End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>

                    <button className="member-apply-btn" onClick={handleThisWeek}>
                        <FaCalendarAlt />
                        This Week
                    </button>

                    <button className="member-apply-btn" onClick={handleNextWeek}>
                        Next Week
                    </button>

                    <button className="member-apply-btn" onClick={() => loadMember(startDate, endDate)}>
                        Apply
                    </button>
                </div>

                <div className="member-detail-card">
                    <div className="member-summary-head">
                        <FaClipboardList />
                        <h2>Assigned Tasks</h2>
                    </div>

                    <div className="member-table-wrap">
                        <table className="member-tasks-table">
                            <thead>
                                <tr>
                                    <th>Task</th>
                                    <th>Status</th>
                                    <th>Effort Hours</th>
                                    <th>Weight</th>
                                    <th>Start Date</th>
                                    <th>Due Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data.tasks || []).length === 0 ? (
                                    <tr>
                                        <td colSpan={6}>No tasks found for this range.</td>
                                    </tr>
                                ) : (
                                    data.tasks.map((task: any) => (
                                        <tr
                                            key={task.id}
                                            className="member-task-row"
                                            onClick={() => navigate(`/tasks/${task.id}`)}
                                        >
                                            <td>{task.title}</td>
                                            <td>
                                                <StatusBadge status={mapTaskStatusLabel(task.status)} />
                                            </td>
                                            <td>{task.estimatedEffortHours ?? 0}</td>
                                            <td>{Number(task.weight ?? 0).toFixed(1)}</td>
                                            <td>{safeDate(task.startDate)}</td>
                                            <td>{safeDate(task.dueDate)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}