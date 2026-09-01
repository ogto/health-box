
    create table HEALTH_BOX_ACCOUNT (
       ID bigint not null auto_increment,
        CREATED_AT datetime(6) not null,
        UPDATED_AT datetime(6) not null,
        AUTH_IDENTIFIER varchar(255),
        EMAIL varchar(150),
        LAST_LOGIN_AT datetime(6),
        NAME varchar(100) not null,
        PASSWORD_HASH varchar(255),
        PHONE varchar(30) not null,
        SESSION_EXPIRED_AT datetime(6),
        SESSION_TOKEN varchar(255),
        STATUS varchar(30) not null,
        primary key (ID)
    ) engine=InnoDB;

    create table HEALTH_BOX_ACCOUNT_ROLE (
       ID bigint not null auto_increment,
        CREATED_AT datetime(6) not null,
        UPDATED_AT datetime(6) not null,
        ACCOUNT_ID bigint not null,
        DEALER_MALL_ID bigint,
        HQ_ID bigint,
        ROLE varchar(30) not null,
        STATUS varchar(30) not null,
        primary key (ID)
    ) engine=InnoDB;

    create table HEALTH_BOX_BUYER_ADDRESS (
       ID bigint not null auto_increment,
        CREATED_AT datetime(6) not null,
        UPDATED_AT datetime(6) not null,
        ADDRESS_ALIAS varchar(80),
        BASE_ADDRESS varchar(255) not null,
        BUYER_MEMBER_ID bigint not null,
        DEFAULT_YN varchar(1) not null,
        DETAIL_ADDRESS varchar(255),
        RECEIVER_NAME varchar(100) not null,
        RECEIVER_PHONE varchar(30) not null,
        ZIP_CODE varchar(20),
        primary key (ID)
    ) engine=InnoDB;

    create table HEALTH_BOX_BUYER_CART_ITEM (
       ID bigint not null auto_increment,
        CREATED_AT datetime(6) not null,
        UPDATED_AT datetime(6) not null,
        BUYER_MEMBER_ID bigint not null,
        DEALER_MALL_ID bigint not null,
        QUANTITY integer not null,
        SKU_ID bigint not null,
        primary key (ID)
    ) engine=InnoDB;

    create table HEALTH_BOX_BUYER_MEMBER (
       ID bigint not null auto_increment,
        CREATED_AT datetime(6) not null,
        UPDATED_AT datetime(6) not null,
        ACCOUNT_ID bigint,
        APPROVED_AT datetime(6),
        BIRTH_DATE date,
        CONSENT_DOCUMENT_VERSION varchar(20),
        DEALER_MALL_ID bigint not null,
        EMAIL varchar(150),
        JOINED_AT datetime(6),
        MARKETING_CONSENT_UPDATED_AT datetime(6),
        MARKETING_CONSENT_YN varchar(1) not null default 'N',
        NAME varchar(100) not null,
        PHONE varchar(30) not null,
        PRIVACY_AGREED_AT datetime(6),
        STATUS varchar(30) not null,
        TERMS_AGREED_AT datetime(6),
        THIRD_PARTY_AGREED_AT datetime(6),
        primary key (ID)
    ) engine=InnoDB;

    create table HEALTH_BOX_BUYER_SIGNUP_APPLICATION (
       ID bigint not null auto_increment,
        CREATED_AT datetime(6) not null,
        UPDATED_AT datetime(6) not null,
        APPLIED_AT datetime(6),
        APPROVED_AT datetime(6),
        BIRTH_DATE date,
        BUYER_MEMBER_ID bigint,
        CONSENT_DOCUMENT_VERSION varchar(20),
        DEALER_MALL_ID bigint not null,
        EMAIL varchar(150),
        INBOUND_CHANNEL varchar(50),
        MARKETING_CONSENT_UPDATED_AT datetime(6),
        MARKETING_CONSENT_YN varchar(1) not null default 'N',
        NAME varchar(100) not null,
        PASSWORD_HASH varchar(255),
        PHONE varchar(30) not null,
        PRIVACY_AGREED_AT datetime(6),
        REJECT_REASON varchar(500),
        STATUS varchar(30) not null,
        TERMS_AGREED_AT datetime(6),
        THIRD_PARTY_AGREED_AT datetime(6),
        primary key (ID)
    ) engine=InnoDB;

    create table HEALTH_BOX_CATEGORY (
       ID bigint not null auto_increment,
        CREATED_AT datetime(6) not null,
        UPDATED_AT datetime(6) not null,
        CATEGORY_CODE varchar(50),
        DELETED_AT datetime(6),
        DELETED_YN varchar(1) not null,
        NAME varchar(100) not null,
        SLUG varchar(100),
        SORT_ORDER integer,
        STATUS varchar(30) not null,
        primary key (ID)
    ) engine=InnoDB;

    create table HEALTH_BOX_CLAIM (
       ID bigint not null auto_increment,
        CREATED_AT datetime(6) not null,
        UPDATED_AT datetime(6) not null,
        AMOUNT integer not null,
        BUYER_MEMBER_ID bigint not null,
        CLAIM_TYPE varchar(30) not null,
        DEALER_MALL_ID bigint not null,
        ORDER_ID bigint not null,
        PROCESSED_AT datetime(6),
        REASON varchar(500),
        STATUS varchar(30) not null,
        primary key (ID)
    ) engine=InnoDB;

    create table HEALTH_BOX_DEALER_APPLICATION (
       ID bigint not null auto_increment,
        CREATED_AT datetime(6) not null,
        UPDATED_AT datetime(6) not null,
        APPLICANT_NAME varchar(100) not null,
        APPROVED_AT datetime(6),
        BUSINESS_INFO varchar(1000),
        CONSENT_DOCUMENT_VERSION varchar(20),
        DEALER_MALL_ID bigint,
        EMAIL varchar(150),
        PHONE varchar(30) not null,
        PRIVACY_AGREED_AT datetime(6),
        REJECT_REASON varchar(500),
        REVIEW_MEMO varchar(1000),
        STATUS varchar(30) not null,
        WANTED_MALL_NAME varchar(150) not null,
        WANTED_SLUG varchar(80) not null,
        primary key (ID)
    ) engine=InnoDB;

    create table HEALTH_BOX_DEALER_MALL (
       ID bigint not null auto_increment,
        CREATED_AT datetime(6) not null,
        UPDATED_AT datetime(6) not null,
        APPROVED_AT datetime(6),
        DEALER_CODE varchar(80) not null,
        DISPLAY_NAME varchar(150) not null,
        HQ_ID bigint not null,
        JOINED_AT datetime(6),
        MALL_NAME varchar(150) not null,
        REPRESENTATIVE_PHONE varchar(30),
        SLUG varchar(80) not null,
        STATUS varchar(30) not null,
        SUPPORT_EMAIL varchar(150),
        SUPPORT_PHONE varchar(30),
        primary key (ID)
    ) engine=InnoDB;

    create table HEALTH_BOX_DEALER_MALL_PUBLIC_CONFIG (
       ID bigint not null auto_increment,
        CREATED_AT datetime(6) not null,
        UPDATED_AT datetime(6) not null,
        ACTIVE_YN varchar(1) not null,
        DEALER_MALL_ID bigint not null,
        DISPLAY_NAME varchar(150) not null,
        CUSTOMER_CENTER_TEXT longtext,
        FAVICON_URL varchar(1000),
        LOGO_URL varchar(1000),
        MAIN_NAVIGATION_JSON longtext,
        MAIN_VISUAL_URL varchar(1000),
        MAIN_VISUAL_LINK_URL varchar(1000),
        MALL_NAME varchar(150) not null,
        META_DESCRIPTION varchar(1000),
        META_TITLE varchar(255),
        MIDDLE_BANNER_URL varchar(1000),
        MIDDLE_BANNER_LINK_URL varchar(1000),
        POLICY_TEXT longtext,
        SEARCH_PLACEHOLDER varchar(255),
        SHARE_THUMBNAIL_URL varchar(1000),
        SLUG varchar(80) not null,
        SUPPORT_EMAIL varchar(150),
        SUPPORT_PHONE varchar(30),
        primary key (ID)
    ) engine=InnoDB;

    create table HEALTH_BOX_DELIVERY_POLICY (
       ID bigint not null auto_increment,
        CREATED_AT datetime(6) not null,
        UPDATED_AT datetime(6) not null,
        CONTENT longtext not null,
        DELETED_AT datetime(6),
        DELETED_YN varchar(1) not null,
        SORT_ORDER integer,
        STATUS varchar(30) not null,
        TITLE varchar(150) not null,
        primary key (ID)
    ) engine=InnoDB;

    create table HEALTH_BOX_HQ (
       ID bigint not null auto_increment,
        CREATED_AT datetime(6) not null,
        UPDATED_AT datetime(6) not null,
        BUSINESS_INFO varchar(500),
        BUSINESS_NO varchar(50),
        CONTACT_EMAIL varchar(150),
        CONTACT_PHONE varchar(30),
        NAME varchar(100) not null,
        REPRESENTATIVE_NAME varchar(100),
        STATUS varchar(30) not null,
        primary key (ID)
    ) engine=InnoDB;

    create table HEALTH_BOX_INVENTORY (
       ID bigint not null auto_increment,
        CREATED_AT datetime(6) not null,
        UPDATED_AT datetime(6) not null,
        PRODUCT_ID bigint not null,
        QUANTITY integer not null,
        SAFETY_QUANTITY integer not null,
        primary key (ID)
    ) engine=InnoDB;

    create table HEALTH_BOX_MONTHLY_SALES_SUMMARY (
       ID bigint not null auto_increment,
        CREATED_AT datetime(6) not null,
        UPDATED_AT datetime(6) not null,
        BASE_YEAR_MONTH varchar(7) not null,
        CLAIM_DEDUCT_AMOUNT integer not null,
        DEALER_MALL_ID bigint not null,
        GROSS_SALES integer not null,
        NET_SALES integer not null,
        ORDER_COUNT integer not null,
        STATUS varchar(30) not null,
        primary key (ID)
    ) engine=InnoDB;

    create table HEALTH_BOX_MONTHLY_SETTLEMENT_SUMMARY (
       ID bigint not null auto_increment,
        CREATED_AT datetime(6) not null,
        UPDATED_AT datetime(6) not null,
        BASE_YEAR_MONTH varchar(7) not null,
        CONFIRMED_AT datetime(6),
        CONFIRMED_SETTLEMENT_AMOUNT integer,
        DEALER_MALL_ID bigint not null,
        DEDUCT_AMOUNT integer not null,
        EXPECTED_SETTLEMENT_AMOUNT integer not null,
        SETTLEMENT_BASE_SALES integer not null,
        SETTLEMENT_STATUS varchar(30) not null,
        primary key (ID)
    ) engine=InnoDB;

    create table HEALTH_BOX_NOTICE (
       ID bigint not null auto_increment,
        DEALER_MALL_ID bigint,
        CREATED_AT datetime(6) not null,
        UPDATED_AT datetime(6) not null,
        AUTHOR_ACCOUNT_ID bigint,
        CONTENT TEXT not null,
        NOTICE_TYPE varchar(50),
        PINNED_YN varchar(1) not null,
        POST_STATUS varchar(30) not null,
        POSTED_AT datetime(6),
        SLUG varchar(255) not null,
        TITLE varchar(255) not null,
        primary key (ID)
    ) engine=InnoDB;

    create table HEALTH_BOX_ORDER_HEADER (
       ID bigint not null auto_increment,
        CREATED_AT datetime(6) not null,
        UPDATED_AT datetime(6) not null,
        BASE_ADDRESS varchar(255) not null,
        BUYER_MEMBER_ID bigint not null,
        CANCELED_PAYMENT_AMOUNT integer not null,
        DEALER_MALL_ID bigint not null,
        DEALER_NAME_SNAPSHOT varchar(150),
        DEALER_SLUG_SNAPSHOT varchar(80) not null,
        DETAIL_ADDRESS varchar(255),
        DISCOUNT_AMOUNT integer not null,
        ORDER_NO varchar(100) not null,
        ORDER_STATUS varchar(30) not null,
        ORDERED_AT datetime(6) not null,
        ORDERER_NAME varchar(100) not null,
        ORDERER_PHONE varchar(30) not null,
        PAYMENT_STATUS varchar(30) not null,
        PRODUCT_AMOUNT integer not null,
        RECEIVER_NAME varchar(100) not null,
        RECEIVER_PHONE varchar(30) not null,
        REMAINING_PAYMENT_AMOUNT integer not null,
        SHIPPING_FEE integer not null,
        TOTAL_PAYMENT_AMOUNT integer not null,
        ZIP_CODE varchar(20),
        primary key (ID)
    ) engine=InnoDB;

    create table HEALTH_BOX_ORDER_DAILY_SEQUENCE (
       ORDER_DATE date not null,
        LAST_SEQUENCE integer not null,
        primary key (ORDER_DATE)
    ) engine=InnoDB;

    create table HEALTH_BOX_ORDER_ITEM (
       ID bigint not null auto_increment,
        CREATED_AT datetime(6) not null,
        UPDATED_AT datetime(6) not null,
        CANCELED_QUANTITY integer not null,
        LINE_AMOUNT integer not null,
        OPTION_SUMMARY_SNAPSHOT varchar(255),
        ORDER_ID bigint not null,
        PRICE_SNAPSHOT integer not null,
        PRODUCT_ID bigint not null,
        PRODUCT_NAME_SNAPSHOT varchar(255) not null,
        QUANTITY integer not null,
        SKU_CODE_SNAPSHOT varchar(100) not null,
        SKU_ID bigint not null,
        SKU_NAME_SNAPSHOT varchar(255) not null,
        primary key (ID)
    ) engine=InnoDB;

    create table HEALTH_BOX_PAYMENT (
       ID bigint not null auto_increment,
        CREATED_AT datetime(6) not null,
        UPDATED_AT datetime(6) not null,
        APPROVED_AT datetime(6),
        BUYER_MEMBER_ID bigint not null,
        CANCELED_AMOUNT integer not null,
        DEALER_MALL_ID bigint not null,
        METHOD varchar(80),
        METHOD_DETAIL varchar(120),
        ORDER_ID bigint not null,
        ORDER_NO varchar(100) not null,
        PAID_AMOUNT integer not null,
        PAYMENT_KEY varchar(200),
        PAYMENT_METHOD_NAME varchar(120),
        PAYMENT_ORDER_ID varchar(120),
        PROVIDER varchar(50) not null,
        RAW_RESPONSE_JSON longtext,
        RECEIPT_URL varchar(500),
        REMAINING_AMOUNT integer not null,
        STATUS varchar(30) not null,
        primary key (ID)
    ) engine=InnoDB;

    create table HEALTH_BOX_PAYMENT_CANCEL_REQUEST (
       ID bigint not null auto_increment,
        CREATED_AT datetime(6) not null,
        UPDATED_AT datetime(6) not null,
        CANCEL_AMOUNT integer not null,
        ORDER_ID bigint not null,
        REQUEST_ID varchar(100) not null,
        STATUS varchar(30) not null,
        primary key (ID)
    ) engine=InnoDB;

    create table HEALTH_BOX_PRODUCT (
       ID bigint not null auto_increment,
        CREATED_AT datetime(6) not null,
        UPDATED_AT datetime(6) not null,
        BRAND_NAME varchar(100),
        CATEGORY_ID bigint not null,
        CONSUMER_PRICE integer,
        DELETED_AT datetime(6),
        DELETED_YN varchar(1) not null,
        DELIVERY_POLICY_ID bigint,
        DELIVERY_POLICY_TEXT varchar(2000),
        DETAIL_HTML longtext,
        MEMBER_PRICE integer,
        NAME varchar(150) not null,
        OPTION_USE_YN varchar(1) not null,
        PRICE_EXPOSURE_POLICY varchar(50),
        PRODUCT_CODE varchar(50),
        PUBLISH_STATUS varchar(50),
        SALES_POLICY_ID bigint,
        SALES_POLICY_TEXT LONGTEXT,
        SETTLEMENT_BASE_PRICE integer,
        SLUG varchar(150) not null,
        SORT_ORDER integer,
        STATUS varchar(30) not null,
        SUMMARY_TEXT varchar(2000),
        SUPPLY_PRICE integer,
        primary key (ID)
    ) engine=InnoDB;

    create table HEALTH_BOX_PRODUCT_INQUIRY (
       ID bigint not null auto_increment,
        CREATED_AT datetime(6) not null,
        UPDATED_AT datetime(6) not null,
        ANSWER TEXT,
        ANSWERED_AT datetime(6),
        BUYER_MEMBER_ID bigint not null,
        DEALER_MALL_ID bigint not null,
        PRIVATE_YN varchar(1) not null,
        PRODUCT_ID bigint not null,
        QUESTION TEXT not null,
        STATUS varchar(30) not null,
        primary key (ID)
    ) engine=InnoDB;

    create table HEALTH_BOX_PRODUCT_MEDIA (
       ID bigint not null auto_increment,
        CREATED_AT datetime(6) not null,
        UPDATED_AT datetime(6) not null,
        ALT_TEXT varchar(255),
        MEDIA_TYPE varchar(30) not null,
        MEDIA_URL varchar(255) not null,
        PRODUCT_ID bigint not null,
        SORT_ORDER integer,
        primary key (ID)
    ) engine=InnoDB;

    create table HEALTH_BOX_PRODUCT_OPTION_GROUP (
       ID bigint not null auto_increment,
        CREATED_AT datetime(6) not null,
        UPDATED_AT datetime(6) not null,
        GROUP_NAME varchar(100) not null,
        PRODUCT_ID bigint not null,
        REQUIRED_YN varchar(1) not null,
        SORT_ORDER integer,
        primary key (ID)
    ) engine=InnoDB;

    create table HEALTH_BOX_PRODUCT_OPTION_VALUE (
       ID bigint not null auto_increment,
        CREATED_AT datetime(6) not null,
        UPDATED_AT datetime(6) not null,
        OPTION_GROUP_ID bigint not null,
        PRODUCT_ID bigint not null,
        SORT_ORDER integer,
        STATUS varchar(30) not null,
        VALUE_CODE varchar(50) not null,
        VALUE_NAME varchar(100) not null,
        primary key (ID)
    ) engine=InnoDB;

    create table HEALTH_BOX_PRODUCT_SKU (
       ID bigint not null auto_increment,
        CREATED_AT datetime(6) not null,
        UPDATED_AT datetime(6) not null,
        CONSUMER_PRICE integer,
        DELETED_AT datetime(6),
        DELETED_YN varchar(1) not null,
        MEMBER_PRICE integer,
        PRODUCT_ID bigint not null,
        SAFETY_STOCK integer,
        SETTLEMENT_BASE_PRICE integer,
        SKU_CODE varchar(100) not null,
        SKU_NAME varchar(200) not null,
        SOLD_OUT_YN varchar(1) not null,
        STATUS varchar(30) not null,
        STOCK_QUANTITY integer,
        SUPPLY_PRICE integer,
        primary key (ID)
    ) engine=InnoDB;

    create table HEALTH_BOX_PRODUCT_SKU_OPTION (
       ID bigint not null auto_increment,
        CREATED_AT datetime(6) not null,
        UPDATED_AT datetime(6) not null,
        OPTION_GROUP_ID bigint not null,
        OPTION_VALUE_ID bigint not null,
        SKU_ID bigint not null,
        primary key (ID)
    ) engine=InnoDB;

    create table HEALTH_BOX_PUBLIC_SITE_CONFIG (
       ID bigint not null auto_increment,
        CREATED_AT datetime(6) not null,
        UPDATED_AT datetime(6) not null,
        CUSTOMER_CENTER_TEXT varchar(2000),
        FAVICON_URL varchar(255),
        LOGO_URL varchar(255),
        MAIN_NAVIGATION_JSON TEXT,
        MAIN_VISUAL_URL varchar(255),
        MAIN_VISUAL_LINK_URL varchar(1000),
        META_DESCRIPTION varchar(1000),
        META_TITLE varchar(255),
        MIDDLE_BANNER_URL varchar(255),
        MIDDLE_BANNER_LINK_URL varchar(1000),
        POLICY_TEXT LONGTEXT,
        SEARCH_PLACEHOLDER varchar(255),
        SHARE_THUMBNAIL_URL varchar(255),
        primary key (ID)
    ) engine=InnoDB;

    create table HEALTH_BOX_SALES_POLICY (
       ID bigint not null auto_increment,
        CREATED_AT datetime(6) not null,
        UPDATED_AT datetime(6) not null,
        CONTENT longtext not null,
        DELETED_AT datetime(6),
        DELETED_YN varchar(1) not null,
        SORT_ORDER integer,
        STATUS varchar(30) not null,
        TITLE varchar(150) not null,
        primary key (ID)
    ) engine=InnoDB;

    create table HEALTH_BOX_SHIPMENT (
       ID bigint not null auto_increment,
        CREATED_AT datetime(6) not null,
        UPDATED_AT datetime(6) not null,
        COURIER_COMPANY varchar(100),
        DELIVERED_AT datetime(6),
        HANDLER_ACCOUNT_ID bigint,
        ORDER_ID bigint not null,
        SHIPMENT_STATUS varchar(30) not null,
        SHIPPED_AT datetime(6),
        TRACKING_NO varchar(100),
        primary key (ID)
    ) engine=InnoDB;

    create table HEALTH_BOX_SHIPMENT_ITEM (
       ID bigint not null auto_increment,
        CREATED_AT datetime(6) not null,
        UPDATED_AT datetime(6) not null,
        ORDER_ITEM_ID bigint not null,
        QUANTITY integer not null,
        SHIPMENT_ID bigint not null,
        primary key (ID)
    ) engine=InnoDB;
