"use client";

import { toast } from "sonner";
import { Send, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api, Document } from "@/lib/api";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://10.0.0.57:3000";

import Image from "next/image";

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();

  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPDF, setShowPDF] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error || "Document not found"}</div>
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
    <div className="min-h-screen ">
      {/* Header */}
      <header className=" shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-1"
          >
            ← Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="ScholarVault Logo"
              width={40}
              height={40}
            />
            <h1 className="text-2xl font-bold text-gray-900">
              {document.title}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Authors */}
            {document.authors && document.authors.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Authors
                </label>
                <p className="text-gray-900">{document.authors.join(", ")}</p>
              </div>
            )}

            {/* Year */}
            {document.year && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <p className="text-gray-900">{document.year}</p>
              </div>
            )}

            {/* Publication Type */}
            {document.publication_type && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Publication Type
                </label>
                <p className="text-gray-900">{document.publication_type}</p>
              </div>
            )}

            {/* Journal */}
            {document.journal && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Journal
                </label>
                <p className="text-gray-900">{document.journal}</p>
              </div>
            )}

            {/* Volume */}
            {document.volume && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Volume
                </label>
                <p className="text-gray-900">{document.volume}</p>
              </div>
            )}

            {/* Issue */}
            {document.issue && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issue
                </label>
                <p className="text-gray-900">{document.issue}</p>
              </div>
            )}

            {/* Pages */}
            {document.pages && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pages
                </label>
                <p className="text-gray-900">{document.pages}</p>
              </div>
            )}

            {/* Publisher */}
            {document.publisher && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Publisher
                </label>
                <p className="text-gray-900">{document.publisher}</p>
              </div>
            )}

            {/* DOI */}
            {document.doi && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DOI
                </label>
                <p className="text-gray-900">{document.doi}</p>
              </div>
            )}

            {/* URL */}
            {document.url && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <a
                  href={document.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 break-all"
                >
                  {document.url}
                </a>
              </div>
            )}
          </div>

          {/* Keywords */}
          {document.keywords && document.keywords.length > 0 && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keywords
              </label>
              <div className="flex flex-wrap gap-2">
                {document.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Abstract */}
          {document.abstract_text && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Abstract
              </label>
              <p className="text-gray-900 whitespace-pre-wrap">
                {document.abstract_text}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex gap-4">
            <button
              onClick={() =>
                router.push(`/dashboard/documents/${documentId}/edit`)
              }
              className="inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Edit Document
            </button>

            {/* PDF Buttons */}
            {document.pdf_url && (
              <>
                <button
                  onClick={() => setShowPDF(!showPDF)}
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {showPDF ? "Hide PDF" : "Show PDF"}
                </button>

                <button
                  onClick={() => setShowChat(!showChat)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  <MessageSquare className="h-4 w-4" />
                  {showChat ? "Hide Chat" : "Chat with Document"}
                </button>

                <a
                  href={`${API_BASE_URL}/${document.pdf_url}`}
                  download
                  className="inline-block px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Download PDF
                </a>
              </>
            )}
          </div>

          {/* PDF Viewer */}
          {document.pdf_url && showPDF && (
            <div className="mt-6">
              <iframe
                src={`${API_BASE_URL}/${document.pdf_url}`}
                className="w-full h-[800px] border border-gray-300 rounded-md"
                title="PDF Viewer"
              />
            </div>
          )}

          {/* Chat Interface */}
          {document.pdf_url && showChat && (
            <div className="mt-6 border border-gray-300 rounded-lg overflow-hidden">
              <div className="bg-purple-50 px-4 py-3 border-b border-gray-300">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Chat with Document
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Ask questions about this paper and get answers from an AI that
                  has read it.
                </p>
              </div>

              {/* Messages */}
              <div className="h-[400px] overflow-y-auto p-4 space-y-4 bg-white">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-20">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="font-medium">Start a conversation</p>
                    <p className="text-sm mt-1">
                      Ask questions about the paper's methodology, findings, or
                      implications
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
                            ? "bg-purple-600 text-white"
                            : "bg-gray-100 text-gray-900"
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
                    <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gray-100">
                      <p className="text-sm text-gray-500">Thinking...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-gray-300 p-4 bg-gray-50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask a question about this paper..."
                    disabled={isSending}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isSending}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Send
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
