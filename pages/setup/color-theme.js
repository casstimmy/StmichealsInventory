"use client";
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import Loader from "@/components/Loader";
import { apiClient } from "@/lib/api-client";
import { useTheme, applyThemeToDOM } from "@/components/ThemeProvider";
import { Palette, RotateCcw, Save, Check } from "lucide-react";

const PRESETS = [
  {
    name: "Default Blue",
    primaryColor: "#0ea5e9",
    secondaryColor: "#06b6d4",
    sidebarActiveGradientFrom: "#2563eb",
    sidebarActiveGradientTo: "#1d4ed8",
    tableHeaderGradientFrom: "#0284c7",
    tableHeaderGradientTo: "#0369a1",
    buttonPrimaryBg: "#0284c7",
    buttonPrimaryHover: "#0369a1",
  },
  {
    name: "Indigo",
    primaryColor: "#6366f1",
    secondaryColor: "#8b5cf6",
    sidebarActiveGradientFrom: "#4f46e5",
    sidebarActiveGradientTo: "#4338ca",
    tableHeaderGradientFrom: "#4f46e5",
    tableHeaderGradientTo: "#4338ca",
    buttonPrimaryBg: "#4f46e5",
    buttonPrimaryHover: "#4338ca",
  },
  {
    name: "Emerald",
    primaryColor: "#10b981",
    secondaryColor: "#14b8a6",
    sidebarActiveGradientFrom: "#059669",
    sidebarActiveGradientTo: "#047857",
    tableHeaderGradientFrom: "#059669",
    tableHeaderGradientTo: "#047857",
    buttonPrimaryBg: "#059669",
    buttonPrimaryHover: "#047857",
  },
  {
    name: "Rose",
    primaryColor: "#f43f5e",
    secondaryColor: "#fb7185",
    sidebarActiveGradientFrom: "#e11d48",
    sidebarActiveGradientTo: "#be123c",
    tableHeaderGradientFrom: "#e11d48",
    tableHeaderGradientTo: "#be123c",
    buttonPrimaryBg: "#e11d48",
    buttonPrimaryHover: "#be123c",
  },
  {
    name: "Amber",
    primaryColor: "#f59e0b",
    secondaryColor: "#d97706",
    sidebarActiveGradientFrom: "#d97706",
    sidebarActiveGradientTo: "#b45309",
    tableHeaderGradientFrom: "#d97706",
    tableHeaderGradientTo: "#b45309",
    buttonPrimaryBg: "#d97706",
    buttonPrimaryHover: "#b45309",
  },
  {
    name: "Slate",
    primaryColor: "#64748b",
    secondaryColor: "#475569",
    sidebarActiveGradientFrom: "#475569",
    sidebarActiveGradientTo: "#334155",
    tableHeaderGradientFrom: "#475569",
    tableHeaderGradientTo: "#334155",
    buttonPrimaryBg: "#475569",
    buttonPrimaryHover: "#334155",
  },
];

const FIELD_LABELS = {
  primaryColor: "Primary Color",
  secondaryColor: "Secondary Color",
  sidebarActiveGradientFrom: "Sidebar Active (From)",
  sidebarActiveGradientTo: "Sidebar Active (To)",
  tableHeaderGradientFrom: "Table Header (From)",
  tableHeaderGradientTo: "Table Header (To)",
  buttonPrimaryBg: "Button Primary",
  buttonPrimaryHover: "Button Primary Hover",
  pageBg: "Page Background",
  successColor: "Success",
  warningColor: "Warning",
  errorColor: "Error",
  infoColor: "Info",
};

const DEFAULT_THEME = {
  primaryColor: "#0ea5e9",
  secondaryColor: "#06b6d4",
  sidebarBg: "#f9fafb",
  sidebarActiveGradientFrom: "#2563eb",
  sidebarActiveGradientTo: "#1d4ed8",
  tableHeaderGradientFrom: "#0284c7",
  tableHeaderGradientTo: "#0369a1",
  buttonPrimaryBg: "#0284c7",
  buttonPrimaryHover: "#0369a1",
  pageBg: "#f9fafb",
  successColor: "#10b981",
  warningColor: "#f59e0b",
  errorColor: "#ef4444",
  infoColor: "#3b82f6",
  presetName: "Default Blue",
};

