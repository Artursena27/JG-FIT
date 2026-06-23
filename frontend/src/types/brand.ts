export interface BrandConfig {
  name: string;
  slogan: string;
  logoUrl?: string;
  colors: {
    primary: string;       // ex: #a3e635 (lime-400)
    primaryHover: string;  // ex: #84cc16 (lime-600)
    accent: string;        // ex: #1e293b (slate-800)
    bg: string;            // ex: #090d16 (dark slate/navy background)
    bgSecondary: string;   // ex: #0f172a (card/secondary background)
    border: string;        // ex: #1e293b (border color)
    text: string;          // ex: #f8fafc (white text)
    textSecondary: string; // ex: #94a3b8 (gray text)
  };
}
