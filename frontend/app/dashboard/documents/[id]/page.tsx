"use client";

import { toast } from "sonner";
import { Send, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api, Document } from "@/lib/api";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://10.0.0.53:3000";

import Image from "next/image";

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();

  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPDF, setShowPDF] = useState(true); //set default to true for better UI

  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const documentId = params.id as string;

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

    //add user messages to chat
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
      //Remove the user message if failed
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

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      {/* Header - Compact */}
      <header className="bg-deep-charcoal/90 backdrop-blur-sm border-b border-off-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-muted-teal hover:text-muted-teal/80 flex items-center gap-1 transition-colors text-sm"
            >
              ← Back
            </button>
            <div className="h-4 w-px bg-off-white/20"></div>
            <Image
              src="/logo.png"
              alt="ScholarVault Logo"
              width={28}
              height={28}
            />
            <h1 className="text-lg font-bold text-off-white font-logo truncate">
              {document.title}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-screen px-4 sm:px-6 lg:px-8 py-4 h-[calc(100vh-4rem)]">
        <div className="w-full h-full mx-auto rounded-lg bg-deep-charcoal/80 backdrop-blur-sm border border-off-white/10 p-6 flex flex-row gap-1 overflow-hidden">
          {/* First Col - Metadata */}
          <div
            className="mx-auto transition-all duration-700 ease-in-out min-w-0 overflow-y-auto"
            style={{
              flex: showChat
                ? "0 0 calc(20% - 16px)"
                : showPDF
                ? "0 0 calc(20% - 16px)"
                : "1 1 auto",
            }}
          >
            <div
              className={`grid grid-cols-1 gap-1 transition-all duration-700 ease-in-out`}
            >
              {/* Authors */}
              {document.authors && document.authors.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-muted-teal mb-0.5">
                    Authors
                  </label>
                  <p className="text-off-white text-sm">
                    {document.authors.join(", ")}
                  </p>
                </div>
              )}

              {/* Year */}
              {document.year && (
                <div>
                  <label className="block text-xs font-medium text-muted-teal mb-0.5">
                    Year
                  </label>
                  <p className="text-off-white text-sm">{document.year}</p>
                </div>
              )}

              {/* Publication Type */}
              {document.publication_type && (
                <div>
                  <label className="block text-xs font-medium text-muted-teal mb-0.5">
                    Publication Type
                  </label>
                  <p className="text-off-white text-sm">
                    {document.publication_type}
                  </p>
                </div>
              )}

              {/* Journal */}
              {document.journal && (
                <div>
                  <label className="block text-xs font-medium text-muted-teal mb-0.5">
                    Journal
                  </label>
                  <p className="text-off-white text-sm">{document.journal}</p>
                </div>
              )}

              {/* Volume */}
              {document.volume && (
                <div>
                  <label className="block text-xs font-medium text-muted-teal mb-0.5">
                    Volume
                  </label>
                  <p className="text-off-white text-sm">{document.volume}</p>
                </div>
              )}

              {/* Issue */}
              {document.issue && (
                <div>
                  <label className="block text-xs font-medium text-muted-teal mb-0.5">
                    Issue
                  </label>
                  <p className="text-off-white text-sm">{document.issue}</p>
                </div>
              )}

              {/* Pages */}
              {document.pages && (
                <div>
                  <label className="block text-xs font-medium text-muted-teal mb-0.5">
                    Pages
                  </label>
                  <p className="text-off-white text-sm">{document.pages}</p>
                </div>
              )}

              {/* Publisher */}
              {document.publisher && (
                <div>
                  <label className="block text-xs font-medium text-muted-teal mb-0.5">
                    Publisher
                  </label>
                  <p className="text-off-white text-sm">{document.publisher}</p>
                </div>
              )}

              {/* DOI */}
              {document.doi && (
                <div>
                  <label className="block text-xs font-medium text-muted-teal mb-0.5">
                    DOI
                  </label>
                  <p className="text-off-white text-sm">{document.doi}</p>
                </div>
              )}

              {/* URL */}
              {document.url && (
                <div>
                  <label className="block text-xs font-medium text-muted-teal mb-0.5">
                    URL
                  </label>
                  <a
                    href={document.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-teal hover:text-muted-teal/80 break-all underline text-sm"
                  >
                    {document.url}
                  </a>
                </div>
              )}
            </div>

            {/* Keywords */}
            {document.keywords && document.keywords.length > 0 && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-off-white mb-2">
                  Keywords
                </label>
                <div className="flex flex-wrap gap-1">
                  {document.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-muted-teal/30 text-off-white border border-muted-teal/50 rounded-full text-sm font-medium"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Abstract - Hidden when chat is active */}
            <div
              className="mt-6 overflow-hidden transition-all duration-700 ease-in-out"
              style={{
                maxHeight: showChat ? "0px" : "2000px",
                opacity: showChat ? 0 : 1,
                marginTop: showChat ? "0px" : "24px",
              }}
            >
              {document.abstract_text && (
                <>
                  <label className="block text-sm font-medium text-muted-teal mb-2">
                    Abstract
                  </label>
                  <p className="text-off-white/90 whitespace-pre-wrap leading-relaxed">
                    {document.abstract_text}
                  </p>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap gap-1">
              <button
                onClick={() =>
                  router.push(`/dashboard/documents/${documentId}/edit`)
                }
                className="px-6 py-2.5 bg-muted-teal hover:bg-muted-teal/90 text-off-white font-semibold rounded-lg transition-colors"
              >
                Edit Document
              </button>

              {/* PDF Buttons */}
              {document.pdf_url && (
                <>
                  <button
                    onClick={() => setShowPDF(!showPDF)}
                    className="px-6 py-2.5 bg-muted-teal/20 hover:bg-muted-teal/30 text-off-white border border-muted-teal/30 font-semibold rounded-lg transition-colors"
                  >
                    {showPDF ? "Hide PDF" : "Show PDF"}
                  </button>

                  <button
                    onClick={() => setShowChat(!showChat)}
                    className="inline-flex items-center gap-1 px-6 py-2.5 bg-old-paper-yellow/20 hover:bg-old-paper-yellow/30 text-old-paper-yellow border border-old-paper-yellow/30 font-semibold rounded-lg transition-colors"
                  >
                    <MessageSquare className="h-4 w-4" />
                    {showChat ? "Hide Chat" : "Chat with Document"}
                  </button>

                  <a
                    href={`${API_BASE_URL}/${document.pdf_url}`}
                    download
                    className="inline-block px-6 py-2.5 bg-off-white/10 hover:bg-off-white/20 text-off-white border border-off-white/20 font-semibold rounded-lg transition-colors"
                  >
                    Download PDF
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Second Col - Chat (always in DOM, visibility controlled) */}
          {document.pdf_url && (
            <div
              className="transition-all duration-700 ease-in-out overflow-hidden min-w-0"
              style={{
                flex: showChat
                  ? showPDF
                    ? "0 0 calc(40% - 16px)"
                    : "0 0 calc(80% - 16px)"
                  : "0 0 0px",
                opacity: showChat ? 1 : 0,
                transform: showChat ? "translateX(0)" : "translateX(-20px)",
              }}
            >
              <div className="border border-off-white/20 rounded-lg overflow-hidden bg-deep-charcoal/50 flex flex-col h-full">
                <div className="bg-old-paper-yellow/20 px-4 py-3 border-b border-old-paper-yellow/30">
                  <h3 className="font-semibold text-off-white flex items-center gap-1">
                    <MessageSquare className="h-5 w-5 text-old-paper-yellow" />
                    Chat with Document
                  </h3>
                  <p className="text-sm text-off-white/70 mt-1">
                    Ask questions about this paper and get answers from an AI
                    that has read it.
                  </p>
                </div>

                {/* Messages */}
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

                {/* Input */}
                <div className="border-t border-off-white/20 p-4 bg-deep-charcoal/30">
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask a question about this paper..."
                      disabled={isSending}
                      className="flex-1 px-4 py-2 border border-off-white/20 bg-deep-charcoal/50 text-off-white placeholder:text-off-white/40 rounded-md focus:outline-none focus:ring-2 focus:ring-old-paper-yellow/50 focus:border-old-paper-yellow/50 disabled:opacity-50"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!chatInput.trim() || isSending}
                      className="px-4 py-2 bg-old-paper-yellow hover:bg-old-paper-yellow/90 text-deep-charcoal font-semibold rounded-md disabled:bg-off-white/20 disabled:text-off-white/40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
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

          {/* Third Col - PDF Viewer (always in DOM when PDF exists) */}
          {document.pdf_url && (
            <div
              className="transition-all duration-700 ease-in-out min-w-0 overflow-hidden"
              style={{
                flex: showPDF
                  ? showChat
                    ? "0 0 calc(40% - 16px)"
                    : "0 0 calc(80% - 16px)"
                  : "0 0 0px",
                opacity: showPDF ? 1 : 0,
                transform: showPDF ? "translateX(0)" : "translateX(20px)",
              }}
            >
              <iframe
                src={`${API_BASE_URL}/${document.pdf_url}`}
                className="w-full h-full border border-off-white/20 rounded-lg bg-white"
                title="PDF Viewer"
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
