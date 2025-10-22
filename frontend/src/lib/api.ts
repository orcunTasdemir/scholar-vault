const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export interface User {
    id: string;
    email: string;
    full_name: string | null;
}

export interface LoginResponse {
    token: string;
    user: User;
}

export interface Document {
    id: string;
    user_id: string;
    title: string;
    authors: string[] | null;
    year: number | null;
    publication_type: string | null;
    journal: string | null;
    volume: string | null;
    issue: string | null;
    pages: string | null;
    publisher: string | null;
    doi: string | null;
    url: string | null;
    abstract_text: string | null;
    keywords: string[] | null;
    pdf_url: string | null;
    created_at: string;
    updated_at: string;
}

class ApiClient {
    private getHeaders(token?: string): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers
    }
    // Endpoints
    async register(email: string, password: string, full_name?: string): Promise<User> {
        return {} as User;
    }
    async login(email: string, password: string): Promise<LoginResponse> {
        return {} as LoginResponse;
    }

    async getCurrentUser(token: string): Promise<User> {
        return {} as User;
    }

    async getDocuments(token: string): Promise<Document[]> {
        return {} as Document[];
    }

    async createDocument(token: string, document: Partial<Document>): Promise<Document> {
        return {} as Document;
    }

    async deleteDocument(token: string, documentId: string): Promise<void> {
    }
}

export const api = new ApiClient();