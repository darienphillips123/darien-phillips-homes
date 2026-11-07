/* ===== Ask Darien chat helper =====
   Client-side only. No external AI, no API key, no cost, no backend.
   Answers come only from this site's own data and copy. A review or a
   website problem is sent by the visitor's own text or email app to
   Darien. Nothing is stored on this site. */
(function () {
  var fab = document.getElementById('chat-fab');
  var panel = document.getElementById('chat-panel');
  var msgs = document.getElementById('chat-msgs');
  var chipsEl = document.getElementById('chat-chips');
  var input = document.getElementById('chat-text');
  var sendBtn = document.getElementById('chat-send');
  var closeBtn = document.getElementById('chat-close');
  if (!fab || !panel || !msgs) return;

  var DARIEN = { sms: 'sms:+12098826469', tel: 'tel:+12098826469', mail: 'mailto:darienphillips45@gmail.com' };
  var mode = null; // null | 'review' | 'problem' | 'realtor' | 'agent-name' | 'agent-brokerage' | 'agent-contact' | 'home-name'
  var greeted = false;
  var chatAgent = {};
  var chatHome = '';

  function contactHtml() {
    return '<a href="' + DARIEN.sms + '">Text Darien</a> · <a href="' + DARIEN.tel + '">Call Darien</a> · <a href="' + DARIEN.mail + '">Email Darien</a>';
  }
  function addMsg(text, who, html) {
    var d = document.createElement('div');
    d.className = 'chat-msg ' + (who || 'bot');
    if (html) d.innerHTML = text; else d.textContent = text;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }
  function showChips(list) {
    chipsEl.innerHTML = '';
    list.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = c[0];
      b.addEventListener('click', function () { handle(c[1] || c[0]); });
      chipsEl.appendChild(b);
    });
  }
  function askDarien(text) {
    addMsg(text + '<br>' + contactHtml(), 'bot', true);
  }
  function startReview() {
    mode = 'review';
    addMsg('Thanks, I would love to hear it. Type your review below and I will get it ready to send to Darien.');
    showChips([]);
  }
  function startProblem() {
    mode = 'problem';
    addMsg('Sorry about that. Tell me in a few words what went wrong, for example a page that will not load or a button that does nothing, and I will get it ready to send to Darien.');
    showChips([]);
  }
  function finishReport(kind, text) {
    mode = null;
    var subject = kind === 'review' ? 'Website review' : 'Website problem';
    var body = (kind === 'review' ? 'Hi Darien, here is my review of your website: ' : 'Hi Darien, I had a problem with your website: ') + text;
    var smsHref = DARIEN.sms + '?&body=' + encodeURIComponent(body);
    var mailHref = DARIEN.mail + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    addMsg('Here it is, ready to send. Tap one and it opens in your own text or email app. It is not stored on this site.', 'bot');
    addMsg('<a href="' + smsHref + '">Text this to Darien</a> · <a href="' + mailHref + '">Email this to Darien</a>', 'bot', true);
    showChips([['Talk to Darien', 'talk'], ['Ask something else', 'home']]);
  }
  // Details first, agent question at the end, RIO ManyChat style.
  // The visitor gets the details and link first, then is asked if they
  // are working with an agent. Yes collects the agent's info, No just
  // confirms, they already have the details.
  function startRealtor(home) {
    mode = 'realtor'; chatHome = home || '';
    var link = ' Here are the details: darienphillips.exprealty.com. You can also search for it on this site.';
    addMsg('Thanks for asking! Here are the details' + (chatHome ? ' on ' + chatHome : '') + '.' + link);
    addMsg('Are you working with an agent?');
    showChips([['Yes, I have an agent', 'realtor-yes'], ['No, I do not', 'realtor-no']]);
  }
  function startAgentInfo() {
    mode = 'agent-name'; chatAgent = {};
    addMsg('No problem. What is your agent\'s name?');
    showChips([]);
  }
  function noRealtor() {
    if (typeof setRealtorPass === 'function') setRealtorPass(false, null);
    if (chatHome) {
      mode = null;
      addMsg('No problem, you already have the details. Text, call or email Darien any time and he will help with ' + chatHome + '.');
      showChips([['Talk to Darien', 'talk'], ['Ask something else', 'home']]);
      return;
    }
    mode = 'home-name';
    addMsg('No problem, you already have the details at darienphillips.exprealty.com. Which home would you like info on? Type the street or town, and I will point you to it.');
    showChips([['Talk to Darien', 'talk']]);
  }
  function finishAgentInfo() {
    mode = null;
    if (typeof setRealtorPass === 'function') setRealtorPass(true, chatAgent);
    var body = 'Hi Darien, I would like home information' + (chatHome ? ' on ' + chatHome : '') + '.\n\nI am working with a realtor.\n\nAgent: ' + chatAgent.name + '\nBrokerage: ' + (chatAgent.brokerage || 'Not given') + '\nAgent contact: ' + chatAgent.contact + '\n\nPlease send all home info to my agent to share with me.';
    addMsg((typeof REALTOR_MSG !== 'undefined' ? REALTOR_MSG : 'Thanks, Darien will be in contact with you soon to send all home info to your agent to share with you.'));
    addMsg('<a href="' + DARIEN.sms + '?&body=' + encodeURIComponent(body) + '">Text this to Darien</a> · <a href="' + DARIEN.mail + '?subject=' + encodeURIComponent('Home info for my agent') + '&body=' + encodeURIComponent(body) + '">Email this to Darien</a>', 'bot', true);
    showChips([['Talk to Darien', 'talk'], ['Ask something else', 'home']]);
  }
  function answer(q) {
    var s = (q || '').toLowerCase();
    var nAssum = (typeof DATA !== 'undefined' && DATA.assumables) ? DATA.assumables.length : 92;
    var nComm = (typeof DATA !== 'undefined' && DATA.communities) ? DATA.communities.length : 456;
    var rate = (typeof RATES !== 'undefined' && RATES.conv) ? RATES.conv : '7.24';
    if (/(human|person|real person|talk to darien|call darien|text darien|email darien|contact)/.test(s)) { askDarien('Here is Darien, any time:'); return; }
    if (/(full details|more info|more information|home information|details on|tell me about this home|info on a home|info about a home)/.test(s)) {
      var foundHome = null;
      try { foundHome = (typeof propSearch === 'function') ? propSearch(q, 1)[0] : null; } catch (e) { foundHome = null; }
      startRealtor(foundHome ? (typeof propTitle === 'function' ? propTitle(foundHome, true) : foundHome.addr) : q);
      return;
    }
    if (/(zero|0 down|no down|no money down|down payment)/.test(s)) {
      addMsg('Yes, $0 down is possible here with VA, USDA, or FHA plus California\'s MyHome loan, and some builders help too. The $0 down tab walks through each one and lets you search by city. Want Darien to run your exact numbers? ' + contactHtml(), 'bot', true);
      showChips([['See the $0 down tab', 'go:zero-down'], ['Talk to Darien', 'talk']]);
      return;
    }
    if (/(assumable|take over|low rate)/.test(s)) {
      addMsg('An assumable loan lets you take over a seller\'s FHA, VA or USDA loan, rate and all. This site lists ' + nAssum + ' homes with assumable loans right now. The Assumable tab explains how it works, including the cash gap. ' + contactHtml(), 'bot', true);
      showChips([['See assumable homes', 'go:assumable'], ['Talk to Darien', 'talk']]);
      return;
    }
    if (/(adu|guest house|in-law|backyard|second home|two homes)/.test(s)) {
      addMsg('An ADU is a second home on one lot, like a backyard cottage or in-law suite. The ADU tab has a checker for your city\'s rules, free plans, and real homes on the site that already have an ADU or guest house. ' + contactHtml(), 'bot', true);
      showChips([['See the ADU tab', 'go:adu'], ['Talk to Darien', 'talk']]);
      return;
    }
    if (/(new build|new home|builder|community)/.test(s)) {
      addMsg('There are ' + nComm + ' new-home communities on this site across Placer, Sacramento, San Joaquin and Stanislaus. The New builds tab has a map, builder deals and move-in ready homes. Builders usually need your agent at the first visit, so text Darien first and he will register you. ' + contactHtml(), 'bot', true);
      showChips([['See new builds', 'go:new-builds'], ['Talk to Darien', 'talk']]);
      return;
    }
    if (/(rate|interest|mortgage rate|payment)/.test(s)) {
      addMsg('The average 30-year rate on this site is ' + rate + '% as of Oct 29, 2026. Assumable loans are often much lower. The By payment tab shows which homes fit your monthly budget. Rates change fast, so ask Darien to check today\'s number. ' + contactHtml(), 'bot', true);
      showChips([['Homes by payment', 'go:payment'], ['Talk to Darien', 'talk']]);
      return;
    }
    if (/(buy|buying|first home|first time|how do i|how to buy|pre-approval|preapproval)/.test(s)) {
      addMsg('Start with the Beginner\'s guide tab. It walks through every step from pre-approval to keys, in plain words. Then Darien can set up a custom MLS page for you. ' + contactHtml(), 'bot', true);
      showChips([['Read the guide', 'go:guide'], ['Talk to Darien', 'talk']]);
      return;
    }
    if (/(review|feedback|love it|great site)/.test(s)) { startReview(); return; }
    if (/(problem|broken|bug|not working|won.t load|error|issue with the site|website)/.test(s)) { startProblem(); return; }
    if (/(cart|saved|save)/.test(s)) {
      addMsg('Tap Add to cart on any home and it stays in Your Cart, like shopping. You can ask Darien about all of them at once from the cart page. ' + contactHtml(), 'bot', true);
      showChips([['Open my cart', 'go:cart'], ['Talk to Darien', 'talk']]);
      return;
    }
    if (/(search|find a home|map)/.test(s)) {
      addMsg('Use Map search to see every home for sale on a map, or the search box at the top of the home page. Try a town, a zip code, assumable, or $0 down. ' + contactHtml(), 'bot', true);
      showChips([['Open map search', 'go:search'], ['Talk to Darien', 'talk']]);
      return;
    }
    addMsg('I do not know that one yet, and I would rather say so than guess. Darien can answer it for you:');
    askDarien('Here is Darien:');
    showChips([['Talk to Darien', 'talk'], ['Leave a review', 'review'], ['Report a problem', 'problem']]);
  }
  function handle(text) {
    if (text === 'realtor-yes') { startAgentInfo(); return; }
    if (text === 'realtor-no') { noRealtor(); return; }
    if (text === 'home-info') { startRealtor(''); return; }
    if (text === 'talk') { askDarien('Here is Darien:'); return; }
    if (text === 'review') { startReview(); return; }
    if (text === 'problem') { startProblem(); return; }
    if (text === 'home') { showHomeChips(); return; }
    if (text.indexOf('go:') === 0) {
      var page = text.slice(3);
      addMsg('Opening that page for you.');
      if (typeof go === 'function') go(page); else location.hash = '#' + page;
      return;
    }
    answer(text);
  }
  function showHomeChips() {
    showChips([
      ['Buying a home', 'How do I buy a home?'],
      ['$0 down', 'Can I buy with $0 down?'],
      ['Assumable loans', 'What is an assumable loan?'],
      ['ADU', 'What is an ADU?'],
      ['New builds', 'Tell me about new builds'],
      ['Rates', 'What are rates right now?'],
      ['Home information', 'home-info'],
      ['Talk to Darien', 'talk'],
      ['Leave a review', 'review'],
      ['Report a problem', 'problem']
    ]);
  }
  function send() {
    var v = (input.value || '').trim();
    if (!v) return;
    addMsg(v, 'me');
    input.value = '';
    if (mode === 'review') { finishReport('review', v); return; }
    if (mode === 'problem') { finishReport('problem', v); return; }
    if (mode === 'agent-name') {
      chatAgent.name = v; mode = 'agent-brokerage';
      addMsg('Thanks. What brokerage is your agent with? If you do not know, just type "not sure".');
      showChips([]);
      return;
    }
    if (mode === 'agent-brokerage') {
      chatAgent.brokerage = v; mode = 'agent-contact';
      addMsg('And how can Darien reach your agent, phone or email?');
      showChips([]);
      return;
    }
    if (mode === 'agent-contact') {
      var phoneOk = v.replace(/\D/g, '').length >= 10;
      var emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
      if (!phoneOk && !emailOk) { addMsg('That does not look like a phone number or an email. Please type your agent\'s phone or email so Darien can reach them.'); return; }
      chatAgent.contact = v; chatAgent.phone = phoneOk ? v : ''; chatAgent.email = emailOk ? v : '';
      finishAgentInfo();
      return;
    }
    if (mode === 'home-name') {
      mode = null;
      var found = null;
      try { found = (typeof propSearch === 'function') ? propSearch(v, 1)[0] : null; } catch (e) { found = null; }
      if (found) {
        addMsg('Here it is. Tap Get full details on that page and Darien will send it straight to you.');
        showChips([['Open that home', 'go:p/' + found.key], ['Talk to Darien', 'talk']]);
      } else {
        addMsg('I could not find that home on the site. Darien can find it for you:');
        askDarien('Here is Darien:');
        showChips([['Talk to Darien', 'talk']]);
      }
      return;
    }
    if (mode === 'realtor') { addMsg('Tap Yes or No above, and I will take it from there.'); return; }
    answer(v);
  }
  function openChat() {
    panel.hidden = false;
    fab.setAttribute('aria-expanded', 'true');
    if (!greeted) {
      greeted = true;
      addMsg('Hi, I am Darien\'s site helper. Ask me about buying a home, $0 down, assumable loans, ADUs, or new builds. If I cannot answer, I will connect you with Darien.');
      showHomeChips();
    }
    input.focus();
  }
  fab.addEventListener('click', function () {
    if (panel.hidden) openChat(); else { panel.hidden = true; fab.setAttribute('aria-expanded', 'false'); }
  });
  closeBtn.addEventListener('click', function () { panel.hidden = true; fab.setAttribute('aria-expanded', 'false'); });
  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') send(); });
})();
