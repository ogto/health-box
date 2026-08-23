function formatWon(value: number) {
  return `${Math.max(0, Math.trunc(value)).toLocaleString("ko-KR")}원`;
}

function positivePrice(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
}

function priceClassName(compact: boolean, state?: "contact" | "locked") {
  return [
    "commerce-price",
    compact ? "is-compact" : "",
    state ? `is-${state}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function ProductPriceDisplay({
  consumerPrice,
  fallbackPrice,
  isMember,
  memberPrice,
  priceExposurePolicy,
  compact = false,
}: {
  compact?: boolean;
  consumerPrice?: number | null;
  fallbackPrice: string;
  isMember: boolean;
  memberPrice?: number | null;
  priceExposurePolicy?: string;
}) {
  const normalPrice = positivePrice(consumerPrice);
  const salePrice = positivePrice(memberPrice);
  const discountRate = normalPrice > salePrice && salePrice > 0
    ? Math.round(((normalPrice - salePrice) / normalPrice) * 100)
    : 0;
  const policy = priceExposurePolicy || "MEMBER_ONLY";

  if (!isMember) {
    if (policy === "CONTACT") {
      return (
        <div className={priceClassName(compact, "contact")}>
          <span className="commerce-price-note">판매가</span>
          <strong>가격 문의</strong>
        </div>
      );
    }

    if (policy === "PUBLIC" && (normalPrice > 0 || salePrice > 0)) {
      return (
        <div className={priceClassName(compact)}>
          {normalPrice > salePrice && salePrice > 0 ? (
            <div className="commerce-price-normal">
              <span>정상가</span>
              <del>{formatWon(normalPrice)}</del>
            </div>
          ) : null}
          <div className="commerce-price-sale-row">
            {discountRate > 0 ? <em>{discountRate}%</em> : null}
            <strong>{formatWon(salePrice || normalPrice)}</strong>
          </div>
          <span className="commerce-price-note">판매가</span>
        </div>
      );
    }

    return (
      <div className={priceClassName(compact, "locked")}>
        <span className="commerce-price-note">회원 전용 가격</span>
        <strong>로그인 후 확인</strong>
      </div>
    );
  }

  const displaySalePrice = salePrice > 0
    ? formatWon(salePrice)
    : normalPrice > 0
      ? formatWon(normalPrice)
      : fallbackPrice;
  return (
    <div className={priceClassName(compact)}>
      {normalPrice > 0 && discountRate > 0 ? (
        <div className="commerce-price-normal">
          <span>정상가</span>
          <del>{formatWon(normalPrice)}</del>
        </div>
      ) : null}
      <div className="commerce-price-sale-row">
        {discountRate > 0 ? <em>{discountRate}%</em> : null}
        <strong>{displaySalePrice}</strong>
      </div>
      <span className="commerce-price-note">회원 판매가</span>
    </div>
  );
}
