-- Health-box dealer application consent migration. Additive only: no existing data is removed or changed.
ALTER TABLE HEALTH_BOX_DEALER_APPLICATION
    ADD COLUMN PRIVACY_AGREED_AT datetime(6) NULL;
ALTER TABLE HEALTH_BOX_DEALER_APPLICATION
    ADD COLUMN CONSENT_DOCUMENT_VERSION varchar(20) NULL;
