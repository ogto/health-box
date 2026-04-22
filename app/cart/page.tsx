import Image from "next/image";
import Link from "next/link";

import { Breadcrumbs, ProductCard, StoreShell } from "../_components/store-ui";
import { products } from "../_lib/store-data";

const cartItems = [
  {
    slug: "daily-multivitamin-core",
    quantity: 2,
    option: "30정 / 1개월분",
    amount: "회원가 로그인 후 확인",
  },
  {
    slug: "gut-balance-box",
    quantity: 1,
    option: "30포 / 1개월분",
    amount: "회원가 로그인 후 확인",
  },
] as const;

export default function CartPage() {
  const items = cartItems
    .map((item) => {
      const product = products.find((entry) => entry.slug === item.slug);
      return product ? { ...item, product } : null;
    })
    .filter((item): item is (typeof cartItems)[number] & { product: (typeof products)[number] } =>
      Boolean(item),
    );

  return (
    <StoreShell activeKey="cart">
      <section className="subpage-block">
        <Breadcrumbs
          items={[
            { label: "홈", href: "/" },
            { label: "장바구니" },
          ]}
        />

        <div className="cart-layout">
          <div className="cart-list-panel">
            <div className="section-head align-center">
              <div>
                <p className="section-kicker">장바구니</p>
                <h3>담아둔 상품</h3>
              </div>
            </div>

            <div className="cart-list">
              {items.map((item) => (
                <article className="cart-item" key={item.product.slug}>
                  <div className="cart-thumb">
                    <Image
                      alt={item.product.title}
                      fill
                      sizes="120px"
                      src={item.product.image}
                      className="object-cover"
                    />
                  </div>

                  <div className="cart-item-copy">
                    <p className="product-brand">{item.product.brand}</p>
                    <h4>{item.product.title}</h4>
                    <p className="product-subtitle">{item.option}</p>
                  </div>

                  <div className="cart-item-meta">
                    <div className="qty-badge">수량 {item.quantity}</div>
                    <strong>{item.amount}</strong>
                    <button className="text-button" type="button">
                      삭제
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="summary-panel">
            <p className="section-kicker">주문 요약</p>
            <h3 className="section-panel-title">결제 예정 정보</h3>

            <div className="summary-rows">
              <div className="summary-row">
                <span>상품 금액</span>
                <strong>회원가 로그인 후 확인</strong>
              </div>
              <div className="summary-row">
                <span>배송비</span>
                <strong>조건부 무료</strong>
              </div>
              <div className="summary-row total">
                <span>총 결제 예정</span>
                <strong>회원가 로그인 후 확인</strong>
              </div>
            </div>

            <button className="button-primary full-width-button" type="button">
              주문서로 이동
            </button>
            <Link className="button-secondary full-width-button" href="/">
              계속 쇼핑하기
            </Link>
          </aside>
        </div>
      </section>

      <section className="section-block">
        <div className="section-head">
          <div>
            <p className="section-kicker">추천 상품</p>
            <h3>장바구니와 함께 보면 좋은 상품</h3>
          </div>
        </div>

        <div className="product-grid product-grid-three">
          {products.slice(1, 4).map((product) => (
            <ProductCard key={product.slug} label={product.badge} product={product} />
          ))}
        </div>
      </section>
    </StoreShell>
  );
}
