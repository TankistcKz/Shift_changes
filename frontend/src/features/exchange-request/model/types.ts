export interface ExchangeRequestFormValues {
  shiftId: string;
  targetShiftId: string;
  reason: string;
}

export type ExchangeRequestFormField = keyof ExchangeRequestFormValues;

export type ExchangeRequestFormErrors = Partial<Record<ExchangeRequestFormField, string>>;

export interface ExchangeRequestDraft {
  shiftId: number;
  targetShiftId: number;
  reason: string;
}

export interface ValidationContext {
  currentUserId: number;
  myShiftIds: number[];
  targetShiftOwners: Record<number, number>;
}
