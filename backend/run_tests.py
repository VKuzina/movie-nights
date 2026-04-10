import urllib.request, urllib.parse, json, time, random

BASE = "http://localhost:8080"
suffix = str(random.randint(1000, 9999))
ALICE   = {"username": f"alice_{suffix}",   "email": f"alice_{suffix}@test.com",   "password": "AlicePass123!"}
BOB     = {"username": f"bob_{suffix}",     "email": f"bob_{suffix}@test.com",     "password": "BobPass456!"}
CHARLIE = {"username": f"charlie_{suffix}", "email": f"charlie_{suffix}@test.com", "password": "CharliePass789!"}

all_pass = True

def req(method, path, body=None, token=None, expect=None):
    global all_pass
    url = BASE + path
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(r, timeout=8)
        status = resp.status
        body = resp.read()
        result = json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        status = e.code
        body = e.read()
        result = json.loads(body) if body else {}
    except Exception as e:
        print(f"  ✗ {method} {path} -> EXCEPTION: {e}")
        all_pass = False
        return {}, 0, False
    ok = (status == expect) if expect else (status < 400)
    if not ok:
        all_pass = False
    mark = "✓" if ok else "✗"
    note = f" (expected {expect}, got {status})" if not ok else ""
    print(f"  {mark} {method} {path} -> {status}{note}")
    return result, status, ok

def login(user):
    form = urllib.parse.urlencode({"username": user["username"], "password": user["password"]}).encode()
    r = urllib.request.Request(BASE + "/auth/login", data=form, method="POST")
    resp = urllib.request.urlopen(r, timeout=8)
    return json.loads(resp.read())["access_token"]

def check(condition, msg):
    global all_pass
    mark = "✓" if condition else "✗"
    if not condition:
        all_pass = False
    print(f"  {mark} {msg}")
    return condition

def section(name):
    print(f"\n── {name} ──")


# ── 1. Registration ──
section("Registration")
req("POST", "/auth/register", ALICE)
req("POST", "/auth/register", BOB)
req("POST", "/auth/register", CHARLIE)
req("POST", "/auth/register", ALICE, expect=400)  # duplicate username

# ── 2. Login ──
section("Login")
tok_alice   = login(ALICE);   print("  ✓ Alice logged in")
tok_bob     = login(BOB);     print("  ✓ Bob logged in")
tok_charlie = login(CHARLIE); print("  ✓ Charlie logged in")

try:
    bad = urllib.parse.urlencode({"username": ALICE["username"], "password": "wrongpassword"}).encode()
    urllib.request.urlopen(urllib.request.Request(BASE + "/auth/login", data=bad, method="POST"), timeout=8)
    check(False, "Bad password should be rejected")
except urllib.error.HTTPError:
    check(True, "Bad password correctly rejected")

# ── 3. Auth enforcement ──
section("Unauthenticated access blocked")
for method, path, body in [
    ("GET",  "/auth/me",           None),
    ("GET",  "/users/me/movies",   None),
    ("POST", "/events",            {"name": "x", "scheduled_at": "2026-01-01T00:00:00", "location": "x"}),
    ("GET",  "/events",            None),
    ("GET",  "/users/me/invites",  None),
]:
    req(method, path, body=body, token=None, expect=401)

# ── 4. Movie preferences ──
section("Movie preferences")
movies, _, _ = req("GET", "/movies")
m1_id, m2_id, m3_id = movies[0]["id"], movies[1]["id"], movies[2]["id"]

req("PUT", f"/movies/{m1_id}/preference", {"preference": "want_to_watch"},       tok_alice)
req("PUT", f"/movies/{m2_id}/preference", {"preference": "can_watch_if_needed"}, tok_alice)
req("PUT", f"/movies/{m3_id}/preference", {"preference": "dont_want_to_watch"},  tok_alice)

req("PUT", f"/movies/{m1_id}/preference", {"preference": "want_to_watch"},       tok_bob)
req("PUT", f"/movies/{m2_id}/preference", {"preference": "dont_want_to_watch"},  tok_bob)
req("PUT", f"/movies/{m3_id}/preference", {"preference": "want_to_watch"},       tok_bob)

alice_wants, _, _ = req("GET", "/users/me/movies?preference=want_to_watch",      token=tok_alice)
bob_wants,   _, _ = req("GET", "/users/me/movies?preference=want_to_watch",      token=tok_bob)
alice_ids = {m["id"] for m in alice_wants}
bob_ids   = {m["id"] for m in bob_wants}
check(m1_id in alice_ids and m3_id not in alice_ids, "Alice preferences isolated to her account")
check(m1_id in bob_ids   and m3_id in bob_ids,       "Bob preferences isolated to his account")

# Invalid preference value
req("PUT", f"/movies/{m1_id}/preference", {"preference": "invalid_value"}, tok_alice, expect=422)

# ── 5. Events ──
section("Event creation")
event, _, ok = req("POST", "/events", {
    "name": f"Movie Night {suffix}",
    "scheduled_at": "2026-12-01T19:00:00",
    "location": "Alice's Place"
}, tok_alice)
event_id = event.get("id")
check(ok and event_id is not None, f"Event created (id={event_id})")
evt_check, _, _ = req("GET", f"/events/{event_id}", token=tok_alice)
attendee_names = [a["username"] for a in evt_check.get("attendees", [])]
check(ALICE["username"] in attendee_names, "Alice auto-added as attendee")

