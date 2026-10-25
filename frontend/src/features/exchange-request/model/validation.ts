import type {
  ExchangeRequestFormErrors,
  ExchangeRequestFormValues,
  ValidationContext,
} from './types';

export const reasonLimit = 300;

const MIN_REASON_LENGTH = 5;

export function validateExchangeRequest(
  values: ExchangeRequestFormValues,
  context: ValidationContext,
): ExchangeRequestFormErrors {
  const errors: ExchangeRequestFormErrors = {};

  if (!values.shiftId) {
    errors.shiftId = 'Выберите свою смену';
  } else if (!context.myShiftIds.includes(Number(values.shiftId))) {
    errors.shiftId = 'Можно выбрать только собственную смену';
  }

  if (!values.targetShiftId) {
    errors.targetShiftId = 'Выберите смену коллеги';
  } else if (values.targetShiftId === values.shiftId) {
    errors.targetShiftId = 'Нельзя обменять смену саму на себя';
  } else if (context.targetShiftOwners[Number(values.targetShiftId)] === context.currentUserId) {
    errors.targetShiftId = 'Нельзя обменяться сменой с самим собой';
  }

  const reason = values.reason.trim();
  if (reason.length < MIN_REASON_LENGTH) {
    errors.reason = `Опишите причину (минимум ${MIN_REASON_LENGTH} символов)`;
  } else if (reason.length > reasonLimit) {
    errors.reason = `Не более ${reasonLimit} символов`;
  }

  return errors;
}
