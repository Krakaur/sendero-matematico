// An account is independent of a classroom invitation. D1 never receives
// the player's password or the key that decrypts a personal progress copy.
const codePattern = /^[a-f0-9]{32}$/;
const hexPattern = /^[a-f0-9]{64}$/;
const saltPattern = /^[A-Za-z0-9+/]{22}==$/;
const MAX_SNAPSHOT = 512 * 1024;
const MAX_ACCOUNTS = 100; // Hard pilot cap: even maximal copies stay below 52.5 MB plus indexes.

function validSnapshot(value) {
  return value && typeof value === 'object' &&
    Object.keys(value).sort().join(',') === 'data,iv,schema' &&
    value.schema === 'sendero.portable.v1' &&
    typeof value.iv === 'string' && /^[A-Za-z0-9+/]{16}$/.test(value.iv) &&
    typeof value.data === 'string' &&
    value.data.length >= 24 && value.data.length <= MAX_SNAPSHOT &&
    /^[A-Za-z0-9+/]*={0,2}$/.test(value.data);
}

export async function portableRoute(ctx) {
  const {path,request,env,respond,first,all,run,digest,token,require,readBody,headers} = ctx;
  require(['GET','POST'].includes(request.method),405,'method');
  const day = new Date().toISOString().slice(0,10);
  const quota = async (scope,limit) => {
    const rows = await all('INSERT INTO usage(day,scope,requests) VALUES(?,?,1) ON CONFLICT(day,scope) DO UPDATE SET requests=requests+1 WHERE requests<? RETURNING requests',day,scope,limit);
    if(!rows.length) {
      headers['Retry-After'] = String(Math.max(1,Math.ceil((Date.parse(day+'T00:00:00Z')+86400000-Date.now())/1000)));
      require(false,429,'daily_budget');
    }
  };
  const publicRoute = ['/portable/register','/portable/challenge','/portable/login'].includes(path);
  if(publicRoute){await quota('portable-public',1000);await quota('global',Number(env.MAX_DAILY_REQUESTS)||10000);}
  let body = publicRoute && request.method === 'POST' ? await readBody(request,768*1024) : null;
  if(path === '/portable/register' && request.method === 'POST') {
    await quota('portable-register',50);
    require(body && codePattern.test(body.code) && saltPattern.test(body.salt) && hexPattern.test(body.verifier) &&
      /^[a-zA-Z0-9-]{1,60}$/.test(body.profileId) && validSnapshot(body.snapshot),400,'invalid_account');
    const codeHash=await digest(body.code),verifierHash=await digest(body.verifier),secret=token();
    const found=await first('SELECT code_hash FROM portable_accounts WHERE code_hash=?',codeHash);
    require(!found,409,'code_exists');
    const inserted=await run('INSERT INTO portable_accounts(code_hash,salt,verifier_hash,profile_id,revision,snapshot,created_at,updated_at) SELECT ?,?,?,?,1,?,?,? WHERE (SELECT COUNT(*) FROM portable_accounts)<?',codeHash,body.salt,verifierHash,body.profileId,JSON.stringify(body.snapshot),new Date().toISOString(),new Date().toISOString(),MAX_ACCOUNTS);
    require(inserted.meta.changes===1,503,'account_capacity');
    await run('INSERT INTO portable_tokens(hash,code_hash,created_at) VALUES(?,?,?)',await digest(secret),codeHash,new Date().toISOString());
    return respond({token:secret,revision:1},201);
  }
  if(path === '/portable/challenge' && request.method === 'POST') {
    require(body && codePattern.test(body.code),400,'invalid_code');
    const codeHash=await digest(body.code);
    const row=await first('SELECT salt FROM portable_accounts WHERE code_hash=?',codeHash);
    require(row,404,'account_not_found');
    return respond({salt:row.salt});
  }
  if(path === '/portable/login' && request.method === 'POST') {
    require(body && codePattern.test(body.code) && hexPattern.test(body.verifier),400,'invalid_login');
    const codeHash=await digest(body.code);
    await quota('portable-login:'+codeHash,20);
    const row=await first('SELECT verifier_hash,profile_id,revision,snapshot FROM portable_accounts WHERE code_hash=?',codeHash);
    require(row && row.verifier_hash===await digest(body.verifier),401,'invalid_login');
    const secret=token();
    await run('DELETE FROM portable_tokens WHERE code_hash=? AND (created_at<? OR hash NOT IN (SELECT hash FROM portable_tokens WHERE code_hash=? ORDER BY created_at DESC LIMIT 4))',codeHash,new Date(Date.now()-30*86400000).toISOString(),codeHash);
    await run('INSERT INTO portable_tokens(hash,code_hash,created_at) VALUES(?,?,?)',await digest(secret),codeHash,new Date().toISOString());
    return respond({token:secret,revision:row.revision,profileId:row.profile_id,snapshot:JSON.parse(row.snapshot)});
  }
  const bearer=request.headers.get('Authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  require(bearer,401,'unauthorized');
  await quota('portable-auth-attempts',2000);
  const tokenHash=await digest(bearer);
  const account=await first('SELECT a.code_hash,a.profile_id,a.revision,a.snapshot,a.last_operation_id,a.last_operation_digest FROM portable_tokens t JOIN portable_accounts a ON a.code_hash=t.code_hash WHERE t.hash=? AND t.created_at>?',tokenHash,new Date(Date.now()-30*86400000).toISOString());
  require(account,401,'unauthorized');
  await quota('portable-account:'+account.code_hash,1000);
  await quota('global',Number(env.MAX_DAILY_REQUESTS)||10000);
  if(request.method==='POST')body=await readBody(request,768*1024);
  if(path==='/portable/state' && request.method==='GET')
    return respond({revision:account.revision,profileId:account.profile_id,snapshot:JSON.parse(account.snapshot)});
  if(path==='/portable/logout' && request.method==='POST') {
    await run('DELETE FROM portable_tokens WHERE hash=?',tokenHash);
    return respond({revoked:true});
  }
  if(path==='/portable/save' && request.method==='POST') {
    require(body && Number.isSafeInteger(body.expectedRevision) && body.expectedRevision>=1 && /^[a-f0-9]{32}$/.test(body.operationId) && validSnapshot(body.snapshot),400,'invalid_snapshot');
    const payload=JSON.stringify(body.snapshot),payloadDigest=await digest(payload);
    if(account.revision===body.expectedRevision+1 && account.last_operation_id===body.operationId && account.last_operation_digest===payloadDigest)return respond({revision:account.revision,operationId:body.operationId,snapshotDigest:payloadDigest,replayed:true});
    const result=await run('UPDATE portable_accounts SET snapshot=?,revision=revision+1,last_operation_id=?,last_operation_digest=?,updated_at=? WHERE code_hash=? AND revision=?',payload,body.operationId,payloadDigest,new Date().toISOString(),account.code_hash,body.expectedRevision);
    require(result.meta.changes===1,409,'revision_conflict');
    return respond({revision:body.expectedRevision+1,operationId:body.operationId,snapshotDigest:payloadDigest});
  }
  require(false,404,'route');
}
