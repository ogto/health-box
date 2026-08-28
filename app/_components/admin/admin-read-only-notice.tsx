export function AdminReadOnlyNotice({ scopeName = "현재 딜러몰" }: { scopeName?: string }) {
  return (
    <div className="admin-feedback is-info" role="status">
      {scopeName} 관리자 계정은 조회 전용입니다. 정보 변경과 처리 작업은 본사 관리자에게 요청해주세요.
    </div>
  );
}
