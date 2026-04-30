import Link from "next/link";

import { saveCategoryAction } from "../../_actions/health-box-admin";
import { AdminCategoryTable } from "../../_components/admin/admin-category-table";
import { AdminHeader } from "../../_components/admin/admin-header";
import { AdminMetrics, AdminPanel } from "../../_components/admin/admin-ui";
import { fetchAdminCategories, hasHealthBoxApi } from "../../_lib/health-box-api";

export default async function AdminCategoriesPage() {
  const categories = hasHealthBoxApi() ? await fetchAdminCategories() : [];
  const activeCount = categories?.filter((item) => item.status !== "INACTIVE").length ?? 0;
  const metrics = [
    {
      label: "전체 카테고리",
      value: `${categories?.length ?? 0}개`,
      hint: "상품 분류 기준",
      tone: "blue" as const,
    },
    {
      label: "사용중",
      value: `${activeCount}개`,
      hint: "상품 등록 화면에 사용",
      tone: "green" as const,
    },
    {
      label: "중지",
      value: `${Math.max((categories?.length ?? 0) - activeCount, 0)}개`,
      hint: "운영 보류",
      tone: "gold" as const,
    },
  ];

  return (
    <div className="admin-page">
      <AdminHeader
        title="카테고리 관리"
        actions={
          <Link className="admin-button secondary" href="/admin/products">
            상품 목록
          </Link>
        }
      />

      <AdminMetrics items={metrics} />

      <AdminPanel title="새 카테고리 추가" description="카테고리명만 입력해도 바로 추가할 수 있습니다.">
        <form action={saveCategoryAction} className="admin-category-create-form is-page">
          <input name="redirectTo" type="hidden" value="/admin/categories" />
          <label className="admin-field admin-category-name-field">
            <span>카테고리명</span>
            <input className="admin-input" name="name" placeholder="예: 영양제" type="text" />
          </label>
          <label className="admin-field admin-category-order-field">
            <span>노출 순서</span>
            <input className="admin-input" min="0" name="sortOrder" placeholder="0" type="number" />
          </label>
          <details className="admin-category-details">
            <summary>관리 정보</summary>
            <div className="admin-category-details-grid">
              <input className="admin-input" name="slug" placeholder="영문 주소값(비우면 자동)" type="text" />
              <input className="admin-input" name="categoryCode" placeholder="관리 코드(비우면 자동)" type="text" />
            </div>
          </details>
          <button className="admin-button admin-category-add-button" type="submit">
            추가
          </button>
        </form>
      </AdminPanel>

      <AdminPanel title="카테고리 목록">
        <AdminCategoryTable categories={categories || []} />
      </AdminPanel>
    </div>
  );
}
