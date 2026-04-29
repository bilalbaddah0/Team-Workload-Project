import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaCalendarAlt,
    FaCheckCircle,
    FaClipboardList,
    FaLayerGroup,
    FaPlus,
    FaSignOutAlt,
    FaSitemap,
    FaUserCog,
    FaUserShield,
    FaSlidersH,
    FaUsers,
} from "react-icons/fa";

import { getAllTasks } from "../api/tasksApi";
import { getTeamWorkload } from "../api/teamsApi";
import {
    getUserById,
    getUserWorkload,
    type MemberTask,
    type UserWorkloadResponse,
} from "../api/usersApi";
import StatusBadge from "../components/common/StatusBadge";
import type { TaskResponseDto } from "../types/task";
import type { TeamWorkloadMember } from "../types/workload";
import { clearAuth, getFullName, getRole, getUserId } from "../utils/auth";
import { isAdmin, isAdminOrLeader, isTeamLeader } from "../utils/permissions";

import "./DashboardPage.css";

type DashboardTotals = {
    totalMembers: number;
    totalTasks: number;
    totalEffort: number;
    totalWeight: number;
};

type LeaderDashboardTab = "overview" | "members" | "tasks";

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

function getMemberId(member: TeamWorkloadMember) {
    return String(member.userId ?? member.id ?? "");
}

function getMemberName(member: TeamWorkloadMember) {
    return (
        member.fullName ||
        member.name ||
        member.memberName ||
        member.userName ||
        "Unknown Member"
    );
}

function getMemberStatus(member: TeamWorkloadMember) {
    return member.workloadStatus || member.status || "Available";
}

function getMemberTasks(member: TeamWorkloadMember) {
    return Number(member.totalTasks ?? member.taskCount ?? 0);
}

function getMemberEffort(member: TeamWorkloadMember) {
    return Number(member.totalEffortHours ?? member.effortHours ?? 0);
}

function getMemberWeight(member: TeamWorkloadMember) {
    return Number(member.totalWeight ?? 0);
}

