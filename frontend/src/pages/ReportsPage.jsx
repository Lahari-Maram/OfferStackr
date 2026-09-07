import { useState, useRef } from "react";
import { toast } from "react-toastify";
import {
  Download,
  Upload,
  FileSpreadsheet
} from "lucide-react";
import api from "../api/axios";
import Layout from "../components/Layout";
import "../styles/resumes.css";

export default function ReportsPage() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const csvFileRef = useRef(null);

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await api.get("/jobs/export/csv", { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `offerstackr_backup_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Complete CSV report exported!");
    } catch {
      toast.error("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImporting(true);
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/jobs/import/csv", fd);
      setImportResults(res.data);
      toast.success(res.data.message || "Import completed!");
    } catch (error) {
      const errDetail = error.response?.data?.detail;
      toast.error(typeof errDetail === "string" ? errDetail : "Failed to import CSV file");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  return (
    <Layout>
      <div className="resumes-page-container">
        {/* HEADER */}
        <div className="page-header-row">
          <div>
            <h1>Data Reports & CSV Backup</h1>
            <p>Export your full application dataset for backup or analysis, or import from external spreadsheets.</p>
          </div>
        </div>

        {/* EXPORT CARD */}
        <div className="resume-section-card">
          <div className="section-card-header">
            <div>
              <h3>Export Application Dataset</h3>
              <p>Download your complete job application records including companies, roles, interview dates, recruiter contacts, and notes.</p>
            </div>
          </div>

          <div className="report-action-box">
            <div className="report-icon-info">
              <FileSpreadsheet size={36} className="doc-icon" />
              <div>
                <strong>Complete Applications CSV</strong>
                <p>Includes all extended metadata columns compatible with Excel, Google Sheets, and OfferStackr imports.</p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleExport}
              disabled={exporting}
            >
              <Download size={16} />
              <span>{exporting ? "Generating CSV..." : "Export Full CSV"}</span>
            </button>
          </div>
        </div>

        {/* IMPORT CARD */}
        <div className="resume-section-card">
          <div className="section-card-header">
            <div>
              <h3>Import Applications from CSV</h3>
              <p>Upload a CSV file with your existing job applications. Columns like Company, Role, Status, and Dates will be automatically mapped.</p>
            </div>
          </div>

          <div className="resume-empty-dropzone" onClick={() => csvFileRef.current?.click()}>
            <Upload size={36} className="upload-icon" />
            <h4>{importing ? "Processing CSV Import..." : "Select or Drop a CSV File"}</h4>
            <p>Supports UTF-8 CSV exports from LinkedIn, spreadsheets, or OfferStackr backups.</p>
            <button type="button" className="btn btn-secondary btn-sm" disabled={importing}>
              Choose CSV File
            </button>
          </div>

          <input
            ref={csvFileRef}
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={handleImport}
          />

          {importResults && (
            <div className="import-feedback-box">
              <h4>Import Summary</h4>
              <p>
                Successfully imported <strong>{importResults.imported_count}</strong> application(s).
                {importResults.skipped_count > 0 && ` (${importResults.skipped_count} row(s) skipped due to missing company name)`}
              </p>
              {importResults.errors && importResults.errors.length > 0 && (
                <ul className="import-errors-list">
                  {importResults.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
