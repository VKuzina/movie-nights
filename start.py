"""
Movie Nights — start both servers with one command.
Run from the project root: python start.py
"""
import subprocess
import socket
import sys
import time
import os

BACKEND_PORT = 8000
FRONTEND_PORT = 5173
ROOT = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT, "backend")
FRONTEND_DIR = os.path.join(ROOT, "frontend")


def kill_port(port):
    r = subprocess.run(
        ["powershell", "-NoProfile", "-Command",
         f"Get-NetTCPConnection -LocalPort {port} -ErrorAction SilentlyContinue | "
         f"Select-Object -ExpandProperty OwningProcess"],
        capture_output=True, text=True,
    )
    pids = [p.strip() for p in r.stdout.strip().split() if p.strip().isdigit()]
    for pid in pids:
        subprocess.run(["taskkill", "/f", "/pid", pid], capture_output=True)
    if pids:
        print(f"  Killed {len(pids)} process(es) on port {port}")


def port_free(port, timeout=1):
    s = socket.socket()
    s.settimeout(timeout)
    result = s.connect_ex(("127.0.0.1", port))
    s.close()
    return result != 0


def wait_for_port(port, timeout=15):
    deadline = time.time() + timeout
    while time.time() < deadline:
        if not port_free(port, timeout=0.5):
            return True
        time.sleep(0.5)
    return False


def update_vite_proxy(port):
    config_path = os.path.join(FRONTEND_DIR, "vite.config.js")
    with open(config_path) as f:
        content = f.read()
    import re
    updated = re.sub(
        r'target:\s*"http://localhost:\d+"',
        f'target: "http://localhost:{port}"',
        content,
    )
    with open(config_path, "w") as f:
        f.write(updated)


print("=== Movie Nights Startup ===\n")

# 1. Free up ports
print(f"Freeing ports {BACKEND_PORT} and {FRONTEND_PORT}...")
kill_port(BACKEND_PORT)
kill_port(FRONTEND_PORT)
time.sleep(1)

# Fallback if port is still occupied
backend_port = BACKEND_PORT
if not port_free(BACKEND_PORT):
    backend_port = 8080
    kill_port(backend_port)
    time.sleep(1)
    print(f"  Port {BACKEND_PORT} still busy, using {backend_port}")

# 2. Ensure vite.config.js points at the right port
update_vite_proxy(backend_port)

# 3. Start backend in a new terminal window
print(f"\nStarting backend on port {backend_port}...")
subprocess.Popen(
    ["powershell", "-NoProfile", "-Command",
     f"cd '{BACKEND_DIR}'; python -m uvicorn main:app --port {backend_port} --reload"],
    creationflags=subprocess.CREATE_NEW_CONSOLE,
)

# Wait for backend to come up
if wait_for_port(backend_port, timeout=15):
    print(f"  Backend ready at http://localhost:{backend_port}")
    print(f"  API docs at  http://localhost:{backend_port}/docs")
else:
    print(f"  WARNING: backend did not start within 15s — check the terminal window")

# 4. Start frontend in a new terminal window
print(f"\nStarting frontend...")
subprocess.Popen(
    ["powershell", "-NoProfile", "-Command",
     f"cd '{FRONTEND_DIR}'; npm run dev"],
    creationflags=subprocess.CREATE_NEW_CONSOLE,
)

if wait_for_port(FRONTEND_PORT, timeout=20):
    print(f"  Frontend ready at http://localhost:{FRONTEND_PORT}")
else:
    # Vite may have picked a different port if 5173 was busy
    print(f"  Frontend started (may be on http://localhost:5174 if 5173 was busy)")

print("\n✓ All done. Both server windows are open.")
print("  Close those two terminal windows to shut everything down.\n")
