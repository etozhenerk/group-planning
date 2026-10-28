import glob,json,re
results=[]
for path in glob.glob('/var/log/postgresql/postgresql-16-main.log*'):
 if path.endswith('.gz'):continue
 with open(path,errors='replace') as source:
  for line in source:
   if not ('2026-10-27 22:3' in line and ('somewhere_migrator@somewhere_integration' in line or '[53746]' in line)):continue
   if not ('ERROR:' in line or 'STATEMENT:' in line or 'CONTEXT:' in line):continue
   timestamp=line[:23]
   pid=re.search(r'\[(\d+)\]',line)
   item={'timestamp':timestamp,'pid':pid.group(1) if pid else None,'type':'error' if 'ERROR:' in line else ('context' if 'CONTEXT:' in line else 'statement')}
   if 'canceling statement due to statement timeout' in line:item['cause']='statement_timeout'
   elif 'canceling statement due to lock timeout' in line:item['cause']='lock_timeout'
   elif 'terminating connection due to idle-in-transaction timeout' in line:item['cause']='idle_in_transaction_timeout'
   elif 'ERROR:' in line:item['cause']='other_error_redacted'
   if 'DELETE FROM feed_entries WHERE meeting_id=' in line:item['statement']='delete_feed_entries'
   elif 'DELETE FROM request_receipts' in line:item['statement']='delete_request_receipts'
   elif 'DELETE FROM meetings' in line:item['statement']='delete_meetings'
   elif 'STATEMENT:' in line:item['statement']='other_statement_redacted'
   item['knownSQLTokens']=[token for token in ['message_reactions','entry_id','feed_entries','DELETE FROM ONLY','SELECT 1','meetings','FOR KEY SHARE','RI_FKey_cascade_del'] if token in line]
   results.append(item)
print(json.dumps({'oldIntegrationLogMatches':results[-100:]},indent=2))
