type HealthBoxErrorPayload = {
  error?: string;
  message?: string;
  status?: number;
};

const GENERIC_BACKEND_ERRORS = /^(bad request|internal server error|not found|error)$/i;

export function toCartErrorMessage(error: unknown, fallback: string) {
  const rawMessage = error instanceof Error ? error.message : String(error);
  const apiStatusMatch = rawMessage.match(/^HealthBox API (\d+):\s*/);
  let status = apiStatusMatch ? Number(apiStatusMatch[1]) : undefined;
  const message = rawMessage
    .replace(/^HealthBox API \d+:\s*/, "")
    .replace(/^Error:\s*/, "")
    .trim();
  let parsedMessage = message;

  try {
    const parsed = JSON.parse(message) as HealthBoxErrorPayload;
    status = parsed.status ?? status;
    parsedMessage = parsed.message || parsed.error || "";
  } catch {
    parsedMessage = message;
  }

  if (/session|buyer member|login/i.test(parsedMessage)) {
    return "로그인 정보가 만료되었습니다. 다시 로그인해주세요.";
  }

  if (/stock|sold out|sku/i.test(parsedMessage)) {
    return "담을 수 없는 상품입니다. 상품 옵션과 재고를 확인해주세요.";
  }

  if (!parsedMessage || GENERIC_BACKEND_ERRORS.test(parsedMessage) || (status != null && status >= 500)) {
    return fallback;
  }

  return parsedMessage;
}
