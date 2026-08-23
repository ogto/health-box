# 건강창고몰 독립 운영 전환 체크리스트

건강창고몰은 노타이틀·모노티·빵장고와 별도 애플리케이션, DB 계정, DB 이름, Toss 상점 키로 운영한다. `cloud-api` 주소나 공용 결제키를 건강창고 환경변수에 넣지 않는다.

## 1. 독립 백엔드와 DB

백엔드는 이 저장소의 `backend/` 디렉터리다. 다음 값을 백엔드 런타임에만 설정한다.

- `HEALTH_BOX_DB_URL`: 건강창고 전용 MariaDB JDBC URL
- `HEALTH_BOX_DB_NAME`: URL이 선택한 전용 DB 이름, 기본값 `health_box`
- `HEALTH_BOX_DB_USERNAME`, `HEALTH_BOX_DB_PASSWORD`: 건강창고 전용 계정
- `HEALTH_BOX_DB_DDL_AUTO`: 운영 기본값 `validate`
- `HEALTH_BOX_API_ADDRESS`: 운영 기본값 `127.0.0.1`; 외부 인터페이스에 직접 바인딩하지 않는다.
- `HEALTH_BOX_UPLOAD_DIRECTORY`: 건강창고 이미지 전용 영구 볼륨
- `HEALTH_BOX_INTERNAL_API_KEY`: Vercel 서버와 독립 백엔드만 공유하는 32자 이상의 내부 호출 키

백엔드는 Spring/JPA가 시작되기 전에 DB URL을 검사한다. `cloud`, `sotong`, `notitle`, `monoty`, `bread_storage` 등의 공용 DB 이름은 실행 자체가 거부된다. 운영 계정에는 건강창고 DB 권한만 부여한다.

`/health-box/files/*` 이미지 조회를 제외한 모든 백엔드 API는 `X-Health-Box-Internal-Key`가 일치해야 한다. 키는 브라우저로 전달하지 않고 Vercel 서버 런타임과 Spring 환경변수에만 같은 값으로 설정한다.

신규 전용 DB는 `backend/src/main/resources/sql/V1__health_box_schema.sql`로 생성한다. `backend/src/main/resources/sql/legacy/`는 과거 공용 DB에서 사용하던 증분 SQL 보관용이며 신규 DB에는 실행하지 않는다. 기존 `HEALTH_BOX_%` 데이터 이전은 DB 관리자 권한으로 별도 수행하고, 노타이틀 원본 테이블은 수정하거나 삭제하지 않는다.

현재 운영 토폴로지는 다음과 같다.

- 백엔드/DB 서버: `health-box-api.service`, `/opt/health-box`, `/var/lib/health-box`, `health_box` DB, `health_box_app@localhost`
- HTTPS 프록시 서버: `nginx.service`, `health-box-api-tunnel.service`
- 연결: `api.everybuy.co.kr:443 → nginx → 127.0.0.1:18081 → 제한 SSH 터널 → 백엔드 127.0.0.1:8081`
- 터널 키는 출발지 IP, 포트 포워딩 목적지 `127.0.0.1:8081`, 비대화형 세션으로 제한한다.

배포 템플릿은 `backend/deploy/`에 있다. NoTitle Node 프로세스가 사용하는 80/443이나 `cloud` DB 설정을 건강창고 배포 과정에서 변경하지 않는다.

## 2. 독립 결제

프런트와 백엔드에 같은 건강창고 전용 Toss 상점 키 세트를 주입한다.

- `HEALTH_BOX_TOSS_PAYMENT_MODE`: 운영은 `live`
- `NEXT_PUBLIC_HEALTH_BOX_TOSS_CLIENT_KEY`: 건강창고 전용 라이브 클라이언트키
- `HEALTH_BOX_TOSS_LIVE_SECRET_KEY`: 건강창고 전용 라이브 시크릿키
- `HEALTH_BOX_TOSS_TEST_SECRET_KEY`: 테스트 모드를 사용할 때만 설정
- `HEALTH_BOX_PAYMENT_PROOF_SECRET`: 결제 요청 위변조 방지용 독립 난수

`HEALTH_BOX_TOSS_SECRET_KEY`와 `TOSS_PAYMENTS_*`는 공용·구형 변수명이므로 사용하지 않는다.

건강창고 PG 승인 전 노타이틀 키를 임시 사용해야 할 때에도 공용 `PaymentService`나 노타이틀 DB를 연결하지 않는다. 키 값만 건강창고 런타임의 `NEXT_PUBLIC_HEALTH_BOX_TOSS_CLIENT_KEY`와 `HEALTH_BOX_TOSS_LIVE_SECRET_KEY`에 주입하고 다음 값을 함께 설정한다.

- `HEALTH_BOX_TOSS_CREDENTIAL_SOURCE=notitle-temporary`
- `HEALTH_BOX_TOSS_TEMPORARY_BRIDGE_EXPIRES_AT=YYYY-MM-DD`

만료일이 지나면 프런트 승인과 백엔드 결제 조회·취소가 모두 차단된다. 건강창고 MID가 승인되면 키 두 개를 같은 세트로 교체하고 `HEALTH_BOX_TOSS_CREDENTIAL_SOURCE=health-box`로 전환한다.

임시 키로 승인된 주문은 결제 제공자를 `TOSS_NOTITLE_TEMPORARY`로 저장해 건강창고 전용 MID 주문과 정산·취소 내역을 구분한다.

## 3. 프런트 연결

- `HEALTH_BOX_API_BASE_URL`은 독립 백엔드의 `/api/v5` 주소여야 한다.
- `cloud.1472.ai`는 건강창고 API 주소로 사용할 수 없다.
- `HEALTH_BOX_UPLOAD_API_BASE_URL`도 독립 백엔드 `/api/v5`를 사용한다.
- `HEALTH_BOX_CDN_BASE_URL`은 건강창고 전용 자산 호스트를 사용한다.

배포 전 `npm run ops:preflight`를 실행한다. 이 검사는 공용 API 호스트, 공용 결제키 변수명, 키 모드, 필수 API와 판매자 정보를 확인한다.

## 4. 판매자 정보

현재 반영된 정보는 상호, 대표자, 사업자등록번호, 사업장 주소다. 통신판매업 신고번호, 고객센터 전화번호, 고객센터 이메일은 실제 자료를 받아 관리자 `홈페이지 설정`에서 입력한다.

## 5. 스테이징 확인

- 승인 회원만 가격, 장바구니, 묶음 담기, 문의 작성에 접근한다.
- 비밀 문의는 작성자와 관리자만 원문과 답변을 조회한다.
- 상품 정상가·판매가·할인율과 다중 카테고리 필터가 목록·상세에서 일치한다.
- 5만 원 미만은 배송비 3,000원, 5만 원 이상은 무료로 계산된다.
- 결제 승인 후 주문 저장 실패 시 건강창고 전용 Toss 결제가 자동 취소된다.
- 같은 성공 URL·취소 요청을 반복해도 주문, 재고, 환불이 한 번만 반영된다.
- 상품 이미지는 건강창고 전용 업로드 경로에서만 제공된다.

## 6. 배포 순서

`전용 DB/계정 생성 → 데이터 복제 → 전용 Toss 상점 키 발급 → 백엔드 배포 → 프런트 환경변수 설정/배포 → preflight → 최소 금액 실결제·전체취소 확인` 순서로 진행한다. 전환 전까지 기존 노타이틀·빵장고 서비스는 변경하지 않는다.
