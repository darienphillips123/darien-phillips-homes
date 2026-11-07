"""Analytics-gap test for Darien Phillips' website (Nov 2026).

Loads the built site from web/ on localhost with the Google tracker URL
stubbed: every POST to the tracker is captured and answered {ok: true},
so no request ever reaches the live tracker or the live sheet.
Clicks a tab, clicks Click to get the details, completes the No path,
completes the agent Yes path, completes a signup (No and Yes), and
completes a cart agent request, asserting each expected event was sent
with the right h / s / pg. Run: python3 test-analytics-gaps.py
"""
import json
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8765"
TRACKER_HOST = "script.google.com"

captured = []  # parsed JSON bodies posted to the tracker, in order
page_errors = []


def start_server():
    proc = subprocess.Popen(
        [sys.executable, "-m", "http.server", "8765", "--bind", "127.0.0.1"],
        cwd="/home/hatch/workspace/darien-website-live/web",
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(50):
        time.sleep(0.2)
        try:
            import urllib.request
            urllib.request.urlopen(BASE + "/", timeout=1)
            return proc
        except Exception:
            pass
    raise RuntimeError("local server did not start")


def install_tracker_stub(page):
    def handler(route):
        req = route.request
        if req.method == "GET":
            route.fulfill(status=200, content_type="application/json",
                          body=json.dumps({"ok": True, "listings": []}))
            return
        body = req.post_data or ""
        try:
            captured.append(json.loads(body))
        except Exception:
            captured.append({"_raw": body})
        route.fulfill(status=200, content_type="application/json",
                      body=json.dumps({"ok": True}))
    page.route(f"**/{TRACKER_HOST}/**", handler)


def events(h=None, s=None, type_=None):
    out = []
    for e in captured:
        if type_ and e.get("type") != type_:
            continue
        if h is not None and e.get("h") != h:
            continue
        if s is not None and e.get("s") != s:
            continue
        out.append(e)
    return out


def check(name, cond, detail=""):
    print(("PASS" if cond else "FAIL") + "  " + name + (("  (" + detail + ")") if detail else ""))
    return bool(cond)


def main():
    server = start_server()
    passed = failed = 0
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            # --- Context 1: tabs, property Click to get details, sign-in No path
            ctx = browser.new_context()
            page = ctx.new_page()
            page.on("pageerror", lambda e: page_errors.append(str(e)))
            install_tracker_stub(page)
            page.goto(BASE + "/", wait_until="load")
            page.wait_for_timeout(800)
            if not check("site loads, no page errors", not page_errors, "; ".join(page_errors)):
                failed += 1
            else:
                passed += 1
            page.click("#kw [data-go='finder']")
            page.wait_for_timeout(700)
            ev = events(h="Tab: Find your home", s="Tab", type_="click")
            ok = check("tab click Finder sends Tab event", len(ev) == 1 and ev[0].get("pg") == "Home",
                       json.dumps(ev[0]) if ev else "no event")
            passed, failed = passed + ok, failed + (not ok)
            page.click("#kw [data-go='search']")
            page.wait_for_timeout(700)
            ev = events(h="Tab: Map search", s="Tab", type_="click")
            ok = check("tab click Map search sends Tab event", len(ev) == 1 and ev[0].get("pg") == "Find your home",
                       json.dumps(ev[0]) if ev else "no event")
            passed, failed = passed + ok, failed + (not ok)
            # Re-clicking the same tab still fires (pv alone would not).
            page.click("#kw [data-go='search']")
            page.wait_for_timeout(700)
            ev = events(h="Tab: Map search", s="Tab", type_="click")
            ok = check("re-clicking same tab fires again", len(ev) == 2, f"count={len(ev)}")
            passed, failed = passed + ok, failed + (not ok)

            page.goto(BASE + "/#p/8160-encino-ave", wait_until="load")
            page.wait_for_timeout(800)
            page.click("[data-prop-details]")
            page.wait_for_timeout(700)
            ev = events(h="Clicked to get details: 8160 Encino Ave, Stockton", s="Details", type_="click")
            ok = check("property Click to get details sends Details event", len(ev) == 1 and ev[0].get("p") == "$685,000",
                       json.dumps(ev[0]) if ev else "no event")
            passed, failed = passed + ok, failed + (not ok)
            page.click("[data-pf-realtor='no']")
            page.fill("#pf-name", "Test Buyer")
            page.fill("#pf-phone", "209-555-0100")
            page.fill("#pf-email", "testbuyer@example.com")
            page.click("#pf-go")
            page.wait_for_timeout(900)
            leads = events(type_="lead")
            ok = check("property sign-in No posts lead", len(leads) >= 1 and leads[-1].get("how") == "signin",
                       json.dumps(leads[-1]) if leads else "no lead")
            passed, failed = passed + ok, failed + (not ok)
            ev = events(h="Signed in to see: 8160 Encino Ave, Stockton", s="Info request", type_="click")
            ok = check("property sign-in No sends Info request event", len(ev) == 1,
                       json.dumps(ev[0]) if ev else "no event")
            passed, failed = passed + ok, failed + (not ok)
            ctx.close()

            # --- Context 2: gate card, No path (details, no agent)
            ctx = browser.new_context()
            page = ctx.new_page()
            page.on("pageerror", lambda e: page_errors.append(str(e)))
            install_tracker_stub(page)
            page.goto(BASE + "/", wait_until="load")
            page.wait_for_timeout(800)
            page.locator("[data-gate]").first.click()
            page.wait_for_timeout(700)
            clicked = events(s="Details", type_="click")
            home = clicked[-1]["h"].replace("Clicked to get details: ", "") if clicked else ""
            ok = check("card Click to get details sends Details event", len(clicked) >= 1 and home != "",
                       json.dumps(clicked[-1]) if clicked else "no event")
            passed, failed = passed + ok, failed + (not ok)
            page.click("#rt-no")
            page.wait_for_timeout(700)
            ev = events(h="Got details (no agent): " + home, s="Info request", type_="click")
            ok = check("gate No path sends Info request event", len(ev) == 1,
                       json.dumps(ev[0]) if ev else "no event, home=" + home)
            passed, failed = passed + ok, failed + (not ok)
            ctx.close()

            # --- Context 3: gate card, agent Yes path
            ctx = browser.new_context()
            page = ctx.new_page()
            page.on("pageerror", lambda e: page_errors.append(str(e)))
            install_tracker_stub(page)
            page.goto(BASE + "/", wait_until="load")
            page.wait_for_timeout(800)
            page.locator("[data-gate]").first.click()
            page.wait_for_timeout(700)
            clicked = events(s="Details", type_="click")
            home = clicked[-1]["h"].replace("Clicked to get details: ", "") if clicked else ""
            page.click("#rt-yes")
            page.wait_for_timeout(400)
            page.fill("#rt-name", "Alex Agent")
            page.fill("#rt-phone", "209-555-0200")
            page.locator("#rt-form button[type='submit']").click()
            page.wait_for_timeout(900)
            leads = [e for e in events(type_="lead") if e.get("hasAgent") == "yes"]
            ok = check("gate agent Yes posts lead with hasAgent=yes", len(leads) >= 1,
                       json.dumps(leads[-1]) if leads else "no lead")
            passed, failed = passed + ok, failed + (not ok)
            ev = events(h="Sent details to agent: " + home, s="Agent form", type_="click")
            ok = check("gate agent Yes sends Agent form event", len(ev) == 1,
                       json.dumps(ev[0]) if ev else "no event, home=" + home)
            passed, failed = passed + ok, failed + (not ok)
            ctx.close()

            # --- Context 4: signup, No path
            ctx = browser.new_context()
            page = ctx.new_page()
            page.on("pageerror", lambda e: page_errors.append(str(e)))
            install_tracker_stub(page)
            page.goto(BASE + "/", wait_until="load")
            page.wait_for_timeout(800)
            page.click("#kw [data-go='alerts']")
            page.wait_for_timeout(700)
            page.fill("#al-name", "Test Buyer")
            page.fill("#al-email", "testbuyer@example.com")
            page.fill("#al-phone", "209-555-0100")
            page.locator("#al-send").click()
            page.wait_for_timeout(600)
            page.click("#rt-no")
            page.wait_for_timeout(900)
            ok = check("signup No posts signup", len(events(type_="signup")) >= 1, "")
            passed, failed = passed + ok, failed + (not ok)
            ev = events(h="Signed up for homes by email", s="Info request", type_="click")
            ok = check("signup No sends Info request event", len(ev) == 1,
                       json.dumps(ev[0]) if ev else "no event")
            passed, failed = passed + ok, failed + (not ok)
            ctx.close()

            # --- Context 5: signup, agent Yes path
            ctx = browser.new_context()
            page = ctx.new_page()
            page.on("pageerror", lambda e: page_errors.append(str(e)))
            install_tracker_stub(page)
            page.goto(BASE + "/", wait_until="load")
            page.wait_for_timeout(800)
            page.click("#kw [data-go='alerts']")
            page.wait_for_timeout(700)
            page.fill("#al-name", "Test Buyer")
            page.fill("#al-email", "testbuyer@example.com")
            page.fill("#al-phone", "209-555-0100")
            page.locator("#al-send").click()
            page.wait_for_timeout(600)
            page.click("#rt-yes")
            page.wait_for_timeout(400)
            page.fill("#rt-name", "Alex Agent")
            page.fill("#rt-phone", "209-555-0200")
            page.locator("#rt-form button[type='submit']").click()
            page.wait_for_timeout(900)
            ev = events(h="Signed up, sent to agent", s="Agent form", type_="click")
            ok = check("signup agent Yes sends Agent form event", len(ev) == 1,
                       json.dumps(ev[0]) if ev else "no event")
            passed, failed = passed + ok, failed + (not ok)
            ctx.close()

            # --- Context 6: cart, agent Yes path
            ctx = browser.new_context()
            page = ctx.new_page()
            page.on("pageerror", lambda e: page_errors.append(str(e)))
            install_tracker_stub(page)
            page.goto(BASE + "/", wait_until="load")
            page.wait_for_timeout(800)
            page.locator("[data-cart]").first.click()
            page.wait_for_timeout(400)
            page.goto(BASE + "/#cart", wait_until="load")
            page.wait_for_timeout(800)
            page.locator("[data-cart-contact='sms']").click()
            page.wait_for_timeout(600)
            page.click("#rt-yes")
            page.wait_for_timeout(400)
            page.fill("#rt-name", "Alex Agent")
            page.fill("#rt-phone", "209-555-0200")
            page.locator("#rt-form button[type='submit']").click()
            page.wait_for_timeout(900)
            ev = events(h="Sent details to agent: your cart (1 home)", s="Agent form", type_="click")
            ok = check("cart agent Yes sends Agent form event", len(ev) == 1,
                       json.dumps(ev[0]) if ev else "no event")
            passed, failed = passed + ok, failed + (not ok)
            # --- Context 7: property sign-in, agent Yes path
            ctx = browser.new_context()
            page = ctx.new_page()
            page.on("pageerror", lambda e: page_errors.append(str(e)))
            install_tracker_stub(page)
            page.goto(BASE + "/#p/8160-encino-ave", wait_until="load")
            page.wait_for_timeout(800)
            page.click("[data-prop-details]")
            page.wait_for_timeout(700)
            page.click("[data-pf-realtor='yes']")
            page.fill("#pf-aname", "Alex Agent")
            page.fill("#pf-aphone", "209-555-0200")
            page.click("#pf-go")
            page.wait_for_timeout(900)
            leads = [e for e in events(type_="lead") if e.get("hasAgent") == "yes"]
            ok = check("property agent Yes posts lead with hasAgent=yes", len(leads) >= 1,
                       json.dumps(leads[-1]) if leads else "no lead")
            passed, failed = passed + ok, failed + (not ok)
            ev = events(h="Sent details to agent: 8160 Encino Ave, Stockton", s="Agent form", type_="click")
            ok = check("property agent Yes sends Agent form event", len(ev) == 1,
                       json.dumps(ev[0]) if ev else "no event")
            passed, failed = passed + ok, failed + (not ok)
            ctx.close()
            browser.close()
    finally:
        server.terminate()
    print(f"\nRESULT: {passed} passed, {failed} failed | tracker: STUBBED (no live tracker calls) | page errors: {len(page_errors)}")
    if page_errors:
        print("page errors:", page_errors)
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