function getInitials(name: string) {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((x) => x[0]?.toUpperCase())
        .join("");
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

function safeTaskDate(value?: string) {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString();
}

export default function DashboardPage() {
    const navigate = useNavigate();

    const fullName = getFullName() || "User";
    const role = getRole() || "Unknown";
    const currentUserId = String(getUserId() ?? "");

    const isAdminUser = isAdmin(role);
    const isLeaderUser = isTeamLeader(role);
    const canViewTeamDashboard = isAdminOrLeader(role);

    const initialRange = useMemo(() => getThisWeekRange(), []);

    const [startDate, setStartDate] = useState(initialRange.startDate);
    const [endDate, setEndDate] = useState(initialRange.endDate);

    const [teamName, setTeamName] = useState("Team Workload");
    const [members, setMembers] = useState<TeamWorkloadMember[]>([]);
    const [personalWorkload, setPersonalWorkload] = useState<UserWorkloadResponse | null>(null);
    const [allTasks, setAllTasks] = useState<TaskResponseDto[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [leaderTab, setLeaderTab] = useState<LeaderDashboardTab>("overview");

    const totals = useMemo<DashboardTotals>(() => {
        return members.reduce<DashboardTotals>(
            (acc, member) => {
                acc.totalMembers += 1;
                acc.totalTasks += getMemberTasks(member);
                acc.totalEffort += getMemberEffort(member);
                acc.totalWeight += getMemberWeight(member);
                return acc;
            },
            {
                totalMembers: 0,
                totalTasks: 0,
                totalEffort: 0,
                totalWeight: 0,
            }
        );
    }, [members]);

    const currentUserWorkload = useMemo(() => {
        if (!canViewTeamDashboard) return null;
        return members.find((m) => getMemberId(m) === currentUserId) || null;
    }, [members, currentUserId, canViewTeamDashboard]);

    const personalTasks: MemberTask[] = personalWorkload?.tasks || [];

    const visibleAllTasks = useMemo(() => {
        return allTasks.filter((task) => {
            if (!task.startDate || !task.dueDate) return true;

            const taskStart = new Date(task.startDate);
            const taskDue = new Date(task.dueDate);
            const filterStart = new Date(startDate);
            const filterEnd = new Date(endDate);

            if (
                Number.isNaN(taskStart.getTime()) ||
                Number.isNaN(taskDue.getTime()) ||
                Number.isNaN(filterStart.getTime()) ||
                Number.isNaN(filterEnd.getTime())
            ) {
                return true;
            }

            return taskStart <= filterEnd && taskDue >= filterStart;
        });
    }, [allTasks, startDate, endDate]);

    const loadDashboard = async (from = startDate, to = endDate) => {
        try {
            setLoading(true);
            setError("");

            if (canViewTeamDashboard) {
                const currentUser = await getUserById(currentUserId);

                if (!currentUser.teamId) {
                    setError("Your account is not assigned to a team.");
                    setMembers([]);
                    setAllTasks([]);
                    setPersonalWorkload(null);
                    return;
                }

                const data = await getTeamWorkload(currentUser.teamId, from, to);
                const tasksData = await getAllTasks();

                setTeamName(data.teamName || data.name || `Team ${currentUser.teamId}`);
                setMembers(data.members || data.users || []);
                setAllTasks(tasksData);
                setPersonalWorkload(null);
            } else {
                const data = await getUserWorkload(currentUserId, from, to);

                setPersonalWorkload(data);
                setMembers([]);
                setAllTasks([]);
                setTeamName("Personal Dashboard");
            }
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.response?.data ||
                "Failed to load dashboard.";

            setError(typeof message === "string" ? message : JSON.stringify(message));
            setMembers([]);
            setAllTasks([]);
            setPersonalWorkload(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard(initialRange.startDate, initialRange.endDate);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUserId, role]);

    const handleLogout = () => {
        clearAuth();
        window.location.href = "/login";
    };

    const handleThisWeek = () => {
        const range = getThisWeekRange();
        setStartDate(range.startDate);
        setEndDate(range.endDate);
        loadDashboard(range.startDate, range.endDate);
    };

    const handleNextWeek = () => {
        const range = getNextWeekRange();
        setStartDate(range.startDate);
        setEndDate(range.endDate);
        loadDashboard(range.startDate, range.endDate);
    };

    const handleApply = () => {
        loadDashboard(startDate, endDate);
    };

    return (
        <div className="dashboard-page">
            <div className="dashboard-shell">
                <header className="dashboard-header">
                    <div>
                        <p className="dashboard-eyebrow">Team Workload & Task Tracking</p>
                        <h1 className="dashboard-title">Workload Dashboard</h1>
                        <p className="dashboard-subtitle">
                            Welcome back, <strong>{fullName}</strong> · Role:{" "}
                            <strong>{role}</strong>
                        </p>
                    </div>

                    <button className="logout-btn" onClick={handleLogout}>
                        <FaSignOutAlt />
                        <span>Logout</span>
                    </button>
                </header>

                <section className="profile-hero">
                    <div className="profile-card main-profile-card">
                        <div className="profile-avatar">{getInitials(fullName)}</div>

                        <div className="profile-details">
                            <p className="profile-label">Signed-in Profile</p>
                            <h2>{fullName}</h2>
                            <div className="profile-meta">
                                <span className="role-pill">
                                    <FaUserShield />
                                    {role}
                                </span>

                                {canViewTeamDashboard ? (
                                    currentUserWorkload ? (
                                        <StatusBadge status={getMemberStatus(currentUserWorkload)} />
                                    ) : (
                                        <span className="muted-chip">No workload data yet</span>
                                    )
                                ) : personalWorkload ? (
                                    <StatusBadge status={personalWorkload.workloadStatus} />
                                ) : (
                                    <span className="muted-chip">No workload data yet</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="profile-card side-profile-card">
                        <p className="mini-title">Your Summary</p>
                        <div className="mini-stats-grid">
                            <div>
                                <strong>
                                    {canViewTeamDashboard
                                        ? currentUserWorkload
                                            ? getMemberTasks(currentUserWorkload)
                                            : 0
                                        : personalWorkload?.totalTasks ?? 0}
                                </strong>
                                <span>Tasks</span>
                            </div>

                            <div>
                                <strong>
                                    {canViewTeamDashboard
                                        ? currentUserWorkload
                                            ? getMemberEffort(currentUserWorkload)
                                            : 0
                                        : personalWorkload?.totalEffortHours ?? 0}
                                </strong>
                                <span>Hours</span>
                            </div>

                            <div>
                                <strong>
                                    {canViewTeamDashboard
                                        ? currentUserWorkload
                                            ? getMemberWeight(currentUserWorkload).toFixed(1)
                                            : "0.0"
                                        : Number(personalWorkload?.totalWeight ?? 0).toFixed(1)}
                                </strong>
                                <span>Weight</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="leader-actions">
                    {isLeaderUser && (
                        <>
                            <button
                                className="leader-action-card"
                                onClick={() => navigate("/tasks/new")}
                            >
                                <div className="leader-action-icon blue-action">
                                    <FaPlus />
                                </div>
                                <div>
                                    <h3>Create & Assign Task</h3>
                                    <p>Create a new task and assign it to a team member</p>
                                </div>
                            </button>

                            <button
                                className="leader-action-card"
                                onClick={() => navigate("/change-requests")}
                            >
                                <div className="leader-action-icon purple-action">
                                    <FaCheckCircle />
                                </div>
                                <div>
                                    <h3>Approve Major Changes</h3>
                                    <p>Review pending ownership, due date, and effort changes</p>
                                </div>
                            </button>
                        </>
                    )}

                    {isAdminUser && (
                        <>
                            <button
                                className="leader-action-card"
                                onClick={() => navigate("/admin/users")}
                            >
                                <div className="leader-action-icon indigo-action">
                                    <FaUserCog />
                                </div>
                                <div>
                                    <h3>Manage Users</h3>
                                    <p>Create users, assign roles, and place users into teams</p>
                                </div>
                            </button>

                            <button
                                className="leader-action-card"
                                onClick={() => navigate("/admin/teams")}
                            >
                                <div className="leader-action-icon teal-action">
                                    <FaSitemap />
                                </div>
                                <div>
                                    <h3>Manage Teams</h3>
                                    <p>Create, update, and organize teams from the dashboard</p>
                                </div>
                            </button>
                            <button
                                className="leader-action-card"
                                onClick={() => navigate("/admin/weight-multipliers")}
                            >
                                <div className="leader-action-icon purple-action">
                                    <FaSlidersH />
                                </div>
                                <div>
                                    <h3>Manage Weight Multipliers</h3>
                                    <p>Configure priority and complexity multipliers used in task weight</p>
                                </div>
                            </button>

                        </>
                    )}
                </section>

                <section className="filter-bar">
                    <div className="filter-title-wrap">
                        <FaCalendarAlt className="filter-icon" />
                        <div>
                            <h2>Date Range</h2>
                            <p>
                                {canViewTeamDashboard
                                    ? "Filters team workload totals, member workload status, and overlapping tasks in the selected period"
                                    : "Filters your personal workload totals and assigned tasks in the selected period"}
                            </p>
                        </div>
                    </div>

                    <div className="filter-controls">
                        <div className="input-group">
                            <label>Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        <div className="input-group">
                            <label>End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>

                        <div className="filter-actions">
                            <button className="secondary-btn" onClick={handleThisWeek}>
                                This Week
                            </button>

                            <button className="secondary-btn" onClick={handleNextWeek}>
                                Next Week
                            </button>

                            <button className="primary-btn" onClick={handleApply}>
                                Apply
                            </button>
                        </div>
                    </div>
                </section>

                {loading ? (
                    <div className="state-card">Loading dashboard...</div>
                ) : error ? (
                    <div className="state-card error-state">{error}</div>
                ) : canViewTeamDashboard ? (
                    <>
                        <div className="dashboard-tabs">
                            <button
                                className={`dashboard-tab ${leaderTab === "overview" ? "active" : ""
                                    }`}
                                onClick={() => setLeaderTab("overview")}
                            >
                                Overview
                            </button>

                            <button
                                className={`dashboard-tab ${leaderTab === "members" ? "active" : ""
                                    }`}
                                onClick={() => setLeaderTab("members")}
                            >
                                Members
                            </button>

                            {isLeaderUser && (
                                <button
                                    className={`dashboard-tab ${leaderTab === "tasks" ? "active" : ""
                                        }`}
                                    onClick={() => setLeaderTab("tasks")}
                                >
                                    All Tasks
                                </button>
                            )}
                        </div>

                        {leaderTab === "overview" && (
                            <section className="summary-grid">
                                <div className="summary-card">
                                    <div className="summary-icon blue">
                                        <FaUsers />
                                    </div>
                                    <div>
                                        <p className="summary-label">Team</p>
                                        <h3>{teamName}</h3>
                                        <span>{totals.totalMembers} members</span>
                                    </div>
                                </div>

                                <div className="summary-card">
                                    <div className="summary-icon purple">
                                        <FaClipboardList />
                                    </div>
                                    <div>
                                        <p className="summary-label">Total Tasks</p>
                                        <h3>{totals.totalTasks}</h3>
                                        <span>Across selected range</span>
                                    </div>
                                </div>

                                <div className="summary-card">
                                    <div className="summary-icon green">
                                        <FaLayerGroup />
                                    </div>
                                    <div>
                                        <p className="summary-label">Total Effort</p>
                                        <h3>{totals.totalEffort}</h3>
                                        <span>Hours</span>
                                    </div>
                                </div>

                                <div className="summary-card">
                                    <div className="summary-icon orange">
                                        <FaLayerGroup />
                                    </div>
                                    <div>
                                        <p className="summary-label">Total Weight</p>
                                        <h3>{totals.totalWeight.toFixed(1)}</h3>
                                        <span>Workload score</span>
                                    </div>
                                </div>
                            </section>
                        )}

                        {leaderTab === "members" && (
                            <section className="dashboard-content">
                                <div className="table-card">
                                    <div className="section-head">
                                        <div>
                                            <h2>Team Members</h2>
                                            <p>
                                                Detailed workload overview with task count, effort,
                                                and weight
                                            </p>
                                        </div>
                                    </div>

                                    <div className="table-wrap">
                                        <table className="workload-table">
                                            <thead>
                                                <tr>
                                                    <th>Member</th>
                                                    <th>Status</th>
                                                    <th>Tasks</th>
                                                    <th>Effort Hours</th>
                                                    <th>Total Weight</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {members.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="empty-row">
                                                            No workload data found for this range.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    members.map((member) => {
                                                        const memberName = getMemberName(member);
                                                        const memberId = getMemberId(member);

                                                        return (
                                                            <tr
                                                                key={memberId || memberName}
                                                                className="clickable-dashboard-row"
                                                                onClick={() =>
                                                                    navigate(`/members/${memberId}`)
                                                                }
                                                            >
                                                                <td>
                                                                    <div className="member-cell">
                                                                        <div className="avatar-circle">
                                                                            {getInitials(memberName)}
                                                                        </div>
                                                                        <div>
                                                                            <div className="member-name">
                                                                                {memberName}
                                                                            </div>
                                                                            <div className="member-subtext">
                                                                                {member.role ||
                                                                                    "Team Member"}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <StatusBadge
                                                                        status={getMemberStatus(
                                                                            member
                                                                        )}
                                                                    />
                                                                </td>
                                                                <td>{getMemberTasks(member)}</td>
                                                                <td>{getMemberEffort(member)}</td>
                                                                <td>
                                                                    {getMemberWeight(member).toFixed(
                                                                        1
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </section>
                        )}

                        {leaderTab === "tasks" && isLeaderUser && (
                            <section className="table-card">
                                <div className="section-head">
                                    <div>
                                        <h2>All Team Tasks</h2>
                                        <p>
                                            Team Leader can view all created and assigned tasks in
                                            the selected date range
                                        </p>
                                    </div>
                                </div>

                                <div className="table-wrap">
                                    <table className="workload-table">
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
                                            {visibleAllTasks.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="empty-row">
                                                        No tasks found for this range.
                                                    </td>
                                                </tr>
                                            ) : (
                                                visibleAllTasks.map((task) => (
                                                    <tr
                                                        key={task.id}
                                                        className="clickable-dashboard-row"
                                                        onClick={() =>
                                                            navigate(`/tasks/${task.id}`)
                                                        }
                                                    >
                                                        <td>{task.title}</td>
                                                        <td>
                                                            <StatusBadge
                                                                status={mapTaskStatusLabel(
                                                                    task.status
                                                                )}
                                                            />
                                                        </td>
                                                        <td>
                                                            {task.estimatedEffortHours ?? 0}
                                                        </td>
                                                        <td>
                                                            {Number(task.weight ?? 0).toFixed(1)}
                                                        </td>
                                                        <td>{safeTaskDate(task.startDate)}</td>
                                                        <td>{safeTaskDate(task.dueDate)}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        )}
                    </>
                ) : (
                    <>
                        <section className="summary-grid">
                            <div className="summary-card">
                                <div className="summary-icon blue">
                                    <FaUsers />
                                </div>
                                <div>
                                    <p className="summary-label">Member</p>
                                    <h3>{personalWorkload?.fullName || fullName}</h3>
                                    <span>{personalWorkload?.email || "-"}</span>
                                </div>
                            </div>

                            <div className="summary-card">
                                <div className="summary-icon purple">
                                    <FaClipboardList />
                                </div>
                                <div>
                                    <p className="summary-label">Total Tasks</p>
                                    <h3>{personalWorkload?.totalTasks ?? 0}</h3>
                                    <span>Across selected range</span>
                                </div>
                            </div>

                            <div className="summary-card">
                                <div className="summary-icon green">
                                    <FaLayerGroup />
                                </div>
                                <div>
                                    <p className="summary-label">Total Effort</p>
                                    <h3>{personalWorkload?.totalEffortHours ?? 0}</h3>
                                    <span>Hours</span>
                                </div>
                            </div>

                            <div className="summary-card">
                                <div className="summary-icon orange">
                                    <FaLayerGroup />
                                </div>
                                <div>
                                    <p className="summary-label">Total Weight</p>
                                    <h3>
                                        {Number(personalWorkload?.totalWeight ?? 0).toFixed(1)}
                                    </h3>
                                    <span>{personalWorkload?.workloadStatus || "Available"}</span>
                                </div>
                            </div>
                        </section>

                        <section className="table-card">
                            <div className="section-head">
                                <div>
                                    <h2>My Assigned Tasks</h2>
                                    <p>Your tasks in the selected date range</p>
                                </div>
                            </div>

                            <div className="table-wrap">
                                <table className="workload-table">
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
                                        {personalTasks.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="empty-row">
                                                    No tasks found for this range.
                                                </td>
                                            </tr>
                                        ) : (
                                            personalTasks.map((task) => (
                                                <tr
                                                    key={task.id}
                                                    className="clickable-dashboard-row"
                                                    onClick={() => navigate(`/tasks/${task.id}`)}
                                                >
                                                    <td>{task.title}</td>
                                                    <td>
                                                        <StatusBadge
                                                            status={mapTaskStatusLabel(task.status)}
                                                        />
                                                    </td>
                                                    <td>{task.estimatedEffortHours ?? 0}</td>
                                                    <td>{Number(task.weight ?? 0).toFixed(1)}</td>
                                                    <td>{safeTaskDate(task.startDate)}</td>
                                                    <td>{safeTaskDate(task.dueDate)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}