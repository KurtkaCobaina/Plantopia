
export interface Expert {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    specialization: string;
    experienceYears: number;
    hourlyRate: number;
    isAvailable: boolean;
    country?: string;
    region?: string;
    city?: string;
}