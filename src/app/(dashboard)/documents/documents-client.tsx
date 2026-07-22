"use client";

import { useState, useTransition, useRef, useMemo } from "react";
import {
  IconFolder,
  IconPlus,
  IconSearch,
  IconTrash,
  IconDownload,
  IconEye,
  IconSparkles,
  IconFileText,
  IconFolderOpen,
  IconPhoto,
  IconFileCode,
  IconGridPattern,
  IconList,
  IconCloudUpload,
  IconBriefcase,
  IconUsers,
  IconAlertCircle,
  IconLoader,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { createDocument, deleteDocument } from "./actions";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export type DocumentItem = {
  id: string;
  name: string;
  type: string;
  r2Key: string;
  mimeType: string;
  size: number;
  projectId: string | null;
  projectName: string | null;
  clientId: string | null;
  clientName: string | null;
  uploadedBy: string;
  createdAt: string;
};

type DocumentsClientProps = {
  initialDocuments: DocumentItem[];
  projects: { id: string; name: string; clientId: string }[];
  clients: { id: string; name: string }[];
};

const CATEGORIES = [
  { id: "ALL", label: "All Files" },
  { id: "DESIGNS", label: "Designs" },
  { id: "PDFS", label: "PDFs" },
  { id: "LOGOS", label: "Logos" },
  { id: "DOCUMENTS", label: "Documents" },
  { id: "CLIENT_FILES", label: "Client Files" },
];

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const getFileUrl = (key?: string | null) => {
  if (!key) return "#";
  const trimmed = key.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    if (trimmed.includes("orvynlabs.r2.dev") || trimmed.includes("cloud.r2.dev")) {
      const fileName = trimmed.split("/").pop() || "document.pdf";
      return `/api/files/uploads/${fileName}`;
    }
    return trimmed;
  }
  if (trimmed.startsWith("/api/files/")) {
    return trimmed;
  }
  const cleanPath = trimmed.replace(/^\/+/, "");
  return `/api/files/${cleanPath}`;
};

const prefetchFile = (key?: string | null) => {
  const url = getFileUrl(key);
  if (url && url.startsWith("/api/files/")) {
    fetch(url, { priority: "high" }).catch(() => {});
  }
};

const getFileIcon = (type: string, mime: string) => {
  if (type === "DESIGNS" || mime.startsWith("image/")) {
    return <IconPhoto className="h-4.5 w-4.5 text-orange-500" />;
  }
  if (type === "LOGOS") {
    return <IconSparkles className="h-4.5 w-4.5 text-amber-500 animate-pulse" />;
  }
  if (type === "PDFS" || mime === "application/pdf") {
    return <IconFileText className="h-4.5 w-4.5 text-rose-500" />;
  }
  return <IconFileCode className="h-4.5 w-4.5 text-blue-500" />;
};

const getFolderColor = (index: number) => {
  const colors = [
    "bg-orange-50 dark:bg-orange-950/30 text-orange-500 border-orange-200/50 dark:border-orange-900/30 hover:border-orange-400",
    "bg-blue-50 dark:bg-blue-950/30 text-blue-500 border-blue-200/50 dark:border-blue-900/30 hover:border-blue-400",
    "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 border-emerald-200/50 dark:border-emerald-900/30 hover:border-emerald-400",
    "bg-purple-50 dark:bg-purple-950/30 text-purple-500 border-purple-200/50 dark:border-purple-900/30 hover:border-purple-400",
    "bg-rose-50 dark:bg-rose-950/30 text-rose-500 border-rose-200/50 dark:border-rose-900/30 hover:border-rose-400",
  ];
  return colors[index % colors.length];
};