export default function ColorThemePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState(DEFAULT_THEME);
  const themeCtx = useTheme();

  useEffect(() => {
    apiClient
      .get("/api/setup/color-theme")
      .then((res) => {
        const t = res.data?.theme;
        if (t) {
          setForm({
            primaryColor: t.primaryColor || DEFAULT_THEME.primaryColor,
            secondaryColor: t.secondaryColor || DEFAULT_THEME.secondaryColor,
            sidebarBg: t.sidebarBg || DEFAULT_THEME.sidebarBg,
            sidebarActiveGradientFrom: t.sidebarActiveGradientFrom || DEFAULT_THEME.sidebarActiveGradientFrom,
            sidebarActiveGradientTo: t.sidebarActiveGradientTo || DEFAULT_THEME.sidebarActiveGradientTo,
            tableHeaderGradientFrom: t.tableHeaderGradientFrom || DEFAULT_THEME.tableHeaderGradientFrom,
            tableHeaderGradientTo: t.tableHeaderGradientTo || DEFAULT_THEME.tableHeaderGradientTo,
            buttonPrimaryBg: t.buttonPrimaryBg || DEFAULT_THEME.buttonPrimaryBg,
            buttonPrimaryHover: t.buttonPrimaryHover || DEFAULT_THEME.buttonPrimaryHover,
            pageBg: t.pageBg || DEFAULT_THEME.pageBg,
            successColor: t.successColor || DEFAULT_THEME.successColor,
            warningColor: t.warningColor || DEFAULT_THEME.warningColor,
            errorColor: t.errorColor || DEFAULT_THEME.errorColor,
            infoColor: t.infoColor || DEFAULT_THEME.infoColor,
            presetName: t.presetName || DEFAULT_THEME.presetName,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Live preview as user changes colors
  useEffect(() => {
    applyThemeToDOM(form);
  }, [form]);

  function handlePreset(preset) {
    setForm((prev) => ({
      ...prev,
      ...preset,
    }));
  }

  function handleReset() {
    setForm(DEFAULT_THEME);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await apiClient.put("/api/setup/color-theme", form);
      const t = res.data?.theme;
      if (t && themeCtx) {
        themeCtx.setTheme(t);
        applyThemeToDOM(t);
        localStorage.setItem("system-theme", JSON.stringify(t));
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to save theme");
    } finally {
      setSaving(false);
    }
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value, presetName: "Custom" }));
  }

  if (loading) return <Layout><Loader /></Layout>;

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="page-title flex items-center gap-3">
              <Palette className="w-7 h-7" style={{ color: form.primaryColor }} />
              System Color Theme
            </h1>
            <p className="page-subtitle">
              Customize the application color scheme. Changes preview in real-time.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
            >
              <RotateCcw size={16} /> Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white transition shadow-sm"
              style={{ backgroundColor: form.buttonPrimaryBg }}
            >
              {saved ? <Check size={16} /> : <Save size={16} />}
              {saving ? "Saving..." : saved ? "Saved!" : "Save Theme"}
            </button>
          </div>
        </div>

        {/* Presets */}
        <div className="content-card mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Presets</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePreset(preset)}
                className={`relative p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                  form.presetName === preset.name
                    ? "border-gray-800 shadow-md"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex gap-1.5 mb-3 justify-center">
                  <div
                    className="w-6 h-6 rounded-full border border-gray-200"
                    style={{ backgroundColor: preset.primaryColor }}
                  />
                  <div
                    className="w-6 h-6 rounded-full border border-gray-200"
                    style={{ backgroundColor: preset.secondaryColor }}
                  />
                  <div
                    className="w-6 h-6 rounded-full border border-gray-200"
                    style={{ backgroundColor: preset.sidebarActiveGradientFrom }}
                  />
                </div>
                <p className="text-xs font-medium text-gray-700 text-center">{preset.name}</p>
                {form.presetName === preset.name && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center">
                    <Check size={12} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Color Fields */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Main Colors */}
          <div className="content-card">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Main Colors</h3>
            <div className="space-y-4">
              {["primaryColor", "secondaryColor"].map((field) => (
                <ColorField
                  key={field}
                  label={FIELD_LABELS[field]}
                  value={form[field]}
                  onChange={(val) => updateField(field, val)}
                />
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="content-card">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Sidebar & Navigation</h3>
            <div className="space-y-4">
              {["sidebarActiveGradientFrom", "sidebarActiveGradientTo"].map((field) => (
                <ColorField
                  key={field}
                  label={FIELD_LABELS[field]}
                  value={form[field]}
                  onChange={(val) => updateField(field, val)}
                />
              ))}
              {/* Preview */}
              <div
                className="h-10 rounded-lg shadow-inner flex items-center px-4 text-white text-sm font-medium"
                style={{
                  background: `linear-gradient(to right, ${form.sidebarActiveGradientFrom}, ${form.sidebarActiveGradientTo})`,
                }}
              >
                Active menu item preview
              </div>
            </div>
          </div>

          {/* Tables */}
          <div className="content-card">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Table Headers</h3>
            <div className="space-y-4">
              {["tableHeaderGradientFrom", "tableHeaderGradientTo"].map((field) => (
                <ColorField
                  key={field}
                  label={FIELD_LABELS[field]}
                  value={form[field]}
                  onChange={(val) => updateField(field, val)}
                />
              ))}
              {/* Preview */}
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <div
                  className="px-4 py-3 text-white text-sm font-semibold flex gap-8"
                  style={{
                    background: `linear-gradient(to right, ${form.tableHeaderGradientFrom}, ${form.tableHeaderGradientTo})`,
                  }}
                >
                  <span>Column 1</span><span>Column 2</span><span>Column 3</span>
                </div>
                <div className="px-4 py-3 text-sm text-gray-600 bg-white border-t">
                  Sample row data
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="content-card">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Buttons</h3>
            <div className="space-y-4">
              {["buttonPrimaryBg", "buttonPrimaryHover"].map((field) => (
                <ColorField
                  key={field}
                  label={FIELD_LABELS[field]}
                  value={form[field]}
                  onChange={(val) => updateField(field, val)}
                />
              ))}
              {/* Button preview */}
              <div className="flex gap-3">
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white transition"
                  style={{ backgroundColor: form.buttonPrimaryBg }}
                >
                  Primary Button
                </button>
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white transition"
                  style={{ backgroundColor: form.buttonPrimaryHover }}
                >
                  Hover State
                </button>
              </div>
            </div>
          </div>

          {/* Status Colors */}
          <div className="content-card lg:col-span-2">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Status Colors</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {["successColor", "warningColor", "errorColor", "infoColor"].map((field) => (
                <ColorField
                  key={field}
                  label={FIELD_LABELS[field]}
                  value={form[field]}
                  onChange={(val) => updateField(field, val)}
                />
              ))}
            </div>
            {/* Status preview */}
            <div className="flex flex-wrap gap-3 mt-4">
              <span className="px-3 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: form.successColor }}>Success</span>
              <span className="px-3 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: form.warningColor }}>Warning</span>
              <span className="px-3 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: form.errorColor }}>Error</span>
              <span className="px-3 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: form.infoColor }}>Info</span>
            </div>
          </div>

          {/* Page Background */}
          <div className="content-card lg:col-span-2">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Page Background</h3>
            <ColorField
              label={FIELD_LABELS.pageBg}
              value={form.pageBg}
              onChange={(val) => updateField("pageBg", val)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border-2 border-gray-200 cursor-pointer p-0.5"
          style={{ backgroundColor: value }}
        />
      </div>
      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-600">{label}</label>
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="w-full text-sm border border-gray-200 rounded px-2 py-1 font-mono"
          maxLength={7}
        />
      </div>
    </div>
  );
}
