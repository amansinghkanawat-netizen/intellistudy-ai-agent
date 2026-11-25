import urllib.request, json, sys

BASE = 'http://localhost:8000/api'
results = []
failures = []

def post(path, body, token=None):
    req = urllib.request.Request(BASE+path, json.dumps(body).encode(), {'Content-Type':'application/json'})
    if token: req.add_header('Authorization', f'Bearer {token}')
    with urllib.request.urlopen(req) as r: return json.loads(r.read())

def get(path, token):
    req = urllib.request.Request(BASE+path)
    req.add_header('Authorization', f'Bearer {token}')
    with urllib.request.urlopen(req) as r: return json.loads(r.read())

def patch(path, body, token):
    req = urllib.request.Request(BASE+path, json.dumps(body).encode(), {'Content-Type':'application/json'}, method='PATCH')
    req.add_header('Authorization', f'Bearer {token}')
    with urllib.request.urlopen(req) as r: return json.loads(r.read())

def put(path, body, token):
    req = urllib.request.Request(BASE+path, json.dumps(body).encode(), {'Content-Type':'application/json'}, method='PUT')
    req.add_header('Authorization', f'Bearer {token}')
    with urllib.request.urlopen(req) as r: return json.loads(r.read())

def check(label, cond):
    if cond:
        results.append(f'PASS  {label}')
    else:
        results.append(f'FAIL  {label}')
        failures.append(label)

try:
    # 1. Login
    login = post('/auth/login', {'email':'admin@test.ai','password':'Test1234'})
    tok = login['access_token']
    check('Login as admin', login['user']['role'] == 'admin')

    # 2. GET /auth/me
    me = get('/auth/me', tok)
    check('GET /auth/me', me['email'] == 'admin@test.ai')

    # 3. PATCH /auth/profile
    p = patch('/auth/profile', {'name':'Test Admin','education_level':'Bachelors'}, tok)
    check('PATCH /auth/profile', p['name'] == 'Test Admin')

    # 4. PUT /auth/change-password
    cp = put('/auth/change-password', {'current_password':'Test1234','new_password':'Test5678'}, tok)
    check('PUT /auth/change-password', 'successfully' in cp['message'])

    # 5. Re-login with new password
    rl = post('/auth/login', {'email':'admin@test.ai','password':'Test5678'})
    tok2 = rl['access_token']
    check('Re-login with new password', bool(tok2))

    # 6. GET /admin/users
    users = get('/admin/users', tok2)
    check('GET /admin/users', users['total'] >= 1)

    # 7. GET /flashcards (list)
    flist = get('/flashcards', tok2)
    check('GET /flashcards list', isinstance(flist, list))

    # 8. GET /flashcards/{set_id}
    if flist:
        sid = flist[0]['id']
        fset = get(f'/flashcards/{sid}', tok2)
        check('GET /flashcards/{set_id}', 'cards' in fset)
    else:
        results.append('SKIP  GET /flashcards/{set_id} (no sets yet)')

    # 9. GET /dashboard/stats
    stats = get('/dashboard/stats', tok2)
    check('GET /dashboard/stats', 'total_resources' in stats)

    # 10. GET /analytics
    ana = get('/analytics', tok2)
    check('GET /analytics', 'exam_readiness' in ana)

    # 11. GET /dashboard/recommendations
    recs = get('/dashboard/recommendations', tok2)
    check('GET /dashboard/recommendations', 'recommendations' in recs)

    # 12. GET /agent/status
    ast = get('/agent/status', tok2)
    check('GET /agent/status', 'agents' in ast)

    # 13. POST /agent/orchestrate
    orch = post('/agent/orchestrate', {'subject':'Data Structures','score':45.0}, tok2)
    check('POST /agent/orchestrate', 'orchestrated_at' in orch)

    # 14. Reset password
    put('/auth/change-password', {'current_password':'Test5678','new_password':'Test1234'}, tok2)
    verify = post('/auth/login', {'email':'admin@test.ai','password':'Test1234'})
    check('Password reset back to Test1234', bool(verify['access_token']))

except Exception as e:
    print(f'ERROR: {e}')
    sys.exit(1)

print('=== END-TO-END TEST RESULTS ===')
for r in results:
    print(f'  {r}')
print(f'=== {len(results) - len(failures)}/{len(results)} PASSED ===')
if failures:
    print(f'FAILURES: {failures}')
    sys.exit(1)
