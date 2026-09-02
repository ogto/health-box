// Run on a fresh local /dealer-apply page with agent-browser eval --stdin.
// Example (PowerShell): Get-Content -Raw scripts/verify-dealer-contract.browser.js |
//   npx.cmd --yes agent-browser --session dealer-contract eval --stdin
// This test stubs printing, file saving and application submission; it never creates DB records.
(async () => {
  if (!['localhost', '127.0.0.1'].includes(location.hostname) || location.pathname !== '/dealer-apply') {
    throw new Error('Run this test only on the local dealer application page.');
  }

  const passed = [];
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
    passed.push(message);
  };
  const waitFor = async (predicate) => {
    const deadline = Date.now() + 15000;
    while (!predicate()) {
      if (Date.now() > deadline) throw new Error('Timed out waiting for contract UI');
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  };
  const tick = () => new Promise((resolve) => setTimeout(resolve, 100));
  const submit = () => document.querySelector('.dealer-application-submit');
  const confirmation = () => document.querySelector('.dealer-contract-confirmation input');
  const popupButton = (label) => [...popup.document.querySelectorAll('header button')].find((button) => button.textContent === label);
  const originalFetch = window.fetch;
  const originalOpen = window.open;
  const requests = [];
  let popup;
  let failNextRequest = true;

  window.fetch = async (input, init) => {
    if (new URL(String(input), location.href).pathname === '/api/dealer-applications') {
      requests.push(JSON.parse(init.body));
      const failure = failNextRequest;
      failNextRequest = false;
      return new Response(JSON.stringify(failure
        ? {ok: false, message: 'LOCAL_QA_RETRY'}
        : {ok: true, applicationId: 900001}), {
        status: failure ? 400 : 200,
        headers: {'Content-Type': 'application/json'},
      });
    }
    return originalFetch.call(window, input, init);
  };

  try {
    assert(submit().disabled && confirmation().disabled, 'Initial contract gate locked');
    assert(document.querySelector('.dealer-contract-section a[href="mailto:1everybuy@naver.com"]')?.textContent === '1everybuy@naver.com', 'Contract instructions link to the scan submission email');
    assert(!/사진|촬영/.test(document.querySelector('.dealer-application-card').textContent), 'Application instructions request scans instead of photos');
    document.querySelector('.dealer-application-form').dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}));
    await tick();
    assert(requests.length === 0, 'Unconfirmed submission blocked');

    window.open = () => null;
    document.querySelector('.dealer-contract-file button').click();
    await tick();
    assert(document.querySelector('[role=alert]')?.textContent.includes('차단'), 'Popup blocking explained');
    assert(submit().disabled && confirmation().disabled, 'Blocked popup does not unlock submission');

    window.open = (...args) => {
      popup = originalOpen.apply(window, args);
      return popup;
    };
    document.querySelector('.dealer-contract-file button').click();
    await waitFor(() => popup && popup.document.querySelector('header button.button-primary') && !popup.document.querySelector('header button.button-primary').disabled);
    const pages = [...popup.document.querySelectorAll('main img')];
    assert(pages.length === 7 && pages.every((page) => page.complete && page.naturalWidth > 0), 'All seven contract pages loaded');
    assert([...popup.document.querySelectorAll('header button')].map((button) => button.textContent).join('|') === '인쇄|저장|신청 화면으로 돌아가기', 'Toolbar has only the three requested button labels');
    assert(!/V3|A4|7쪽|사전 승인|머리글|바닥글/.test(popup.document.querySelector('header').textContent), 'Version and explanatory toolbar copy removed');
    assert(confirmation().disabled && submit().disabled, 'Preview alone does not unlock submission');

    const message = {type: 'health-box:dealer-contract-print-requested', version: 'V3', requestId: popup.location.hash.slice(1)};
    window.dispatchEvent(new MessageEvent('message', {origin: 'https://invalid.example', source: popup, data: message}));
    window.dispatchEvent(new MessageEvent('message', {origin: location.origin, source: window, data: message}));
    window.dispatchEvent(new MessageEvent('message', {origin: location.origin, source: popup, data: {...message, requestId: 'invalid'}}));
    await tick();
    assert(confirmation().disabled, 'Wrong origin, source and request ID rejected');

    let printCalls = 0;
    popup.print = () => { throw new Error('LOCAL_PRINT_FAILURE'); };
    popupButton('인쇄').click();
    await waitFor(() => popup.document.querySelector('[role=alert]'));
    assert(confirmation().disabled && submit().disabled, 'Failed print request does not unlock confirmation');
    popup.print = () => { printCalls += 1; };
    popupButton('인쇄').click();
    await waitFor(() => !confirmation().disabled);
    assert(printCalls === 1 && submit().disabled, 'Print requested, explicit completion still required');
    popupButton('신청 화면으로 돌아가기').click();
    await waitFor(() => popup.closed);
    assert(!confirmation().disabled && !confirmation().checked, 'Returning after print preserves the enabled, unchecked confirmation');
    confirmation().click();
    await tick();
    assert(!submit().disabled, 'Completion confirmation unlocks submission');
    confirmation().click();
    await tick();
    assert(submit().disabled, 'Removing confirmation locks submission again');
    confirmation().click();

    const fields = {
      applicantName: '로컬 검증', phone: '01000000000', email: 'dealer-qa@example.com',
      companyName: '로컬 검증 상호', wantedMallName: '로컬검증몰', wantedSlug: 'local-contract-qa',
      applicationReason: '로컬 테스트 전용 신청이며 실제 서버에 접수하지 않습니다.',
    };
    for (const [name, value] of Object.entries(fields)) {
      const input = document.querySelector(`[name="${name}"]`);
      const prototype = input.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, value);
      input.dispatchEvent(new Event('input', {bubbles: true}));
    }
    document.querySelector('[name=privacyAgreed]').click();
    await tick();
    assert(document.querySelector('.dealer-application-form').checkValidity(), 'Required application fields remain valid');
    submit().click();
    await waitFor(() => document.querySelector('[role=alert]')?.textContent === 'LOCAL_QA_RETRY');
    assert(requests.length === 1 && !submit().disabled && confirmation().checked, 'Failed submission preserves form and confirmation for retry');
    submit().click();
    await waitFor(() => document.querySelector('.dealer-application-success'));
    assert(requests.length === 2, 'Mock submission completes successfully');
    assert(requests.every((request) => !Object.keys(request).some((key) => /contract|print/i.test(key))), 'Contract confirmation is not sent to API or persisted');
    assert(requests[1].wantedSlug === fields.wantedSlug && requests[1].privacyAgreed, 'Existing application payload preserved');
    assert(document.querySelector('.dealer-application-success').textContent.includes('우편'), 'Success screen explains remaining contract process');
    assert(document.querySelector('.dealer-application-success a[href="mailto:1everybuy@naver.com"]') && !/사진|촬영/.test(document.querySelector('.dealer-application-success').textContent), 'Success instructions repeat the scan submission email without photo wording');
    document.querySelector('.dealer-application-success-actions button').click();
    await waitFor(() => submit());
    assert(submit().disabled && confirmation().disabled && !confirmation().checked, 'New application resets contract confirmation');

    const applicant = document.querySelector('[name=applicantName]');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(applicant, '저장 후 돌아오기 검증');
    applicant.dispatchEvent(new Event('input', {bubbles: true}));
    document.querySelector('.dealer-contract-file button').click();
    await waitFor(() => popup && popupButton('저장'));
    popupButton('신청 화면으로 돌아가기').click();
    await waitFor(() => popup.closed);
    assert(confirmation().disabled && submit().disabled, 'Returning without print or save does not unlock confirmation');

    document.querySelector('.dealer-contract-file button').click();
    await waitFor(() => popup && popupButton('저장'));
    const popupFetch = popup.fetch;
    let downloadAttempt = 0;
    let releaseDownload;
    popup.fetch = async (input, init) => {
      if (new URL(String(input), popup.location.href).pathname === '/documents/dealer-agreement-v3.pdf') {
        downloadAttempt += 1;
        if (downloadAttempt === 1) return new popup.Response('', {status: 503});
        if (downloadAttempt === 2) return new popup.Response('<html>Error</html>', {headers: {'Content-Type': 'text/html'}});
        await new Promise((resolve) => { releaseDownload = resolve; });
      }
      return popupFetch.call(popup, input, init);
    };
    let download;
    const anchorClick = popup.HTMLAnchorElement.prototype.click;
    popup.HTMLAnchorElement.prototype.click = function () {
      if (this.download && this.href.startsWith('blob:')) {
        download = {name: this.download, body: popupFetch.call(popup, this.href).then((response) => response.text())};
        return;
      }
      return anchorClick.call(this);
    };

    popupButton('저장').click();
    await tick();
    await waitFor(() => popup.document.querySelector('[role=alert]') && !popupButton('저장').disabled);
    assert(!download && confirmation().disabled && submit().disabled, 'Failed PDF request shows an error and keeps confirmation locked');
    popupButton('저장').click();
    await tick();
    await waitFor(() => downloadAttempt === 2 && !popupButton('저장').disabled);
    assert(!download && confirmation().disabled, 'Invalid PDF response does not unlock confirmation');
    popupButton('저장').click();
    await waitFor(() => releaseDownload);
    assert(popupButton('저장').disabled && popupButton('신청 화면으로 돌아가기').disabled && confirmation().disabled, 'Pending download prevents duplicate saving and returning too early');
    releaseDownload();
    await waitFor(() => download && !confirmation().disabled && !popupButton('저장').disabled);
    assert((await download.body).startsWith('%PDF-') && download.name.endsWith('.pdf'), 'Save retrieves the real contract PDF and starts a named download');
    assert(!confirmation().checked && submit().disabled, 'Save enables confirmation but does not check it automatically');
    popupButton('신청 화면으로 돌아가기').click();
    await waitFor(() => popup.closed);
    assert(!confirmation().disabled && document.querySelector('[name=applicantName]').value === '저장 후 돌아오기 검증', 'Returning after save preserves the form and enabled confirmation');
    assert(confirmation().closest('label').textContent.includes('인쇄 또는 저장'), 'Confirmation accurately describes printing or saving');
    confirmation().click();
    await tick();
    assert(!submit().disabled && requests.length === 2, 'Saved contract can be confirmed without creating a real application');
    return {passed: passed.length, checks: passed, realSubmissions: 0};
  } catch (error) {
    const state = popup && !popup.closed ? popup.document.querySelector('header')?.innerText : 'Popup closed';
    throw new Error(`${error.message}; last passed: ${passed.at(-1)}; popup: ${state}`);
  } finally {
    window.fetch = originalFetch;
    window.open = originalOpen;
    popup?.close();
  }
})()
