import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    IconButton,
    InputAdornment,
    TextField,
    Typography,
} from "@mui/material";
import { Email, Lock, Visibility, VisibilityOff } from "@mui/icons-material";

import { login } from "../api/authApi";
import { saveAuth } from "../utils/auth";

export default function LoginPage() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        if (!email.trim()) {
            setError("Email is required.");
            return;
        }

        if (!password.trim()) {
            setError("Password is required.");
            return;
        }

        try {
            setLoading(true);

            const response = await login({
                email: email.trim(),
                password,
            });

            saveAuth(response);
            navigate("/dashboard");
        } catch (err: any) {
            console.error("LOGIN ERROR:", err);

            const message =
                err?.response?.data?.message ||
                err?.response?.data ||
                "Login failed. Please check your email and password.";

            setError(typeof message === "string" ? message : "Login failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                    "radial-gradient(circle at top left, rgba(37,99,235,0.18), transparent 25%), radial-gradient(circle at bottom right, rgba(79,70,229,0.15), transparent 30%), linear-gradient(180deg, #f7f9fd 0%, #eef3fb 100%)",
                p: 3,
            }}
        >
            <Card
                sx={{
                    width: "100%",
                    maxWidth: 460,
                    borderRadius: 4,
                    border: "1px solid rgba(226,232,240,0.9)",
                    boxShadow: "0 22px 50px rgba(15, 23, 42, 0.08)",
                    bgcolor: "rgba(255,255,255,0.97)",
                }}
            >
                <CardContent sx={{ p: 4 }}>
                    <Box sx={{ mb: 3, textAlign: "center" }}>
                        <Typography
                            variant="h4"
                            component="h1"
                            sx={{
                                fontWeight: 800,
                                color: "#111827",
                                lineHeight: 1.1,
                                mb: 1,
                            }}
                        >
                            Team Workload System
                        </Typography>

                        <Typography
                            variant="body2"
                            sx={{
                                color: "#6b7280",
                                lineHeight: 1.6,
                            }}
                        >
                            Login to continue
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2.25, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2.25,
                        }}
                    >
                        <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            placeholder="Enter your email"
                            variant="outlined"
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Email fontSize="small" />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />

                        <TextField
                            fullWidth
                            label="Password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            placeholder="Enter your password"
                            variant="outlined"
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Lock fontSize="small" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() =>
                                                    setShowPassword((prev) => !prev)
                                                }
                                                edge="end"
                                            >
                                                {showPassword ? (
                                                    <VisibilityOff fontSize="small" />
                                                ) : (
                                                    <Visibility fontSize="small" />
                                                )}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading}
                            sx={{
                                mt: 0.5,
                                py: 1.6,
                                borderRadius: 2.5,
                                fontWeight: 800,
                                fontSize: "1rem",
                                textTransform: "none",
                                background:
                                    "linear-gradient(135deg, #2563eb, #1d4ed8)",
                                boxShadow:
                                    "0 12px 26px rgba(37, 99, 235, 0.22)",
                            }}
                        >
                            {loading ? "Signing in..." : "Login"}
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}