export interface Consultation {
    id: number;
    userId: number;
    expertId: number;
    price: number;
    country: string;
    region: string;
    city: string;
    streetAddress: string;
    scheduledDate: string;
    status: string;
    createdAt: string;
    hours: number;
}