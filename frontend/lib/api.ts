const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://10.0.0.53:3000";

export interface User {
    id: string;
    email: string;
    username: string | null;
    profile_image_url: string | null;
    subscription_tier: string;
    subscription_status: string;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    subscription_start_date: string | null;
    subscription_end_date: string | null;
    trial_end_date: string | null;
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


export interface Collection {
    id: string;
    user_id: string;
    name: string;
    parent_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface SearchResult extends Document {
    matched_fields: string[];
}


export interface SubscriptionInfo {
    tier: 'student' | 'researcher' | 'academic' | 'scholar';
    status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
    trial_end_date: string | null;
    subscription_end_date: string | null;
    is_trial_active: boolean;
}

export interface CreateCheckoutSessionRequest {
    tier: 'student' | 'researcher' | 'academic' | 'scholar';
    billing_period: 'monthly' | 'yearly';
}

export interface CheckoutSessionResponse {
    checkout_url: string;
    session_id: string;
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
    async register(email: string, password: string, username?: string): Promise<User> {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ email, password, username }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Registration failed');
        }
        return response.json();
    }

    async login(email: string, password: string): Promise<LoginResponse> {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
        }
        return response.json();
    }

    async getCurrentUser(token: string): Promise<User> {
        const response = await fetch(`${API_BASE_URL}/api/user/me`, {
            headers: this.getHeaders(token),
        });

        if (!response.ok) {
            throw new Error('Failed to get current user');
        }
        return response.json();
    }

    async getDocuments(token: string): Promise<Document[]> {
        const response = await fetch(`${API_BASE_URL}/api/documents`, {
            headers: this.getHeaders(token),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch documents');
        }
        return response.json();
    }


    async searchDocuments(token: string, query: string, collectionId?: string | null): Promise<SearchResult[]> {
        const params = new URLSearchParams({ q: query });
        if (collectionId) {
            params.append('collection_id', collectionId);
        }

        const url = `${API_BASE_URL}/api/documents/search?${params.toString()}`;
        console.log('[api.searchDocuments] Fetching:', url, 'collectionId:', collectionId);

        const response = await fetch(
            url,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error("Failed to search documents");
        }

        const results = await response.json();
        console.log('[api.searchDocuments] Response:', results.length, 'results');
        return results;
    }



    async chatWithDocument(token: string, documentId: string, message: string): Promise<string> {
        const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}/chat`, {
            method: 'POST',
            headers: this.getHeaders(token),
            body: JSON.stringify({ message }),
        });

        if (!response.ok) {
            throw new Error('Failed to chat with the document');
        }


        const data = await response.json();
        return data.response;
    }

    async createDocument(token: string, document: Partial<Document>): Promise<Document> {
        const response = await fetch(`${API_BASE_URL}/api/documents`, {
            method: 'POST',
            headers: this.getHeaders(token),
            body: JSON.stringify(document),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create document');
        }

        return response.json();
    }

    async deleteDocument(token: string, documentId: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}`, {
            method: 'DELETE',
            headers: this.getHeaders(token),
        });

        if (!response.ok) {
            throw new Error('Failed to delete document');
        }
    }

    async getDocument(token: string, documentId: string): Promise<Document> {
        const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}`, {
            headers: this.getHeaders(token),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch document');
        }
        return response.json();
    }

    async updateDocument(token: string, documentId: string, updates: Partial<Document>): Promise<Document> {
        const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}`, {
            method: 'PUT',
            headers: this.getHeaders(token),
            body: JSON.stringify(updates),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update document');
        }
        return response.json();
    }

    // Profile methods
    async updateProfile(token: string, username: string | null): Promise<User> {
        const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
            method: 'PUT',
            headers: this.getHeaders(token),
            body: JSON.stringify({ username }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update profile');
        }
        return response.json();
    }

    async uploadProfileImage(token: string, file: File): Promise<User> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/api/user/profile-image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                // Don't set Content-Type - browser sets it automatically with boundary for multipart
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to upload profile image');
        }
        return response.json();
    }

    async deleteProfileImage(token: string): Promise<User> {
        const response = await fetch(`${API_BASE_URL}/api/user/profile-image`, {
            method: 'DELETE',
            headers: this.getHeaders(token),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete profile image');
        }
        return response.json();
    }



    async getCollections(token: string): Promise<Collection[]> {
        const response = await fetch(`${API_BASE_URL}/api/collections`, {
            headers: this.getHeaders(token),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch collections');
        }
        return response.json();
    }

    async createCollection(token: string, name: string, parent_id: string | null): Promise<Collection> {
        const response = await fetch(`${API_BASE_URL}/api/collections`, {
            method: 'POST',
            headers: this.getHeaders(token),
            body: JSON.stringify({ name, parent_id }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create collection');
        }
        return response.json();
    }

    async updateCollection(token: string, collectionId: string, updates: { name?: string; parent_id?: string | null }): Promise<Collection> {
        const response = await fetch(`${API_BASE_URL}/api/collections/${collectionId}`, {
            method: 'PUT',
            headers: this.getHeaders(token),
            body: JSON.stringify(updates),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update collection');
        }
        return response.json();
    }

    async deleteCollection(token: string, collectionId: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/api/collections/${collectionId}`, {
            method: 'DELETE',
            headers: this.getHeaders(token),
        });

        if (!response.ok) {
            throw new Error('Failed to delete collection');
        }
    }

    async getCollectionDocuments(token: string, collectionId: string): Promise<Document[]> {
        const response = await fetch(`${API_BASE_URL}/api/collections/${collectionId}/documents`, {
            headers: this.getHeaders(token),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch collection documents');
        }
        return response.json();
    }

    async addDocumentToCollection(token: string, collectionId: string, documentId: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/api/collections/${collectionId}/documents/${documentId}`, {
            method: 'POST',
            headers: this.getHeaders(token),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add document to collection');
        }
    }

    async removeDocumentFromCollection(token: string, collectionId: string, documentId: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/api/collections/${collectionId}/documents/${documentId}`, {
            method: 'DELETE',
            headers: this.getHeaders(token),
        });

        if (!response.ok) {
            throw new Error('Failed to remove document from collection');
        }
    }
    // Get subscription information
    async getSubscriptionInfo(token: string): Promise<SubscriptionInfo> {
        const response = await fetch(`${API_BASE_URL}/api/subscriptions/info`, {
            headers: this.getHeaders(token),
        });
        if (!response.ok) {
            throw new Error('Failed to fetch subscription info');
        }
        return response.json();
    }

    // Create Stripe checkout session
    async createCheckoutSession(
        token: string,
        request: CreateCheckoutSessionRequest
    ): Promise<CheckoutSessionResponse> {
        const response = await fetch(`${API_BASE_URL}/api/subscriptions/checkout`, {
            method: 'POST',
            headers: this.getHeaders(token),
            body: JSON.stringify(request),
        });
        if (!response.ok) {
            throw new Error('Failed to create checkout session');
        }
        return response.json();
    }

    // Cancel subscription
    async cancelSubscription(token: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/api/subscriptions/cancel`, {
            method: 'POST',
            headers: this.getHeaders(token),
        });
        if (!response.ok) {
            throw new Error('Failed to cancel subscription');
        }
    }
}

export const api = new ApiClient();