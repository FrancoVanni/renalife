export interface Client {
    id: number;
    name: string;
    phone: string;
    rubro: string;
    company: string;
    notes?: string;
    created_at: Date;
    updated_at: Date;
}
