from pathlib import Path
import subprocess,sys,time,signal
log=Path(sys.argv[1]);video=sys.argv[2];deadline=time.monotonic()+150
while time.monotonic()<deadline:
 if log.exists() and 'NAVIGATION_HOLD_START' in log.read_text(errors='replace'):break
 time.sleep(.1)
else:raise RuntimeError('No hold marker')
p=subprocess.Popen(['xcrun','simctl','io','31262733-50DC-46A5-938E-4C462D70F109','recordVideo','--codec=h264','--force',video])
while time.monotonic()<deadline:
 if 'NAVIGATION_HOLD_END' in log.read_text(errors='replace'):break
 time.sleep(.1)
p.send_signal(signal.SIGINT);print('RECORD_EXIT',p.wait(timeout=20),'VIDEO',video)
