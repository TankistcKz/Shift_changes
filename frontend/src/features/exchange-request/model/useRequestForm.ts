import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Shift } from '../../../entities/shift/model/types';
import type {
  ExchangeRequestDraft,
  ExchangeRequestFormErrors,
  ExchangeRequestFormField,
  ExchangeRequestFormValues,
  ValidationContext,
} from './types';
import { validateExchangeRequest } from './validation';

const EMPTY_VALUES: ExchangeRequestFormValues = {
  shiftId: '',
  targetShiftId: '',
  reason: '',
};

interface UseRequestFormOptions {
  open: boolean;
  shifts: Shift[];
  currentUserId: number;
  onSubmit: (draft: ExchangeRequestDraft) => Promise<void>;
}

export interface UseRequestFormResult {
  values: ExchangeRequestFormValues;
  errors: ExchangeRequestFormErrors;
  touched: Partial<Record<ExchangeRequestFormField, boolean>>;
  submitting: boolean;
  submitAttempted: boolean;
  setField: (field: ExchangeRequestFormField, value: string) => void;
  handleBlur: (field: ExchangeRequestFormField) => void;
  handleSubmit: () => Promise<void>;
}

export function useRequestForm({
  open,
  shifts,
  currentUserId,
  onSubmit,
}: UseRequestFormOptions): UseRequestFormResult {
  const [values, setValues] = useState<ExchangeRequestFormValues>(EMPTY_VALUES);
  const [touched, setTouched] = useState<Partial<Record<ExchangeRequestFormField, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const context = useMemo<ValidationContext>(() => {
    const myShiftIds = shifts
      .filter((shift) => shift.personId === currentUserId)
      .map((shift) => shift.id);
    const targetShiftOwners: Record<number, number> = {};
    for (const shift of shifts) {
      targetShiftOwners[shift.id] = shift.personId;
    }
    return { currentUserId, myShiftIds, targetShiftOwners };
  }, [shifts, currentUserId]);

  const errors = useMemo(() => validateExchangeRequest(values, context), [values, context]);

  useEffect(() => {
    setValues(EMPTY_VALUES);
    setTouched({});
    setSubmitAttempted(false);
    setSubmitting(false);
  }, [open]);

  const setField = useCallback((field: ExchangeRequestFormField, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleBlur = useCallback((field: ExchangeRequestFormField) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;

    setSubmitAttempted(true);
    setTouched({ shiftId: true, targetShiftId: true, reason: true });

    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit({
        shiftId: Number(values.shiftId),
        targetShiftId: Number(values.targetShiftId),
        reason: values.reason.trim(),
      });
    } finally {
      setSubmitting(false);
    }
  }, [errors, onSubmit, submitting, values]);

  return {
    values,
    errors,
    touched,
    submitting,
    submitAttempted,
    setField,
    handleBlur,
    handleSubmit,
  };
}
