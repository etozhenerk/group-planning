// Behaviour-only revision: native keyboard visibility is verified in each client.
document.addEventListener('click', (event) => {
  const input = document.getElementById('message-input');
  if (event.detail > 0 && input instanceof HTMLTextAreaElement &&
      document.activeElement === input && event.target !== input) {
    input.blur();
  }
}, true);