create index IDX_HEALTH_BOX_BUYER_CART_MEMBER on HEALTH_BOX_BUYER_CART_ITEM (BUYER_MEMBER_ID, DEALER_MALL_ID);

    alter table HEALTH_BOX_BUYER_CART_ITEM 
       add constraint UK_HEALTH_BOX_BUYER_CART_SKU unique (BUYER_MEMBER_ID, DEALER_MALL_ID, SKU_ID);

    alter table HEALTH_BOX_CATEGORY 
       add constraint UK_bx84d1jb4laaq6iu8ytjmoh9y unique (CATEGORY_CODE);

    alter table HEALTH_BOX_CATEGORY 
       add constraint UK_iiv15yd0g059wkh1cb3a8ueak unique (SLUG);

    alter table HEALTH_BOX_DEALER_MALL 
       add constraint UK_HEALTH_BOX_DEALER_MALL_SLUG unique (SLUG);

    alter table HEALTH_BOX_DEALER_MALL 
       add constraint UK_HEALTH_BOX_DEALER_MALL_CODE unique (DEALER_CODE);

    alter table HEALTH_BOX_INVENTORY 
       add constraint UK_c51elhq5wgcy5h79ax7b074qh unique (PRODUCT_ID);

    alter table HEALTH_BOX_NOTICE 
       add constraint UK_a9ftp9bds36t78k5mhdyoyg67 unique (SLUG);

    alter table HEALTH_BOX_ORDER_HEADER 
       add constraint UK_am91in5hwlj14nbcq7hikbu7f unique (ORDER_NO);

    alter table HEALTH_BOX_PAYMENT 
       add constraint UK_HEALTH_BOX_PAYMENT_KEY unique (PAYMENT_KEY);

    alter table HEALTH_BOX_PAYMENT 
       add constraint UK_HEALTH_BOX_PAYMENT_ORDER_ID unique (PAYMENT_ORDER_ID);

    alter table HEALTH_BOX_PAYMENT_CANCEL_REQUEST 
       add constraint UK_jhysr9tbih3ktypkiaam4c000 unique (REQUEST_ID);

    alter table HEALTH_BOX_PRODUCT 
       add constraint UK_d1gjwhfpity2rsuebwp9pw0yl unique (PRODUCT_CODE);

    alter table HEALTH_BOX_PRODUCT 
       add constraint UK_ndxcgi6ijy3rvofpw293yy5l3 unique (SLUG);

    alter table HEALTH_BOX_PRODUCT_SKU 
       add constraint UK_l6o5n9vtgv22xydocvkyq3wk0 unique (SKU_CODE);