# ── 6. Invite authorization ──
section("Invite authorization (organizer-only)")
req("POST", f"/events/{event_id}/invites", {"username": BOB["username"]}, tok_bob,     expect=403)
req("POST", f"/events/{event_id}/invites", {"username": BOB["username"]}, tok_charlie, expect=403)
req("POST", f"/events/{event_id}/invites", {"username": BOB["username"]}, tok_alice)         # OK
req("POST", f"/events/{event_id}/invites", {"username": BOB["username"]}, tok_alice, expect=400)  # duplicate

# ── 7. Invite flow ──
section("Invite accept/decline flow")
bob_invites, _, _ = req("GET", "/users/me/invites", token=tok_bob)
check(any(i["event"]["id"] == event_id for i in bob_invites), "Bob sees pending invite")

req("POST", f"/events/{event_id}/invites/respond", {"status": "accepted"}, tok_bob)
evt, _, _ = req("GET", f"/events/{event_id}", token=tok_alice)
check(any(a["username"] == BOB["username"] for a in evt.get("attendees", [])), "Bob is now an attendee")

# Bob cannot respond again
req("POST", f"/events/{event_id}/invites/respond", {"status": "declined"}, tok_bob, expect=404)

# ── 8. IDOR: event access ──
section("IDOR: non-attendee cannot access event")
req("GET",    f"/events/{event_id}",           token=tok_charlie, expect=403)
req("POST",   f"/events/{event_id}/movies",    {"movie_id": m3_id}, tok_charlie, expect=403)
req("DELETE", f"/events/{event_id}/movies/{m1_id}", token=tok_charlie, expect=403)
req("GET",    f"/events/{event_id}/suggestions", token=tok_charlie, expect=403)
req("POST",   f"/events/{event_id}/invites",   {"username": CHARLIE["username"]}, tok_charlie, expect=403)

charlie_events, _, _ = req("GET", "/events", token=tok_charlie)
check(not any(e["id"] == event_id for e in charlie_events), "Alice event not visible to Charlie")

# ── 9. Event movies & scoring ──
section("Event movies & preference scoring")
req("POST", f"/events/{event_id}/movies", {"movie_id": m1_id}, tok_alice)
req("POST", f"/events/{event_id}/movies", {"movie_id": m2_id}, tok_alice)
req("POST", f"/events/{event_id}/movies", {"movie_id": m3_id}, tok_alice)

evt, _, _ = req("GET", f"/events/{event_id}", token=tok_alice)
scores = {m["id"]: m["score"] for m in evt.get("movies", [])}
# m1: Alice +2, Bob +2 = 4
# m2: Alice +1, Bob -1 = 0
# m3: Alice -1, Bob +2 = 1
check(scores.get(m1_id) == 4, f"m1 score=4 (both want it), got {scores.get(m1_id)}")
check(scores.get(m2_id) == 0, f"m2 score=0 (split), got {scores.get(m2_id)}")
check(scores.get(m3_id) == 1, f"m3 score=1 (Alice -1 + Bob +2), got {scores.get(m3_id)}")

sugg, _, _ = req("GET", f"/events/{event_id}/suggestions", token=tok_alice)
m2_sugg = next((m for m in sugg if m["id"] == m2_id), None)
check(m2_sugg and m2_sugg.get("has_veto"), "m2 flagged as vetoed (Bob doesnt want it)")

# ── 10. Input validation ──
section("Input validation")
req("POST", "/auth/register", {"username": "x" * 300, "email": "a@b.com", "password": "pass"}, expect=422)
req("POST", "/auth/register", {"username": "valid", "email": "not-an-email", "password": "pass"}, expect=422)
req("PUT",  f"/movies/{m1_id}/preference", {"preference": "'; DROP TABLE users; --"}, tok_alice, expect=422)
req("POST", "/movies", {"title": ""}, tok_alice, expect=422)
req("GET",  "/events/99999999", token=tok_alice, expect=404)

# ── 11. IDOR: preference write isolation ──
section("IDOR: cannot overwrite another user preference")
# Bob sets m1 to dont_want, Alice sets to want — they should not interfere
req("PUT", f"/movies/{m1_id}/preference", {"preference": "dont_want_to_watch"}, tok_bob)
req("PUT", f"/movies/{m1_id}/preference", {"preference": "want_to_watch"},      tok_alice)
alice_m1, _, _ = req("GET", "/users/me/movies?preference=want_to_watch", token=tok_alice)
bob_m1,   _, _ = req("GET", "/users/me/movies?preference=dont_want_to_watch", token=tok_bob)
check(any(m["id"] == m1_id for m in alice_m1), "Alice preference unchanged by Bob")
check(any(m["id"] == m1_id for m in bob_m1),   "Bob preference unchanged by Alice")

# Summary
print(f"\n{'='*42}")
print(f"  {'ALL TESTS PASSED ✓' if all_pass else 'SOME TESTS FAILED ✗'}")
print(f"  Users: {ALICE['username']}, {BOB['username']}, {CHARLIE['username']}")
