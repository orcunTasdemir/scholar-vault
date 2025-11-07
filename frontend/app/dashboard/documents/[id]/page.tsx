"use client";

import { toast } from "sonner";
import { Send, MessageSquare, Copy } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api, Document } from "@/lib/api";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://10.0.0.53:3000";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import DocumentHeader from "@/components/layout/DocumentHeader";

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();

  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPDF, setShowPDF] = useState(true);

  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [citationFormat, setCitationFormat] = useState<
    "APA" | "MLA" | "Chicago" | "IEEE" | "BibTeX"
  >("APA");
  const [generatedCitation, setGeneratedCitation] = useState("");

  const documentId = params.id as string;

  // Calculate layout mode
  const isExpanded = !showChat && !showPDF;

  useEffect(() => {
    const fetchDocument = async () => {
      if (!token) return;

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/documents/${documentId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch document");
        }
        const data = await response.json();
        setDocument(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load document"
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocument();
  }, [token, documentId]);

  const generateCitation = useCallback(
    (format: typeof citationFormat): string => {
      if (!document) return "";

      const authors = document.authors?.join(", ") || "Unknown Author";
      const year = document.year || "n.d.";
      const title = document.title;
      const journal = document.journal || "";
      const volume = document.volume || "";
      const issue = document.issue || "";
      const pages = document.pages || "";
      const doi = document.doi || "";
      const url = document.url || "";

      switch (format) {
        case "APA":
          let apa = `${authors}. (${year}). ${title}.`;
          if (journal) apa += ` ${journal}`;
          if (volume) apa += `, ${volume}`;
          if (issue) apa += `(${issue})`;
          if (pages) apa += `, ${pages}`;
          if (doi) apa += `. https://doi.org/${doi}`;
          return apa;

        case "MLA":
          let mla = `${authors}. "${title}."`;
          if (journal) mla += ` ${journal}`;
          if (volume) mla += `, vol. ${volume}`;
          if (issue) mla += `, no. ${issue}`;
          mla += `, ${year}`;
          if (pages) mla += `, pp. ${pages}`;
          mla += `.`;
          return mla;

        case "Chicago":
          let chicago = `${authors}. "${title}."`;
          if (journal) chicago += ` ${journal}`;
          if (volume) chicago += ` ${volume}`;
          if (issue) chicago += `, no. ${issue}`;
          chicago += ` (${year})`;
          if (pages) chicago += `: ${pages}`;
          chicago += `.`;
          return chicago;

        case "IEEE":
          let ieee = `${authors}, "${title},"`;
          if (journal) ieee += ` ${journal}`;
          if (volume) ieee += `, vol. ${volume}`;
          if (issue) ieee += `, no. ${issue}`;
          if (pages) ieee += `, pp. ${pages}`;
          ieee += `, ${year}.`;
          return ieee;

        case "BibTeX":
          const firstAuthor =
            document.authors?.[0]?.split(" ").pop()?.toLowerCase() || "unknown";
          const bibKey = `${firstAuthor}${year}${title
            .split(" ")[0]
            .toLowerCase()}`;
          let bibtex = `@article{${bibKey},\n`;
          bibtex += `  author = {${authors}},\n`;
          bibtex += `  title = {${title}},\n`;
          if (journal) bibtex += `  journal = {${journal}},\n`;
          if (volume) bibtex += `  volume = {${volume}},\n`;
          if (issue) bibtex += `  number = {${issue}},\n`;
          if (pages) bibtex += `  pages = {${pages}},\n`;
          bibtex += `  year = {${year}}`;
          if (doi) bibtex += `,\n  doi = {${doi}}`;
          if (url) bibtex += `,\n  url = {${url}}`;
          bibtex += `\n}`;
          return bibtex;

        default:
          return "";
      }
    },
    [document]
  );

  useEffect(() => {
    if (document) {
      setGeneratedCitation(generateCitation(citationFormat));
    }
  }, [citationFormat, document, generateCitation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-deep-charcoal">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-muted-teal border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-off-white">Loading document...</div>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-deep-charcoal">
        <div className="text-destructive bg-destructive/10 border border-destructive px-6 py-4 rounded-lg">
          {error || "Document not found"}
        </div>
      </div>
    );
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !token || isSending) return;

    const userMessage = chatInput.trim();
    setChatInput("");

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsSending(true);

    try {
      const response = await api.chatWithDocument(
        token,
        documentId,
        userMessage
      );
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response },
      ]);
    } catch (error) {
      console.error("Chat error: ", error);
      toast.error("Failed to send message");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyCitation = () => {
    navigator.clipboard.writeText(generatedCitation);
    toast.success("Citation copied to clipboard!");
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      <DocumentHeader
        title={document.title}
        backPath="/dashboard"
        backText="Back"
      />

      {/* Main Content */}
      <main className="w-screen px-2 sm:px-2 lg:px-2 py-2 h-[calc(100vh-4rem)]">
        <div className="w-full h-full mx-auto rounded-lg bg-deep-charcoal/80 backdrop-blur-sm border border-off-white/10 p-6 flex flex-row gap-6 overflow-hidden">
          {/* Metadata Panel - Responsive Layout */}
          <div
            className="min-w-0 overflow-y-auto transition-all duration-500 ease-in-out pr-2 custom-scrollbar"
            style={{
              flex: showChat
                ? "0 0 calc(20% - 16px)"
                : showPDF
                ? "0 0 calc(20% - 16px)"
                : "1 1 auto",
            }}
          >
            <div
              className={`transition-all duration-500 pr-2 ${
                isExpanded ? "grid grid-cols-2 gap-8" : "grid grid-cols-1 gap-4"
              }`}
            >
              {/* LEFT COLUMN - Main Metadata */}
              <div className="space-y-4">
                {/* Authors */}
                {document.authors && document.authors.length > 0 && (
                  <div>
                    <label
                      className={`block font-semibold text-old-paper-yellow mb-1 ${
                        isExpanded ? "text-sm" : "text-xs"
                      }`}
                    >
                      Authors
                    </label>
                    <p
                      className={`text-off-white ${
                        isExpanded ? "text-base leading-relaxed" : "text-sm"
                      }`}
                    >
                      {document.authors.join(", ")}
                    </p>
                  </div>
                )}

                {/* Year */}
                {document.year && (
                  <div>
                    <label
                      className={`block font-semibold text-old-paper-yellow mb-1 ${
                        isExpanded ? "text-sm" : "text-xs"
                      }`}
                    >
                      Year
                    </label>
                    <p
                      className={`text-off-white ${
                        isExpanded ? "text-base" : "text-sm"
                      }`}
                    >
                      {document.year}
                    </p>
                  </div>
                )}

                {/* Publication Type */}
                {document.publication_type && (
                  <div>
                    <label
                      className={`block font-semibold text-old-paper-yellow mb-1 ${
                        isExpanded ? "text-sm" : "text-xs"
                      }`}
                    >
                      Publication Type
                    </label>
                    <p
                      className={`text-off-white ${
                        isExpanded ? "text-base" : "text-sm"
                      }`}
                    >
                      {document.publication_type}
                    </p>
                  </div>
                )}

                {/* Journal */}
                {document.journal && (
                  <div>
                    <label
                      className={`block font-semibold text-old-paper-yellow mb-1 ${
                        isExpanded ? "text-sm" : "text-xs"
                      }`}
                    >
                      Journal
                    </label>
                    <p
                      className={`text-off-white ${
                        isExpanded ? "text-base" : "text-sm"
                      }`}
                    >
                      {document.journal}
                    </p>
                  </div>
                )}

                {/* Volume */}
                {document.volume && (
                  <div>
                    <label
                      className={`block font-semibold text-old-paper-yellow mb-1 ${
                        isExpanded ? "text-sm" : "text-xs"
                      }`}
                    >
                      Volume
                    </label>
                    <p
                      className={`text-off-white ${
                        isExpanded ? "text-base" : "text-sm"
                      }`}
                    >
                      {document.volume}
                    </p>
                  </div>
                )}

                {/* Issue */}
                {document.issue && (
                  <div>
                    <label
                      className={`block font-semibold text-old-paper-yellow mb-1 ${
                        isExpanded ? "text-sm" : "text-xs"
                      }`}
                    >
                      Issue
                    </label>
                    <p
                      className={`text-off-white ${
                        isExpanded ? "text-base" : "text-sm"
                      }`}
                    >
                      {document.issue}
                    </p>
                  </div>
                )}

                {/* Pages */}
                {document.pages && (
                  <div>
                    <label
                      className={`block font-semibold text-old-paper-yellow mb-1 ${
                        isExpanded ? "text-sm" : "text-xs"
                      }`}
                    >
                      Pages
                    </label>
                    <p
                      className={`text-off-white ${
                        isExpanded ? "text-base" : "text-sm"
                      }`}
                    >
                      {document.pages}
                    </p>
                  </div>
                )}

                {/* Publisher */}
                {document.publisher && (
                  <div>
                    <label
                      className={`block font-semibold text-old-paper-yellow mb-1 ${
                        isExpanded ? "text-sm" : "text-xs"
                      }`}
                    >
                      Publisher
                    </label>
                    <p
                      className={`text-off-white ${
                        isExpanded ? "text-base" : "text-sm"
                      }`}
                    >
                      {document.publisher}
                    </p>
                  </div>
                )}

                {/* DOI */}
                {document.doi && (
                  <div>
                    <label
                      className={`block font-semibold text-old-paper-yellow mb-1 ${
                        isExpanded ? "text-sm" : "text-xs"
                      }`}
                    >
                      DOI
                    </label>
                    <p
                      className={`text-off-white ${
                        isExpanded ? "text-base" : "text-sm"
                      }`}
                    >
                      {document.doi}
                    </p>
                  </div>
                )}

                {/* URL */}
                {document.url && (
                  <div>
                    <label
                      className={`block font-semibold text-old-paper-yellow mb-1 ${
                        isExpanded ? "text-sm" : "text-xs"
                      }`}
                    >
                      URL
                    </label>
                    <a
                      href={document.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-old-paper-yellow hover:text-old-paper-yellow/80 break-all underline transition-colors ${
                        isExpanded ? "text-base" : "text-sm"
                      }`}
                    >
                      {document.url}
                    </a>
                  </div>
                )}

                {/* Action Buttons - Only in compact mode */}
                {!isExpanded && (
                  <div className="mt-6 flex flex-col gap-2">
                    <button
                      onClick={() =>
                        router.push(`/dashboard/documents/${documentId}/edit`)
                      }
                      className="w-full px-4 py-2 bg-muted-teal hover:bg-muted-teal/90 text-off-white font-semibold rounded-lg transition-colors text-sm"
                    >
                      Edit Document
                    </button>

                    {document.pdf_url && (
                      <>
                        <button
                          onClick={() => setShowPDF(!showPDF)}
                          className="w-full px-4 py-2 bg-muted-teal/20 hover:bg-muted-teal/30 text-off-white border border-muted-teal/50 font-semibold rounded-lg transition-colors text-sm"
                        >
                          {showPDF ? "Hide PDF" : "Show PDF"}
                        </button>

                        <button
                          onClick={() => setShowChat(!showChat)}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-old-paper-yellow/20 hover:bg-old-paper-yellow/30 text-old-paper-yellow border border-old-paper-yellow/50 font-semibold rounded-lg transition-colors text-sm"
                        >
                          <MessageSquare className="h-4 w-4" />
                          {showChat ? "Hide Chat" : "Chat with Document"}
                        </button>

                        <a
                          href={`${API_BASE_URL}/${document.pdf_url}`}
                          download
                          className="w-full inline-block text-center px-4 py-2 bg-off-white/10 hover:bg-off-white/20 text-off-white border border-off-white/30 font-semibold rounded-lg transition-colors text-sm"
                        >
                          Download PDF
                        </a>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN - Keywords, Abstract, Citation */}
              <div className="space-y-6">
                {/* Keywords */}
                {document.keywords && document.keywords.length > 0 && (
                  <div>
                    <label
                      className={`block font-semibold text-old-paper-yellow mb-2 ${
                        isExpanded ? "text-base" : "text-sm"
                      }`}
                    >
                      Keywords
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {document.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className={`px-3 py-1.5 bg-old-paper-yellow/20 text-old-paper-yellow border border-old-paper-yellow/40 rounded-full font-medium transition-colors hover:bg-old-paper-yellow/30 ${
                            isExpanded ? "text-sm" : "text-xs"
                          }`}
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Abstract */}
                {document.abstract_text && (
                  <div>
                    <label
                      className={`block font-semibold text-old-paper-yellow mb-2 ${
                        isExpanded ? "text-base" : "text-sm"
                      }`}
                    >
                      Abstract
                    </label>
                    <p
                      className={`text-off-white/90 whitespace-pre-wrap leading-relaxed ${
                        isExpanded ? "text-base" : "text-sm"
                      }`}
                    >
                      {document.abstract_text}
                    </p>
                  </div>
                )}

                {/* Citation Exporter */}
                <div className="space-y-3">
                  <label
                    className={`block font-semibold text-old-paper-yellow ${
                      isExpanded ? "text-base" : "text-sm"
                    }`}
                  >
                    Export Citation
                  </label>

                  <Select
                    value={citationFormat}
                    onValueChange={(value) =>
                      setCitationFormat(value as typeof citationFormat)
                    }
                  >
                    <SelectTrigger className="w-[180px] text-old-paper-yellow">
                      <SelectValue placeholder="Select a Citation Style" />
                    </SelectTrigger>
                    <SelectContent
                      className={`w-full px-4 py-2.5 bg-deep-charcoal/90 border border-old-paper-yellow/30 text-old-paper-yellow rounded-lg focus:outline-none focus:ring-2 focus:ring-old-paper-yellow/50 transition-colors ${
                        isExpanded ? "text-base" : "text-sm"
                      }`}
                    >
                      <SelectGroup>
                        {["APA", "MLA", "Chicago", "IEEE", "BibTeX"].map(
                          (style) => (
                            <SelectItem
                              key={style}
                              value={style}
                              className="hover:bg-deep-charcoal/70 hover:text-old-paper-yellow data-highlighted:bg-off-white/10 data-highlighted:text-old-paper-yellow"
                            >
                              {style === "Chicago"
                                ? "Chicago (Author-Date)"
                                : style === "APA"
                                ? "APA (7th Edition)"
                                : style === "MLA"
                                ? "MLA (9th Edition)"
                                : style}
                            </SelectItem>
                          )
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  {/* <select
                    value={citationFormat}
                    onChange={(e) =>
                      setCitationFormat(e.target.value as typeof citationFormat)
                    }
                    className={`w-full px-4 py-2.5 bg-deep-charcoal/50 border border-old-paper-yellow/30 text-off-white rounded-lg focus:outline-none focus:ring-2 focus:ring-old-paper-yellow/50 focus:border-old-paper-yellow transition-colors ${
                      isExpanded ? "text-base" : "text-sm"
                    }`}
                  >
                    <option value="APA">APA (7th Edition)</option>
                    <option value="MLA">MLA (9th Edition)</option>
                    <option value="Chicago">Chicago (Author-Date)</option>
                    <option value="IEEE">IEEE</option>
                    <option value="BibTeX">BibTeX</option>
                  </select> */}

                  {generatedCitation && (
                    <div className="relative">
                      <div
                        className={`p-4 bg-off-white/5 border border-old-paper-yellow/30 rounded-lg text-off-white font-mono whitespace-pre-wrap break-words ${
                          isExpanded ? "text-sm" : "text-xs"
                        }`}
                      >
                        {generatedCitation}
                      </div>
                      <button
                        onClick={handleCopyCitation}
                        className={`absolute top-2 right-2 p-2 bg-old-paper-yellow hover:bg-old-paper-yellow/90 text-deep-charcoal rounded-md transition-colors ${
                          isExpanded ? "" : "scale-90"
                        }`}
                        title="Copy to clipboard"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Action Buttons - Only in expanded mode */}
                {isExpanded && (
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button
                      onClick={() =>
                        router.push(`/dashboard/documents/${documentId}/edit`)
                      }
                      className="px-6 py-3 bg-muted-teal hover:bg-muted-teal/90 text-off-white font-semibold rounded-lg transition-colors text-base"
                    >
                      Edit Document
                    </button>

                    {document.pdf_url && (
                      <>
                        <button
                          onClick={() => setShowPDF(!showPDF)}
                          className="px-6 py-3 bg-muted-teal/20 hover:bg-muted-teal/30 text-off-white border border-muted-teal/50 font-semibold rounded-lg transition-colors text-base"
                        >
                          Show PDF
                        </button>

                        <button
                          onClick={() => setShowChat(!showChat)}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-old-paper-yellow/20 hover:bg-old-paper-yellow/30 text-old-paper-yellow border border-old-paper-yellow/50 font-semibold rounded-lg transition-colors text-base"
                        >
                          <MessageSquare className="h-5 w-5" />
                          Chat with Document
                        </button>

                        <a
                          href={`${API_BASE_URL}/${document.pdf_url}`}
                          download
                          className="inline-block px-6 py-3 bg-off-white/10 hover:bg-off-white/20 text-off-white border border-off-white/30 font-semibold rounded-lg transition-colors text-base"
                        >
                          Download PDF
                        </a>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat Panel */}
          {document.pdf_url && (
            <div
              className="transition-all duration-500 ease-in-out overflow-hidden min-w-0"
              style={{
                flex: showChat
                  ? showPDF
                    ? "0 0 calc(40% - 16px)"
                    : "0 0 calc(80% - 16px)"
                  : "0 0 0px",
                opacity: showChat ? 1 : 0,
                visibility: showChat ? "visible" : "hidden",
              }}
            >
              <div className="border border-old-paper-yellow/30 rounded-lg overflow-hidden bg-deep-charcoal/50 flex flex-col h-full">
                <div className="bg-old-paper-yellow/10 px-4 py-3 border-b border-old-paper-yellow/30">
                  <h3 className="font-semibold text-off-white flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-old-paper-yellow" />
                    Chat with Document
                  </h3>
                  <p className="text-sm text-off-white/70 mt-1">
                    Ask questions about this paper and get AI-powered answers
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-off-white/60 mt-20">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 text-old-paper-yellow/50" />
                      <p className="font-medium text-off-white">
                        Start a conversation
                      </p>
                      <p className="text-sm mt-1">
                        Ask questions about the paper&apos;s methodology,
                        findings, or implications
                      </p>
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          msg.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            msg.role === "user"
                              ? "bg-old-paper-yellow/90 text-deep-charcoal"
                              : "bg-off-white/10 text-off-white border border-off-white/20"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  {isSending && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-lg px-4 py-2 bg-off-white/10 border border-off-white/20">
                        <p className="text-sm text-off-white/70">Thinking...</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-old-paper-yellow/30 p-4 bg-deep-charcoal/30">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask a question about this paper..."
                      disabled={isSending}
                      className="flex-1 px-4 py-2 border border-old-paper-yellow/30 bg-deep-charcoal/50 text-off-white placeholder:text-off-white/40 rounded-md focus:outline-none focus:ring-2 focus:ring-old-paper-yellow/50 focus:border-old-paper-yellow disabled:opacity-50"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!chatInput.trim() || isSending}
                      className="px-4 py-2 bg-old-paper-yellow hover:bg-old-paper-yellow/90 text-deep-charcoal font-semibold rounded-md disabled:bg-off-white/20 disabled:text-off-white/40 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                      <Send className="h-4 w-4" />
                      Send
                    </button>
                  </div>
                  <p className="text-xs text-off-white/50 mt-2">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PDF Viewer */}
          {document.pdf_url && (
            <div
              className="transition-all duration-500 ease-in-out min-w-0 overflow-hidden"
              style={{
                flex: showPDF
                  ? showChat
                    ? "0 0 calc(40% - 16px)"
                    : "0 0 calc(80% - 16px)"
                  : "0 0 0px",
                opacity: showPDF ? 1 : 0,
                visibility: showPDF ? "visible" : "hidden",
              }}
            >
              <iframe
                src={`${API_BASE_URL}/${document.pdf_url}`}
                className="w-full h-full border border-muted-teal/30 rounded-lg bg-white"
                title="PDF Viewer"
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
