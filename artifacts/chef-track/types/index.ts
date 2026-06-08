export type Role = "boss" | "chef";

export interface BossCredentials {
  email: string;
  password: string;
  name: string;
}

export interface Chef {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: number;
  order: number;
  dailyTarget: number | null;
}

export interface Session {
  role: Role;
  userId: string;
  startedAt: number;
}

export interface Objective {
  id: string;
  texts: string[];
  date: string;
  createdAt: number;
}

export interface WorkSession {
  id: string;
  userId: string;
  role: Role;
  checkInAt: number;
  checkOutAt: number | null;
}

export interface ProductionItem {
  name: string;
  color: string;
  quantity: string;
  note: string;
}

export interface Production {
  id: string;
  chefId: string;
  chefName: string;
  items: ProductionItem[];
  createdAt: number;
  editableUntil: number;
}

export interface ProblemReport {
  id: string;
  chefId: string;
  chefName: string;
  type: string;
  note: string;
  stoppedAt: number;
  resumedAt: number;
  createdAt: number;
  editableUntil: number;
}

export interface Reminder {
  id: string;
  message: string;
  createdAt: number;
  seenBy: string[];
}

export interface CallRequest {
  id: string;
  chefId: string;
  chefName: string;
  createdAt: number;
  seen: boolean;
}