export function DocumentsClient({
  initialDocuments,
  projects,
  clients,
}: DocumentsClientProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [selectedFolder, setSelectedFolder] = useState<string>("ALL");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  // Upload Form State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [mimeType, setMimeType] = useState("application/octet-stream");

  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("DESIGNS");
  const [projectId, setProjectId] = useState("");
  const [clientId, setClientId] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileSize, setFileSize] = useState(0);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsUploadingFile(true);
    setUploadProgress(20);
    setErrorMsg("");

    if (!fileName.trim()) {
      setFileName(file.name);
    }
    setFileSize(file.size);

    if (file.type.startsWith("image/")) {
      setFileType("DESIGNS");
    } else if (file.type === "application/pdf") {
      setFileType("PDFS");
    } else if (file.name.toLowerCase().includes("logo")) {
      setFileType("LOGOS");
    } else {
      setFileType("DOCUMENTS");
    }

    const progressTimer = setInterval(() => {
      setUploadProgress((p) => (p < 85 ? p + 15 : p));
    }, 150);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setUploadProgress(100);
        setFileUrl(data.url);
        setMimeType(data.mimeType || file.type || "application/octet-stream");
      } else {
        setErrorMsg(data.error || "Failed to upload file from device.");
        setUploadProgress(0);
      }
    } catch (err: any) {
      console.error("File upload error:", err);
      setErrorMsg("Failed to upload file. Please try again.");
      setUploadProgress(0);
    } finally {
      clearInterval(progressTimer);
      setIsUploadingFile(false);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFileUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) return;
    if (!fileUrl.trim()) {
      setErrorMsg("Please select a file from your system to upload.");
      return;
    }

    setErrorMsg("");
    startTransition(async () => {
      const selectedProj = projects.find((p) => p.id === projectId);
      const res = await createDocument({
        name: fileName.trim(),
        type: fileType,
        r2Key: fileUrl.trim(),
        mimeType: mimeType || (fileType === "PDFS" ? "application/pdf" : fileType === "DESIGNS" ? "image/png" : "application/octet-stream"),
        size: Number(fileSize) || 1024 * 50,
        projectId: projectId || undefined,
        clientId: clientId || selectedProj?.clientId || undefined,
      });

      if (res.success && res.data) {
        const doc = res.data;
        const newDoc: DocumentItem = {
          id: doc.id,
          name: doc.name,
          type: doc.type,
          r2Key: doc.r2Key,
          mimeType: doc.mimeType || "application/octet-stream",
          size: doc.size || 0,
          projectId: doc.projectId,
          projectName: projects.find((p) => p.id === doc.projectId)?.name || null,
          clientId: doc.clientId,
          clientName: clients.find((c) => c.id === doc.clientId)?.name || null,
          uploadedBy: "Co-Founder",
          createdAt: new Date().toISOString(),
        };

        setDocuments((prev) => [newDoc, ...prev]);
        setFileName("");
        setFileUrl("");
        setSelectedFile(null);
        setProjectId("");
        setClientId("");
        setIsSheetOpen(false);
      } else {
        setErrorMsg(res.error || "Failed to upload file");
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    setDocuments((prev) => prev.filter((d) => d.id !== id));
    startTransition(async () => {
      const res = await deleteDocument(id);
      if (!res.success) {
        alert(res.error || "Failed to delete file");
      }
    });
  };

  // Folder Aggregations (Memoized for Lightning Performance)
  const globalFilesCount = useMemo(() => {
    return documents.filter((d) => !d.projectId).length;
  }, [documents]);

  const projectFolders = useMemo(() => {
    return projects.map((p) => {
      const files = documents.filter((d) => d.projectId === p.id);
      const sizeSum = files.reduce((sum, f) => sum + f.size, 0);
      return {
        ...p,
        filesCount: files.length,
        sizeFormatted: formatBytes(sizeSum),
      };
    });
  }, [documents, projects]);

  // Filters application (Memoized for Sub-Millisecond Search)
  const filteredDocs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return documents.filter((d) => {
      if (selectedFolder !== "ALL") {
        if (selectedFolder === "GLOBAL" && d.projectId) return false;
        if (selectedFolder !== "GLOBAL" && d.projectId !== selectedFolder) return false;
      }
      if (activeCategory !== "ALL" && d.type !== activeCategory) return false;
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) ||
        (d.projectName && d.projectName.toLowerCase().includes(q)) ||
        (d.clientName && d.clientName.toLowerCase().includes(q))
      );
    });
  }, [documents, selectedFolder, activeCategory, searchQuery]);

  return (
    <div className="space-y-6 font-sans select-none text-text-primary">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-surface-white border border-border/80 rounded-2xl p-4 md:p-5 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-orange bg-brand-orange-tint px-2 py-0.5 rounded-md">
              Agency Files Storage
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-text-primary mt-1">
            Documents &amp; Assets Hub
          </h1>
          <p className="text-xs text-text-secondary font-medium">
            Browse creative designs, logos, client files, and contracts structured by active projects.
          </p>
        </div>

        {/* Upload File Drawer Trigger */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger
            render={
              <Button className="font-bold text-xs bg-brand-orange hover:bg-brand-orange-hover text-white py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-xs border-0 h-9 cursor-pointer active:scale-[0.98] transition-all">
                <IconPlus className="h-4 w-4" stroke={2.5} />
                Upload New Asset
              </Button>
            }
          />
          <SheetContent className="w-full max-w-[440px] p-5 bg-surface-white border-l border-border h-full flex flex-col justify-between overflow-y-auto">
            <form onSubmit={handleUploadSubmit} className="space-y-5">
              <SheetHeader>
                <SheetTitle className="text-base font-bold text-text-primary text-left flex items-center gap-2">
                  <IconCloudUpload className="h-4.5 w-4.5 text-brand-orange animate-bounce" />
                  Upload Document / Asset
                </SheetTitle>
                <SheetDescription className="text-xs text-text-secondary mt-0.5 text-left font-medium">
                  Register SVGs, PDFs, mockup designs, and spec sheets to client profiles.
                </SheetDescription>
              </SheetHeader>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-bold flex items-center gap-2">
                  <IconAlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Form Input: File Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary">
                  Asset / File Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Landing_Page_Layout_v2.png"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full h-10 px-3 bg-surface-page border border-border/80 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-orange"
                />
              </div>

              {/* Form Input: Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary">
                  Asset Type / Folder Category *
                </label>
                <select
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value)}
                  className="w-full h-10 px-3 bg-surface-page border border-border/80 rounded-xl text-xs font-bold text-text-primary focus:outline-none"
                >
                  <option value="DESIGNS">Designs (Figma / Mockups)</option>
                  <option value="PDFS">PDFs (Agreements / Reports)</option>
                  <option value="LOGOS">Logos &amp; SVG Vector Assets</option>
                  <option value="DOCUMENTS">Documents (TXT / Word Specs)</option>
                  <option value="CLIENT_FILES">Client Files (Onboarding / QA)</option>
                </select>
              </div>

              {/* Form Input: Project Link */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary flex items-center gap-1">
                  <IconBriefcase className="h-3.5 w-3.5 text-text-secondary" />
                  Link to Project (Optional)
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full h-10 px-3 bg-surface-page border border-border/80 rounded-xl text-xs font-semibold text-text-primary focus:outline-none"
                >
                  <option value="">Global / Unassigned Storage</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Form Input: Client Link fallback */}
              {!projectId && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-primary flex items-center gap-1">
                    <IconUsers className="h-3.5 w-3.5 text-text-secondary" />
                    Associate with Client (Optional)
                  </label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full h-10 px-3 bg-surface-page border border-border/80 rounded-xl text-xs font-semibold text-text-primary focus:outline-none"
                  >
                    <option value="">None / Internal File</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Native System File Picker Dropzone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary flex items-center justify-between">
                  <span>Upload File from Device *</span>
                  <span className="text-[10px] text-text-secondary font-medium">Mobile Gallery / Laptop Explorer</span>
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {!selectedFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border hover:border-brand-orange/60 bg-surface-page/50 rounded-xl p-5 text-center cursor-pointer transition-all group select-none"
                  >
                    <IconCloudUpload className="h-8 w-8 text-brand-orange mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-extrabold text-text-primary">
                      Tap or Click to Pick System File
                    </p>
                    <p className="text-[10px] text-text-secondary font-medium mt-0.5">
                      Select photo, document, PDF, zip, design file from your device
                    </p>
                  </div>
                ) : (
                  <div className="border border-brand-orange/40 bg-brand-orange-tint/10 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-brand-orange text-white flex items-center justify-center shrink-0 shadow-xs">
                          <IconFileText className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-text-primary truncate">
                            {selectedFile.name}
                          </p>
                          <p className="text-[10px] text-text-secondary font-medium">
                            {formatBytes(selectedFile.size)} • {isUploadingFile ? `Uploading (${uploadProgress}%)...` : "Uploaded & Ready"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isUploadingFile ? (
                          <IconLoader className="h-4 w-4 text-brand-orange animate-spin" />
                        ) : (
                          <button
                            type="button"
                            onClick={clearSelectedFile}
                            className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
                          >
                            Change
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {isUploadingFile && (
                      <div className="w-full bg-border/60 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-brand-orange h-full rounded-full transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 bg-brand-orange hover:bg-brand-orange-hover text-white font-bold text-xs h-10 rounded-xl border-0 cursor-pointer shadow-xs"
                >
                  {isPending ? "Uploading..." : "Save Asset"}
                </Button>
                <button
                  type="button"
                  onClick={() => setIsSheetOpen(false)}
                  className="px-4 h-10 border border-border rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {/* 📂 Project folders storage row - Mobile Snap Scroll / Desktop Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase text-text-secondary tracking-widest flex items-center gap-1.5">
            <IconFolder className="h-4 w-4 text-brand-orange" />
            <span>Project Folders Directory</span>
          </h2>
          <span className="text-[10px] font-bold text-text-secondary md:hidden">Swipe ➔</span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 pt-0.5 no-scrollbar snap-x snap-mandatory sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:overflow-visible">
          {/* ALL Folder */}
          <div
            onClick={() => setSelectedFolder("ALL")}
            className={`snap-start min-w-[200px] sm:min-w-0 p-3.5 border rounded-2xl cursor-pointer flex items-center gap-3 transition-all duration-200 active:scale-95 select-none touch-manipulation ${
              selectedFolder === "ALL"
                ? "bg-brand-orange-tint/50 border-brand-orange shadow-xs font-extrabold ring-1 ring-brand-orange/30"
                : "bg-surface-white border-border/80 hover:border-brand-orange/40 hover:-translate-y-0.5 shadow-3xs"
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-brand-orange flex items-center justify-center border border-brand-orange/20 shrink-0 shadow-3xs">
              <IconFolderOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-extrabold text-xs text-text-primary block truncate">
                All Project Files
              </span>
              <span className="text-[10px] font-bold text-text-secondary mt-0.5 block">
                {documents.length} Files
              </span>
            </div>
          </div>

          {/* Seeded Project Folders */}
          {projectFolders.map((p, idx) => {
            const folderStyle = getFolderColor(idx);
            const isSelected = selectedFolder === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedFolder(p.id)}
                className={`snap-start min-w-[200px] sm:min-w-0 p-3.5 border rounded-2xl cursor-pointer flex items-center gap-3 transition-all duration-200 active:scale-95 select-none touch-manipulation ${
                  isSelected
                    ? "bg-brand-orange-tint/50 border-brand-orange shadow-xs font-extrabold ring-1 ring-brand-orange/30"
                    : `bg-surface-white border-border/80 ${folderStyle} hover:-translate-y-0.5 shadow-3xs`
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-surface-page text-text-primary flex items-center justify-center border border-border/60 shrink-0 shadow-3xs">
                  <IconFolder className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-extrabold text-xs text-text-primary block truncate" title={p.name}>
                    {p.name}
                  </span>
                  <span className="text-[10px] font-bold text-text-secondary mt-0.5 block truncate">
                    {p.filesCount} Files • {p.sizeFormatted}
                  </span>
                </div>
              </div>
            );
          })}

          {/* General / Internal Folder */}
          <div
            onClick={() => setSelectedFolder("GLOBAL")}
            className={`snap-start min-w-[200px] sm:min-w-0 p-3.5 border rounded-2xl cursor-pointer flex items-center gap-3 transition-all duration-200 active:scale-95 select-none touch-manipulation ${
              selectedFolder === "GLOBAL"
                ? "bg-brand-orange-tint/50 border-brand-orange shadow-xs font-extrabold ring-1 ring-brand-orange/30"
                : "bg-surface-white border-border/80 hover:border-brand-orange/40 hover:-translate-y-0.5 shadow-3xs"
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-stone-500/10 text-stone-500 flex items-center justify-center border border-stone-200/20 shrink-0 shadow-3xs">
              <IconFolder className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-extrabold text-xs text-text-primary block truncate">
                General &amp; Internal Files
              </span>
              <span className="text-[10px] font-bold text-text-secondary mt-0.5 block">
                {globalFilesCount} Files
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 📁 Interactive Files manager toolbar */}
      <div className="bg-surface-white border border-border/80 rounded-2xl p-4 md:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-3.5">
          {/* Tab Filters - Touch friendly bar on mobile */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar sm:flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer active:scale-95 select-none touch-manipulation min-h-[38px] ${
                  activeCategory === cat.id
                    ? "bg-brand-orange text-white shadow-xs font-black"
                    : "bg-surface-page hover:bg-surface-page/80 text-text-secondary border border-border/60"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Right Toolbar Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative w-full sm:w-56">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary" />
              <input
                type="text"
                placeholder="Search file name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 h-8.5 bg-surface-page border border-border/80 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-orange"
              />
            </div>

            {/* Grid/List View Toggles */}
            <div className="flex items-center gap-0.5 bg-surface-page p-1 rounded-xl border border-border/80">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "grid" ? "bg-surface-white text-brand-orange shadow-3xs" : "text-stone-400"
                }`}
              >
                <IconGridPattern className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "list" ? "bg-surface-white text-brand-orange shadow-3xs" : "text-stone-400"
                }`}
              >
                <IconList className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 📋 Display Mode: Grid/List */}
        {filteredDocs.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredDocs.map((doc) => {
                const icon = getFileIcon(doc.type, doc.mimeType);
                return (
                  <div
                    key={doc.id}
                    className="bg-surface-page/40 hover:bg-surface-white border border-border/60 hover:border-brand-orange/30 rounded-2xl p-3.5 space-y-3 shadow-3xs hover:shadow-2xs transition-all duration-200 group/file flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Header: File type icon & Category badge */}
                      <div className="flex items-center justify-between">
                        <div className="h-8 w-8 rounded-lg bg-surface-white border border-border/60 flex items-center justify-center shadow-3xs">
                          {icon}
                        </div>
                        <span className="text-[8.5px] font-black uppercase tracking-wider text-brand-orange bg-brand-orange-tint px-2 py-0.5 rounded shadow-3xs">
                          {doc.type}
                        </span>
                      </div>

                      {/* File Info */}
                      <div>
                        <h4 className="font-extrabold text-[12.5px] text-text-primary truncate block" title={doc.name}>
                          {doc.name}
                        </h4>
                        <span className="text-[10px] font-bold text-text-secondary mt-0.5 block">
                          {formatBytes(doc.size)} • {new Date(doc.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-border/60 mt-3">
                      {/* Link Info (Project/Client) */}
                      <div className="space-y-1 text-[10px] font-bold text-text-secondary">
                        {doc.projectName && (
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="h-1.5 w-1.5 rounded-full bg-brand-orange" />
                            <span>Proj: {doc.projectName}</span>
                          </div>
                        )}
                        {doc.clientName && (
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            <span>Client: {doc.clientName}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-[9.5px]">
                          <span>By: {doc.uploadedBy}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <a
                          href={getFileUrl(doc.r2Key)}
                          onMouseEnter={() => prefetchFile(doc.r2Key)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 h-8 rounded-xl bg-surface-white hover:bg-brand-orange-tint/20 border border-border text-[11px] font-black text-text-primary flex items-center justify-center gap-1.5 hover:border-brand-orange hover:text-brand-orange transition-all cursor-pointer select-none active:scale-95 touch-manipulation shadow-3xs"
                        >
                          <IconEye className="h-3.5 w-3.5" />
                          <span>Preview</span>
                        </a>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="h-8 w-8 rounded-xl bg-surface-white border border-border text-stone-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 flex items-center justify-center transition-all cursor-pointer active:scale-95 touch-manipulation shadow-3xs"
                          title="Delete file"
                        >
                          <IconTrash className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="border border-border/80 rounded-2xl overflow-hidden shadow-3xs overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-page/80 border-b border-border text-[10px] font-extrabold uppercase text-text-secondary tracking-wider select-none">
                    <th className="p-3 pl-4">File Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Linked Project</th>
                    <th className="p-3">Client</th>
                    <th className="p-3">Uploaded By</th>
                    <th className="p-3">Size</th>
                    <th className="p-3">Date Added</th>
                    <th className="p-3 text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-surface-white">
                  {filteredDocs.map((doc) => {
                    const icon = getFileIcon(doc.type, doc.mimeType);
                    return (
                      <tr key={doc.id} className="hover:bg-surface-page/30 transition-colors">
                        <td className="p-3 pl-4 font-extrabold text-text-primary min-w-[200px]">
                          <div className="flex items-center gap-2">
                            {icon}
                            <span className="truncate max-w-[220px]" title={doc.name}>
                              {doc.name}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-[9px] font-black uppercase tracking-wider text-brand-orange bg-brand-orange-tint px-1.5 py-0.5 rounded shadow-3xs">
                            {doc.type}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-text-secondary max-w-[150px] truncate">
                          {doc.projectName || "Global"}
                        </td>
                        <td className="p-3 font-semibold text-text-secondary max-w-[150px] truncate">
                          {doc.clientName || "—"}
                        </td>
                        <td className="p-3 font-semibold text-text-secondary">
                          {doc.uploadedBy}
                        </td>
                        <td className="p-3 font-bold text-text-primary">
                          {formatBytes(doc.size)}
                        </td>
                        <td className="p-3 text-text-secondary font-medium">
                          {new Date(doc.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="p-3 text-right pr-4 select-none">
                          <div className="inline-flex items-center gap-1.5">
                            <a
                              href={getFileUrl(doc.r2Key)}
                              onMouseEnter={() => prefetchFile(doc.r2Key)}
                              target="_blank"
                              rel="noreferrer"
                              className="h-8 px-2.5 rounded-xl bg-surface-white border border-border text-[11px] font-black text-text-primary inline-flex items-center gap-1 hover:border-brand-orange hover:text-brand-orange transition-all cursor-pointer select-none active:scale-95 touch-manipulation shadow-3xs"
                            >
                              <IconEye className="h-3.5 w-3.5" />
                              <span>View</span>
                            </a>
                            <button
                              onClick={() => handleDelete(doc.id)}
                              className="h-8 w-8 rounded-xl bg-surface-white border border-border text-stone-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 flex items-center justify-center transition-all cursor-pointer active:scale-95 touch-manipulation shadow-3xs"
                              title="Delete file"
                            >
                              <IconTrash className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="bg-surface-page/30 border border-dashed border-border/80 rounded-2xl p-10 text-center space-y-2">
            <IconFolderOpen className="h-8 w-8 text-brand-orange mx-auto opacity-75 animate-pulse" />
            <h3 className="text-sm font-black text-text-primary">No assets found</h3>
            <p className="text-xs text-text-secondary font-semibold max-w-sm mx-auto">
              No files match your search criteria. Try modifying your search or upload a new file above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
