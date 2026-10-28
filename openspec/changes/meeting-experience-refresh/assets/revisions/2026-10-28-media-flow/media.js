const dialog = document.querySelector('dialog');
const input = document.querySelector('#files');
const params = new URLSearchParams(location.search);
const kind = params.get('kind') || 'memory';
const file = kind === 'file';
document.querySelector('#upload-title').textContent = kind === 'memory' ? 'Добавить фото в альбом' : file ? 'Отправить файлы' : 'Отправить фото';
document.querySelector('#choose').textContent = file ? '+ Выбрать файлы' : '+ Выбрать фото';
document.querySelector('#send').textContent = kind === 'memory' ? 'Добавить в альбом' : 'Отправить';
if (file) input.removeAttribute('accept');
document.querySelector('iframe').src = kind === 'memory' ? '../../album-empty.html' : '../../chat.html';
dialog.showModal();
document.querySelector('#close').onclick = () => dialog.close();
document.querySelector('#choose').onclick = () => input.click();
input.addEventListener('cancel', (event) => event.stopPropagation());
input.onchange = () => {
  for (const file of input.files) {
    const item = document.createElement('div');
    if (file.type.startsWith('image/')) {
      const image = document.createElement('img');
      image.src = URL.createObjectURL(file);
      image.alt = file.name;
      item.append(image);
      const remove = document.createElement('button');
      remove.className = 'remove-photo';
      remove.textContent = '×';
      remove.setAttribute('aria-label', `Убрать ${file.name}`);
      remove.onclick = () => { URL.revokeObjectURL(image.src); item.remove(); document.querySelector('#send').disabled = !document.querySelector('#previews').children.length; };
      item.append(remove);
    } else item.textContent = file.name;
    document.querySelector('#previews').append(item);
  }
  input.value = '';
  document.querySelector('#send').disabled = !document.querySelector('#previews').children.length;
};

document.querySelector('#send').onclick = () => {
  const send = document.querySelector('#send');
  send.disabled = true;
  send.textContent = 'Отправка…';
  setTimeout(() => dialog.close(), 1000);
};
