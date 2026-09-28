export const FREQ_LABEL: Record<string, string> = { DAILY: "يومي", WEEKLY: "أسبوعي" };

export const STATUS_LABEL: Record<string, string> = {
  APPROVED: "مقبول",
  PENDING_REVIEW: "قيد المراجعة",
  REJECTED: "مرفوض",
};

export const STATUS_COLOR: Record<string, string> = {
  APPROVED: "text-success bg-success/10",
  PENDING_REVIEW: "text-accent-gold bg-accent-gold/10",
  REJECTED: "text-danger bg-danger/10",
};

// Labels shown to the admin/supervisor when setting a student's payment state.
export const SUBSCRIPTION_ADMIN_LABEL: Record<string, string> = {
  PAID: "دفع كامل الاشتراك",
  HALF: "دفع نصف الاشتراك",
  UNPAID: "لم يدفع الاشتراك",
};

// Labels shown to the student for the same state.
export const SUBSCRIPTION_LABEL: Record<string, string> = {
  PAID: "مدفوع",
  HALF: "في انتظار الإكمال",
  UNPAID: "لم يُدفع",
};

export const SUBSCRIPTION_COLOR: Record<string, string> = {
  PAID: "text-success bg-success/10",
  HALF: "text-accent-gold bg-accent-gold/10",
  UNPAID: "text-danger bg-danger/10",
};
