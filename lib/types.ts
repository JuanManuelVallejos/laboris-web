export interface Professional {
  id: string;
  name: string;
  trade: string;
  zone: string;
  bio: string;
  rating: number;
  verified: boolean;
  status: "active" | "suspended";
}
