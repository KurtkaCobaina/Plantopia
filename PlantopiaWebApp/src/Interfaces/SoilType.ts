export interface SoilType {
    id: number;
    name: string;
    phLevelMin: number | null;
    phLevelMax: number | null;
    nCorrectionFactor: number;
    pCorrectionFactor: number;
    kCorrectionFactor: number;
}