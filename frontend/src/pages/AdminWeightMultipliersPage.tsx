import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    getWeightMultipliers,
    updateWeightMultiplier,
    type WeightMultiplierSetting,
} from "../api/weightMultipliersApi";
import "./AdminWeightMultipliersPage.css";

export default function AdminWeightMultipliersPage() {
    const navigate = useNavigate();

    const [settings, setSettings] = useState<WeightMultiplierSetting[]>([]);
    const [formValues, setFormValues] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<number | null>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const prioritySettings = useMemo(
        () => settings.filter((item) => item.type === "Priority"),
        [settings]
    );

    const complexitySettings = useMemo(
        () => settings.filter((item) => item.type === "Complexity"),
        [settings]
    );

    const loadSettings = async () => {
        try {
            setLoading(true);
            setError("");
            setSuccess("");

            const data = await getWeightMultipliers();
            setSettings(data);

            const values: Record<number, string> = {};
            data.forEach((item) => {
                values[item.id] = String(item.multiplier);
            });
            setFormValues(values);
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.response?.data ||
                "Failed to load weight multipliers.";

            setError(typeof message === "string" ? message : "Failed to load weight multipliers.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const handleChange = (id: number, value: string) => {
        setFormValues((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    const handleSave = async (setting: WeightMultiplierSetting) => {
        const value = Number(formValues[setting.id]);

        if (!value || value <= 0) {
            setError("Multiplier must be greater than zero.");
            setSuccess("");
            return;
        }

        try {
            setSavingId(setting.id);
            setError("");
            setSuccess("");

            await updateWeightMultiplier(setting.id, {
                multiplier: value,
            });

            setSuccess(`${setting.type} ${setting.name} multiplier updated successfully.`);
            await loadSettings();
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.response?.data ||
                "Failed to update multiplier.";

            setError(typeof message === "string" ? message : "Failed to update multiplier.");
        } finally {
            setSavingId(null);
        }
    };

    const renderTable = (title: string, items: WeightMultiplierSetting[]) => (
        <div className="admin-card">
            <h2>{title}</h2>

            <div className="admin-table-wrap">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Multiplier</th>
                            <th>Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={3}>No multipliers found.</td>
                            </tr>
                        ) : (
                            items.map((setting) => (
                                <tr key={setting.id}>
                                    <td>{setting.name}</td>
                                    <td>
                                        <input
                                            className="multiplier-input"
                                            type="number"
                                            min="0.1"
                                            step="0.1"
                                            value={formValues[setting.id] ?? ""}
                                            onChange={(e) =>
                                                handleChange(setting.id, e.target.value)
                                            }
                                        />
                                    </td>
                                    <td>
                                        <button
                                            className="admin-small-btn"
                                            onClick={() => handleSave(setting)}
                                            disabled={savingId === setting.id}
                                        >
                                            {savingId === setting.id ? "Saving..." : "Save"}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="admin-page">
            <div className="admin-shell">
                <div className="admin-header">
                    <div>
                        <p className="admin-eyebrow">Admin Panel</p>
                        <h1>Manage Weight Multipliers</h1>
                        <p className="admin-subtitle">
                            Configure how task priority and complexity affect workload weight.
                        </p>
                    </div>

                    <button className="admin-back-btn" onClick={() => navigate("/dashboard")}>
                        Back
                    </button>
                </div>

                {error && <div className="admin-alert error">{error}</div>}
                {success && <div className="admin-alert success">{success}</div>}

                {loading ? (
                    <div className="admin-card">
                        <p>Loading multipliers...</p>
                    </div>
                ) : (
                    <div className="admin-grid">
                        {renderTable("Priority Multipliers", prioritySettings)}
                        {renderTable("Complexity Multipliers", complexitySettings)}
                    </div>
                )}

                <div className="admin-card multiplier-note">
                    <h2>Weight Formula</h2>
                    <p>
                        Weight = Estimated Effort Hours × Priority Multiplier × Complexity
                        Multiplier
                    </p>
                    <p>
                        Changing these values affects newly created tasks and updated/reapproved
                        tasks.
                    </p>
                </div>
            </div>
        </div>
    );
}