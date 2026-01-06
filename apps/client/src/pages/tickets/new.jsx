// src/pages/tickets/new.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  ArrowLeft,
  Paperclip,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import { useUser } from "../../store/session";
import { Button } from "../../shadcn/ui/button";
import { Input } from "../../shadcn/ui/input";
import { Textarea } from "../../shadcn/ui/textarea";
import { Label } from "../../shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../shadcn/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../shadcn/ui/card";
import { Separator } from "../../shadcn/ui/separator";
import { Alert, AlertDescription } from "../../shadcn/ui/alert";

const NewTicket = () => {
  const navigate = useNavigate();
  const { fetchWithAuth, isAdmin, isAgent } = useUser();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "",
    email: "",
    clientId: "",
  });
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [activeTemplateId, setActiveTemplateId] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setAttachments([...attachments, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.error("Title and description are required.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetchWithAuth("/v1/ticket/create", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error("Failed to create ticket");

      const result = await response.json();
      toast.success("Ticket created successfully!");

      if (attachments.length > 0 && result.ticket?._id) {
        await uploadAttachments(result.ticket._id);
      }

      navigate(isAgent ? "/agents/tickets/open" : "/admin/tickets/open");
    } catch (err) {
      toast.error(`Error creating ticket: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const uploadAttachments = async (ticketId) => {
    const fd = new FormData();
    attachments.forEach((file) => {
      fd.append("files", file);
    });
    fd.append("ticketId", ticketId);

    try {
      await fetchWithAuth("/v1/ticket/upload", {
        method: "POST",
        body: fd,
      });
      toast.success(`${attachments.length} file(s) uploaded`);
    } catch (err) {
      console.error("Failed to upload attachments:", err);
    }
  };

  const ticketTemplates = [
    {
      id: "bug",
      name: "Bug Report",
      title: "[BUG] ",
      description:
        "**Steps to Reproduce:**\n1. \n2. \n3. \n\n**Expected Behavior:**\n\n**Actual Behavior:**\n\n**Environment:**\n- OS: \n- Browser: \n- Version: ",
    },
    {
      id: "feature",
      name: "Feature Request",
      title: "[FEATURE] ",
      description:
        "**Description:**\n\n**Business Value:**\n\n**Acceptance Criteria:**\n1. \n2. \n3. ",
    },
    {
      id: "question",
      name: "Question",
      title: "[QUESTION] ",
      description:
        "**Question:**\n\n**What I've tried:**\n\n**Additional context:**",
    },
  ];

  const applyTemplate = (templateId) => {
    const template = ticketTemplates.find((t) => t.id === templateId);
    if (template) {
      setFormData({
        ...formData,
        title: template.title,
        description: template.description,
      });
      setActiveTemplateId(templateId);
      toast.success(`${template.name} template applied`);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      priority: "medium",
      category: "",
      email: "",
      clientId: "",
    });
    setActiveTemplateId(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:px-5 sm:py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2 text-xs text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Create New Ticket
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Submit a new support request or issue for your customer.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)] gap-6">
        {/* Main Form */}
        <div className="space-y-4">
          <Card className="border-slate-200 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg text-slate-900">
                Ticket Details
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-slate-500">
                Provide clear information so our team can respond quickly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Templates */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Quick Templates
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {ticketTemplates.map((template) => (
                      <Button
                        key={template.id}
                        type="button"
                        variant={
                          activeTemplateId === template.id
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        className={cn(
                          "rounded-full px-3 py-1 text-xs",
                          activeTemplateId === template.id &&
                            "bg-indigo-600 text-white border-indigo-600"
                        )}
                        onClick={() => applyTemplate(template.id)}
                      >
                        {template.name}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-slate-500"
                      onClick={resetForm}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                <Separator className="my-2" />

                <div className="space-y-5">
                  {/* Basics */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Basics
                      </p>
                      <Label
                        htmlFor="title"
                        className="mb-1.5 block text-sm text-slate-700"
                      >
                        Title <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Brief summary of the issue"
                        required
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="description"
                        className="mb-1.5 block text-sm text-slate-700"
                      >
                        Description <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={7}
                        placeholder="Provide detailed information about the issue..."
                        required
                        className="text-sm"
                      />
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                        <HelpCircle className="h-4 w-4" />
                        <span>
                          You can use Markdown for formatting (## headers,
                          **bold**, `code`).
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Classification */}
                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      Classification
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label
                          htmlFor="priority"
                          className="mb-1.5 block text-sm text-slate-700"
                        >
                          Priority
                        </Label>
                        <Select
                          value={formData.priority}
                          onValueChange={(value) =>
                            handleSelectChange("priority", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">
                              <div className="flex items-center gap-2 text-sm">
                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                Low Priority
                              </div>
                            </SelectItem>
                            <SelectItem value="medium">
                              <div className="flex items-center gap-2 text-sm">
                                <div className="h-2 w-2 rounded-full bg-indigo-500" />
                                Medium Priority
                              </div>
                            </SelectItem>
                            <SelectItem value="high">
                              <div className="flex items-center gap-2 text-sm">
                                <div className="h-2 w-2 rounded-full bg-red-500" />
                                High Priority
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label
                          htmlFor="category"
                          className="mb-1.5 block text-sm text-slate-700"
                        >
                          Category
                        </Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) =>
                            handleSelectChange("category", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bug">Bug</SelectItem>
                            <SelectItem value="feature">
                              Feature Request
                            </SelectItem>
                            <SelectItem value="question">Question</SelectItem>
                            <SelectItem value="technical">
                              Technical Issue
                            </SelectItem>
                            <SelectItem value="billing">Billing</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Client info */}
                  {(isAdmin || !isAgent) &&
                    <div className="space-y-3">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Client Info
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label
                            htmlFor="email"
                            className="mb-1.5 block text-sm text-slate-700"
                          >
                            Client Email
                          </Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="client@example.com"
                            className="text-sm"
                          />
                        </div>

                        <div>
                          <Label
                            htmlFor="clientId"
                            className="mb-1.5 block text-sm text-slate-700"
                          >
                            Client (Optional)
                          </Label>
                          <Input
                            id="clientId"
                            name="clientId"
                            value={formData.clientId}
                            onChange={handleChange}
                            placeholder="Client ID or leave blank"
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>}

                  {/* Attachments */}
                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      Attachments
                    </p>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50/60 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors">
                      <input
                        type="file"
                        id="file-upload"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <Paperclip className="h-7 w-7 text-slate-400" />
                        <p className="text-sm text-slate-700">
                          Drag & drop files here or click to browse
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Max file size: 10MB each
                        </p>
                      </label>
                    </div>

                    {attachments.length > 0 &&
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          Selected Files
                        </p>
                        {attachments.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-200"
                          >
                            <div className="flex items-center gap-2">
                              <Paperclip className="h-4 w-4 text-slate-400" />
                              <span className="text-xs sm:text-sm text-slate-800">
                                {file.name}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-xs text-slate-500"
                              onClick={() => removeAttachment(index)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>}
                  </div>
                </div>

                <Separator />

                <div className="flex flex-col sm:flex-row justify-between gap-3 sm:items-center">
                  <div className="text-[11px] text-slate-500">
                    Fields marked with{" "}
                    <span className="text-red-500 font-semibold">*</span> are
                    required.
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(-1)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      size="sm"
                      className="gap-2"
                    >
                      {loading
                        ? <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            Creating...
                          </>
                        : <>
                            <Plus className="h-4 w-4" />
                            Create Ticket
                          </>}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Guidelines Card */}
          <Card className="border-slate-200 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm sm:text-base">
                Tips for Better Tickets
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Clear, detailed tickets get resolved much faster.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-indigo-500 mt-1" />
                  <span>Be specific and descriptive in the title.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-indigo-500 mt-1" />
                  <span>Include steps to reproduce for bugs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-indigo-500 mt-1" />
                  <span>Attach screenshots, logs, or recordings.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-indigo-500 mt-1" />
                  <span>Mention expected vs actual behavior.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-indigo-500 mt-1" />
                  <span>Include environment details (OS, browser, version).</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Priority Guide */}
          <Card className="border-slate-200 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm sm:text-base">
                Priority Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 border border-red-200 bg-red-50 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="font-semibold text-sm text-red-800">
                    High Priority
                  </span>
                </div>
                <p className="text-xs text-red-900/80">
                  System down, critical bugs, or security issues.
                </p>
              </div>

              <div className="p-3 border border-indigo-200 bg-indigo-50 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-3 w-3 rounded-full bg-indigo-500" />
                  <span className="font-semibold text-sm text-indigo-800">
                    Medium Priority
                  </span>
                </div>
                <p className="text-xs text-indigo-900/80">
                  Major functionality issues impacting many users.
                </p>
              </div>

              <div className="p-3 border border-emerald-200 bg-emerald-50 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-sm text-emerald-800">
                    Low Priority
                  </span>
                </div>
                <p className="text-xs text-emerald-900/80">
                  Minor issues, feature requests, or general questions.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* SLA / Alert */}
          <Alert className="border-amber-200 bg-amber-50/80 rounded-2xl">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-xs sm:text-sm text-amber-900 mt-1.5">
              Tickets are typically responded to within{" "}
              <span className="font-semibold">24 hours</span> for high priority,{" "}
              <span className="font-semibold">48 hours</span> for medium, and{" "}
              <span className="font-semibold">72 hours</span> for low priority.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
};

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default NewTicket;