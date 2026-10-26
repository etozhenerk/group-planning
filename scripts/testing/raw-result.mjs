// Import only observed runner results. Unsupported formats stay manual/partial.
export const rawPassed = (body, ref, environment, createdAt) => {
  const recent = (time) => {
    const value = typeof time === 'number' ? time : Date.parse(time);
    return Number.isFinite(value) && value >= Date.parse(createdAt) && value <= Date.now() + 60_000;
  };
  let value;
  try { value = JSON.parse(body); } catch { /* Go emits JSON lines. */ }
  if (Array.isArray(value?.suites)) {
    const matches = [];
    const visit = (suite) => {
      for (const spec of suite.specs ?? []) {
        if (spec.title !== ref.selector || !ref.path.endsWith(spec.file ?? value.config?.rootDir ?? '\0')) continue;
        for (const test of spec.tests ?? []) if (test.projectName === environment.device) matches.push(test);
      }
      for (const child of suite.suites ?? []) visit(child);
    };
    value.suites.forEach(visit);
    return matches.length === 1 && matches[0].expectedStatus === 'passed' && matches[0].results?.length === 1 && matches[0].results[0].status === 'passed' && recent(matches[0].results[0].startTime);
  }
  if (Array.isArray(value?.testResults)) {
    const assertions = value.testResults.filter((file) => file.name?.endsWith(ref.path) && recent(file.startTime))
      .flatMap((file) => file.assertionResults ?? []).filter((test) => test.fullName === ref.selector);
    return assertions.length === 1 && assertions[0].status === 'passed';
  }
  if (ref.path.endsWith('_test.go')) {
    const events = body.trim().split('\n').map((line) => { try { return JSON.parse(line); } catch { return {}; } });
    const relativePackage = ref.path.split('/').slice(1, -1).join('/');
    const terminal = events.filter((e) => e.Test === ref.selector && e.Package?.endsWith(relativePackage) && ['pass', 'fail', 'skip'].includes(e.Action));
    const starts = events.filter((e) => e.Test === ref.selector && e.Package?.endsWith(relativePackage) && e.Action === 'run');
    return starts.length === 1 && recent(starts[0].Time) && terminal.length === 1 && terminal[0].Action === 'pass' && recent(terminal[0].Time);
  }
  return false;
};
